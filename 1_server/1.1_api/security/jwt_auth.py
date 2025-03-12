from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, Dict


security = HTTPBearer()


async def validate_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    try:
        # Your token validation logic here
        return {"user_id": "dummy"}  # Replace with actual validation
    except Exception:  # Specific exceptions should be used in production
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
