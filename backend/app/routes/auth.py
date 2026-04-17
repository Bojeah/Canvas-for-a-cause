from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import ADMIN_EMAIL
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.audit_service import create_audit_log
from app.services.email_service import notify_welcome_email

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    payload: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> User:
    """Register a bidder and enqueue welcome email without blocking the response."""
    if payload.email.strip().lower() == ADMIN_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    with db.begin():
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role="bidder",
        )
        db.add(user)
        db.flush()
        create_audit_log(
            db,
            user_id=user.id,
            action_type="user_registered",
            entity_type="user",
            entity_id=user.id,
            metadata={"email": user.email, "role": user.role},
            ip_address=request.client.host if request.client else None,
        )
        background_tasks.add_task(notify_welcome_email, user)
        return user


@router.post("/login", response_model=TokenResponse)
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
