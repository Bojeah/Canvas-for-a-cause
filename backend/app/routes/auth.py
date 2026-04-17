from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import COOKIE_SETTINGS
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
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        ip_address=request.client.host if request.client else None,
    )
    background_tasks.add_task(notify_welcome_email, user)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute", key_func=get_remote_address)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> Response:
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
        
        # Create response with token
        response_data = TokenResponse(access_token=token)
        response = Response(
            content=response_data.model_dump_json(),
            media_type="application/json",
        )
        
        # Set HTTP-only cookie with the token
        response.set_cookie(value=token, **COOKIE_SETTINGS)
        
        return response


@router.post("/logout")
def logout() -> Response:
    """Clear the authentication cookie."""
    response = Response(
        content='{"message": "logged out"}',
        media_type="application/json",
    )
    # Delete the cookie by setting max_age to 0
    response.delete_cookie(
        key=COOKIE_SETTINGS["key"],
        path=COOKIE_SETTINGS["path"],
    )
    return response
