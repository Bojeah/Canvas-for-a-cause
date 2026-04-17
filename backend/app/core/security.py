from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import ALGORITHM, SECRET_KEY, access_token_expiry_delta
from app.core.database import get_db
from app.models.user import User

# Use Argon2 for password hashing (more secure than bcrypt)
# The deprecated="auto" allows verification of older hash formats if they exist
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Security scheme for documentation and backward compatibility
http_bearer = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_token_from_request(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    access_token: str | None = Cookie(None),
) -> str:
    """
    Extract JWT token from either:
    1. Authorization header (Bearer token)
    2. HTTP-only cookie (access_token)
    
    Prioritizes Authorization header for backward compatibility.
    """
    if credentials:
        return credentials.credentials
    
    if access_token:
        return access_token
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def create_access_token(subject: str, expires_delta: timedelta | None = None, extra_claims: dict[str, Any] | None = None) -> str:
    to_encode: dict[str, Any] = {"sub": subject}
    if extra_claims:
        to_encode.update(extra_claims)
    expire = datetime.now(timezone.utc) + (expires_delta or access_token_expiry_delta())
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(get_token_from_request), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        raw_user_id = payload.get("sub")
        if raw_user_id is None:
            raise credentials_exception
        user_id = int(raw_user_id)
    except JWTError as exc:
        raise credentials_exception from exc
    except (TypeError, ValueError) as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return current_user
