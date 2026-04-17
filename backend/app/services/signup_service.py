from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import ADMIN_EMAIL
from app.core.security import get_password_hash
from app.models.user import User
from app.services.audit_service import create_audit_log
from app.services.email_validation_service import validate_email_for_signup


def register_bidder(
    db: Session,
    *,
    email: str,
    password: str,
    ip_address: str | None,
) -> User:
    normalized_email = email.strip().lower()
    if normalized_email == ADMIN_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    with db.begin():
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        validation_status = validate_email_for_signup(normalized_email)
        if validation_status == "invalid":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")

        user = User(
            email=normalized_email,
            password_hash=get_password_hash(password),
            role="bidder",
            email_status=validation_status,
        )
        db.add(user)
        db.flush()

        create_audit_log(
            db,
            user_id=user.id,
            action_type="user_registered",
            entity_type="user",
            entity_id=user.id,
            metadata={"email": user.email, "role": user.role, "email_status": user.email_status},
            ip_address=ip_address,
        )

        return user
