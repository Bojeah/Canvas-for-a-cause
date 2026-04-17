from datetime import datetime, timezone
from hmac import compare_digest

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import ADMIN_EMAIL, ADMIN_PASSWORD, COOKIE_SETTINGS, MAX_ARTWORKS
from app.core.database import get_db
from app.core.rate_limiter import limiter
from app.core.security import create_access_token, get_password_hash, require_admin
from app.models.artwork import Artwork
from app.models.bid import Bid
from app.models.user import User
from app.schemas.auction_window import AuctionWindowRead, AuctionWindowUpdate
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.artwork import ArtworkCreate, ArtworkRead, ArtworkUpdate
from app.schemas.bid import AdminBidRead
from app.services.audit_service import create_audit_log
from app.services.auction_service import close_auction_window, get_current_auction_window, serialize_auction_window, update_auction_window
from app.services.bidding_service import close_auction

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/auction-window", response_model=AuctionWindowRead)
def get_admin_auction_window(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> dict:
    window = get_current_auction_window(db)
    return serialize_auction_window(window)


@router.put("/auction-window", response_model=AuctionWindowRead)
def update_admin_auction_window(
    payload: AuctionWindowUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    window = update_auction_window(
        db,
        payload,
        actor_user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()
    return serialize_auction_window(window)


@router.post("/auction-window/close", response_model=AuctionWindowRead)
def close_admin_auction_window(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    window = close_auction_window(
        db,
        actor_user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        reason="manual_close",
    )
    db.commit()
    return serialize_auction_window(window)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("3/minute", key_func=get_remote_address)
def admin_login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> Response:
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin auth is not configured",
        )

    normalized_email = payload.email.strip().lower()
    if not compare_digest(normalized_email, ADMIN_EMAIL) or not compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    with db.begin():
        user = db.query(User).filter(User.email == normalized_email).first()
        if user is None:
            user = User(
                full_name="Administrator",
                email=normalized_email,
                password_hash=get_password_hash(ADMIN_PASSWORD),
                role="admin",
            )
            db.add(user)
            db.flush()
        elif user.role != "admin":
            user.role = "admin"
            user.password_hash = get_password_hash(ADMIN_PASSWORD)

        create_audit_log(
            db,
            user_id=user.id,
            action_type="admin_login",
            entity_type="user",
            entity_id=user.id,
            metadata={"email": user.email},
            ip_address=request.client.host if request.client else None,
        )

        token = create_access_token(subject=str(user.id), extra_claims={"role": "admin"})
        
        # Create response with token
        response_data = TokenResponse(access_token=token)
        response = Response(
            content=response_data.model_dump_json(),
            media_type="application/json",
        )
        
        # Set HTTP-only cookie with the token
        response.set_cookie(value=token, **COOKIE_SETTINGS)
        
        return response


@router.post("/artworks", response_model=ArtworkRead, status_code=status.HTTP_201_CREATED)
def create_artwork(
    request: Request,
    payload: ArtworkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Artwork:
    try:
        window = get_current_auction_window(db)
        total_artworks = db.query(Artwork).count()
        if total_artworks >= MAX_ARTWORKS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Maximum of {MAX_ARTWORKS} artworks reached",
            )

        artwork = Artwork(
            title=payload.title,
            artist_name=payload.artist_name,
            description=payload.description,
            images=[image.model_dump(mode="json") for image in payload.images],
            starting_price=payload.starting_price,
            current_highest_bid=payload.starting_price,
            current_highest_bidder_id=None,
            auction_end_time=window.bidding_ends_at,
            status="active",
        )
        db.add(artwork)
        db.flush()

        create_audit_log(
            db,
            user_id=current_user.id,
            action_type="artwork_created",
            entity_type="artwork",
            entity_id=artwork.id,
            metadata={
                "title": artwork.title,
                "artist_name": artwork.artist_name,
                "starting_price": artwork.starting_price,
                "auction_end_time": artwork.auction_end_time.isoformat(),
                "auction_window_id": window.id,
            },
            ip_address=request.client.host if request.client else None,
        )
        db.commit()
        return artwork
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise


@router.patch("/artworks/{artwork_id}", response_model=ArtworkRead)
def update_artwork(
    artwork_id: int,
    payload: ArtworkUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Artwork:
    try:
        window = get_current_auction_window(db)
        artwork = db.execute(select(Artwork).where(Artwork.id == artwork_id).with_for_update()).scalar_one_or_none()
        if artwork is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found")

        original_state = {
            "title": artwork.title,
            "artist_name": artwork.artist_name,
            "description": artwork.description,
            "images": artwork.images,
            "starting_price": artwork.starting_price,
            "current_highest_bid": artwork.current_highest_bid,
            "auction_end_time": artwork.auction_end_time.isoformat(),
            "status": artwork.status,
        }

        changes = payload.model_dump(exclude_unset=True, mode="json")

        if "auction_end_time" in changes and changes["auction_end_time"] is not None:
            end_time = changes["auction_end_time"]
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            else:
                end_time = end_time.astimezone(timezone.utc)
            if end_time <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="auction_end_time must be in the future",
                )
            changes["auction_end_time"] = end_time
        else:
            changes["auction_end_time"] = window.bidding_ends_at

        if "starting_price" in changes:
            new_starting_price = changes["starting_price"]
            if new_starting_price is not None and new_starting_price > artwork.current_highest_bid:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="starting_price cannot exceed current_highest_bid",
                )

        for field_name, value in changes.items():
            setattr(artwork, field_name, value)

        metadata_after = {
            key: (value.isoformat() if isinstance(value, datetime) else value)
            for key, value in changes.items()
        }

        metadata_after["auction_window_id"] = window.id

        create_audit_log(
            db,
            user_id=current_user.id,
            action_type="artwork_updated",
            entity_type="artwork",
            entity_id=artwork.id,
            metadata={"before": original_state, "after": metadata_after},
            ip_address=request.client.host if request.client else None,
        )

        db.flush()
        db.commit()
        return artwork
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise


@router.delete("/artworks/{artwork_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artwork(
    artwork_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    try:
        artwork = db.get(Artwork, artwork_id)
        if artwork is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found")

        create_audit_log(
            db,
            user_id=current_user.id,
            action_type="artwork_deleted",
            entity_type="artwork",
            entity_id=artwork.id,
            metadata={"title": artwork.title, "artist_name": artwork.artist_name},
            ip_address=request.client.host if request.client else None,
        )

        db.delete(artwork)
        db.commit()
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise


@router.get("/bids", response_model=list[AdminBidRead])
def list_all_bids(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[dict[str, object]]:
    rows = (
        db.query(Bid, User, Artwork)
        .outerjoin(User, Bid.user_id == User.id)
        .outerjoin(Artwork, Bid.artwork_id == Artwork.id)
        .order_by(Bid.timestamp.desc())
        .all()
    )

    return [
        {
            "id": bid.id,
            "user_id": bid.user_id,
            "user_full_name": user.full_name if user else None,
            "user_email": user.email if user else None,
            "artwork_id": bid.artwork_id,
            "artwork_title": artwork.title if artwork else None,
            "amount": bid.amount,
            "timestamp": bid.timestamp,
        }
        for bid, user, artwork in rows
    ]


@router.post("/close-auction/{artwork_id}", status_code=status.HTTP_204_NO_CONTENT)
def close_auction_endpoint(
    artwork_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    try:
        artwork = db.execute(select(Artwork).where(Artwork.id == artwork_id).with_for_update()).scalar_one_or_none()
        if artwork is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found")

        close_auction(
            db,
            artwork,
            actor_user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
        db.commit()
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise
