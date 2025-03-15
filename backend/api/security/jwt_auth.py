from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, Dict
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
import os
from datetime import datetime, timedelta

security = HTTPBearer()

def create_token(data: dict, expires_delta: timedelta = timedelta(hours=24)) -> str:
    expire = datetime.utcnow() + expires_delta
    to_encode = {**data, "exp": expire}
    return jwt.encode(
        to_encode,
        os.getenv("JWT_SECRET_KEY"),
        algorithm="HS256"
    )

async def validate_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    secret_key = os.getenv("JWT_SECRET_KEY")
    if not secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret key not configured"
        )
    
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            key=secret_key,
            algorithms=["HS256"],
            options={"verify_exp": True}
        )
        if payload.get("refresh", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cannot use refresh token for access"
            )
        return payload  # Contains user data like 'user_id'
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
        ) from e
