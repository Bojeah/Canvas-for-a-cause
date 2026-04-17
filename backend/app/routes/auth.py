from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limiter import limiter
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.audit_service import create_audit_log
from app.services.email_service import notify_welcome_email
from app.services.signup_service import register_bidder

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute", key_func=get_remote_address)
def register(
    request: Request,
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> User:
    """Register a bidder and enqueue welcome email without blocking the response."""
    user = register_bidder(
        db,
        email=payload.email,
        password=payload.password,
        ip_address=request.client.host if request.client else None,
    )
    background_tasks.add_task(notify_welcome_email, user)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute", key_func=get_remote_address)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    with db.begin():
        user = db.query(User).filter(User.email == payload.email).first()
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        create_audit_log(
            db,
            user_id=user.id,
            action_type="user_login",
            entity_type="user",
            entity_id=user.id,
            metadata={"email": user.email},
            ip_address=request.client.host if request.client else None,
        )
        token = create_access_token(subject=str(user.id), extra_claims={"role": user.role})
        return TokenResponse(access_token=token)
