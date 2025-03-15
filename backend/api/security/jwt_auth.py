from fastapi import Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Dict
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
import os
from datetime import datetime, timedelta
from redis import Redis
import secrets


security = HTTPBearer()

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
MIN_PASSWORD_LENGTH = 12


# Initialize Redis for token blacklist
redis_client = Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

RATE_LIMIT_WINDOW = 900  # 15 minutes in seconds
MAX_REQUESTS = 100


class TokenValidator:
    def __init__(self):
        self.request_counts = {}
        self._cleanup_interval = 3600  # 1 hour
        self._refresh_tokens = {}
        self._last_cleanup = datetime.utcnow()
        self._token_cache = {}
        self._cache_hits = 0
        self._cache_misses = 0

    async def cleanup_expired_tokens(self):
        current_time = datetime.utcnow().timestamp()
        expired_users = []

        for user_id, timestamps in self.request_counts.items():
            valid_requests = [
                t for t in timestamps if t > current_time - RATE_LIMIT_WINDOW
            ]
            if not valid_requests:
                expired_users.append(user_id)
            else:
                self.request_counts[user_id] = valid_requests

        for user_id in expired_users:
            del self.request_counts[user_id]

    async def optimize_token_storage(self):
        current_time = datetime.utcnow()
        time_since_last_cleanup = (current_time - self._last_cleanup).seconds
        if time_since_last_cleanup > self._cleanup_interval:
            await self.cleanup_expired_tokens()
            expired = [
                token
                for token, exp in self._refresh_tokens.items()
                if exp < current_time
            ]
            for token in expired:
                del self._refresh_tokens[token]
            self._last_cleanup = current_time

    async def store_refresh_token(self, token: str, expiry: datetime):
        await self.optimize_token_storage()
        self._refresh_tokens[token] = expiry

    async def get_performance_metrics(self) -> Dict[str, int]:
        return {
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "active_tokens": len(self._refresh_tokens),
            "request_count": sum(
                len(reqs) for reqs in self.request_counts.values()
            ),
        }

    async def validate_and_decode_token(
        self, token: str, secret_key: str
    ) -> Dict:
        cache_key = f"{token}:{secret_key}"
        if cache_key in self._token_cache:
            self._cache_hits += 1
            return self._token_cache[cache_key]

        self._cache_misses += 1
        try:
            payload = jwt.decode(
                token, secret_key, algorithms=[JWT_ALGORITHM]
            )
            is_blacklisted = await redis_client.get(f"blacklist:{token}")

            if is_blacklisted:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked",
                )
            self._token_cache[cache_key] = payload
            return payload
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
            )

    def check_rate_limit(self, user_id: str) -> bool:
        current_time = datetime.utcnow().timestamp()
        if user_id in self.request_counts:
            requests = [
                t for t in self.request_counts[user_id]
                if t > current_time - RATE_LIMIT_WINDOW
            ]
            if len(requests) >= MAX_REQUESTS:
                return False
            self.request_counts[user_id] = requests
        else:
            self.request_counts[user_id] = []
        self.request_counts[user_id].append(current_time)
        return True


token_validator = TokenValidator()


def generate_secure_key() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(data: dict) -> str:
    if not os.getenv("JWT_SECRET_KEY"):
        raise ValueError("JWT_SECRET_KEY environment variable not set")

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        **data,
        "exp": expire,
        "jti": secrets.token_urlsafe(16),
    }

    return jwt.encode(
        to_encode,
        os.getenv("JWT_SECRET_KEY"),
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {**data, "exp": expire, "refresh": True}
    return jwt.encode(
        to_encode,
        os.getenv("JWT_SECRET_KEY"),
        algorithm=JWT_ALGORITHM,
    )


async def validate_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict:
    try:
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )

        token = credentials.credentials
        secret_key = os.getenv("JWT_SECRET_KEY")

        if not secret_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret key not configured",
            )

        try:
            payload = await token_validator.validate_and_decode_token(
                token, secret_key
            )
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        except InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        if not token_validator.check_rate_limit(payload["user_id"]):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


async def refresh_access_token(
    refresh_token: str, background_tasks: BackgroundTasks
) -> Dict:
    try:
        payload = jwt.decode(
            refresh_token,
            os.getenv("JWT_SECRET_KEY"),
            algorithms=[JWT_ALGORITHM],
        )
        if not payload.get("refresh"):
            raise HTTPException(
                status_code=400,
                detail="Invalid refresh token",
            )

        new_token = create_access_token({"user_id": payload["user_id"]})
        background_tasks.add_task(
            rotate_refresh_token, old_token=refresh_token
        )

        return {"access_token": new_token}
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )


async def rotate_refresh_token(old_token: str) -> None:
    """Blacklist old refresh tokens"""
    await redis_client.setex(
        f"blacklist:{old_token}", 604800, "1"
    )  # 7 days
