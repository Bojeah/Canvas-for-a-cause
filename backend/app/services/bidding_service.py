from dataclasses import dataclass
from datetime import datetime, timezone
import logging

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import MIN_BID_INCREMENT
from app.models.artwork import Artwork
from app.models.bid import Bid
from app.models.user import User
from app.services.auction_service import close_auction_window, close_expired_auction_window, get_current_auction_window
from app.services.audit_service import create_audit_log

logger = logging.getLogger(__name__)


@dataclass
class BidPlacementResult:
    bid: Bid
    artwork: Artwork
    previous_bidder: User | None
    previous_bid_amount: int | None


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _close_expired_auction(db: Session, artwork: Artwork, *, actor_user_id: int | None, ip_address: str | None) -> None:
    if artwork.status == "closed":
        return
    artwork.status = "closed"
    create_audit_log(
        db,
        user_id=actor_user_id,
        action_type="auction_closed",
        entity_type="artwork",
        entity_id=artwork.id,
        metadata={"reason": "auction_end_time_reached"},
        ip_address=ip_address,
    )


def close_auction(db: Session, artwork: Artwork, *, actor_user_id: int | None, ip_address: str | None) -> Artwork:
    if artwork.status == "closed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Auction is already closed")
    artwork.status = "closed"
    create_audit_log(
        db,
        user_id=actor_user_id,
        action_type="auction_closed",
        entity_type="artwork",
        entity_id=artwork.id,
        metadata={"reason": "manual_close"},
        ip_address=ip_address,
    )
    db.flush()
    return artwork


def place_bid(db: Session, *, artwork_id: int, user: User, amount: int, ip_address: str | None) -> BidPlacementResult:
    """Place a bid atomically, update artwork state, and return context for async notifications."""
    now = _utc_now()

    try:
        if not db.in_transaction():
            if db.bind and db.bind.dialect.name == "sqlite":
                # Acquire a write-intent lock early in SQLite to reduce concurrent bid races.
                db.execute(text("BEGIN IMMEDIATE"))
            else:
                db.begin()

        window = get_current_auction_window(db)
        if close_expired_auction_window(db, actor_user_id=user.id, ip_address=ip_address):
            db.commit()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Auction has ended")

        if window.closed_at is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Auction is closed")
        if now < window.bidding_starts_at:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Auction has not started")

        artwork_query = select(Artwork).where(Artwork.id == artwork_id).with_for_update()
        artwork = db.execute(artwork_query).scalar_one_or_none()
        if artwork is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found")

        # Block bids on manually closed or already expired artwork before any bid validation.
        if artwork.status == "closed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This auction has been closed",
            )
        if now >= _normalize_utc(artwork.auction_end_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This auction has been closed",
            )

        minimum_allowed = artwork.current_highest_bid + MIN_BID_INCREMENT
        if amount < minimum_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bid must be at least {minimum_allowed}",
            )

        previous_bidder_id = artwork.current_highest_bidder_id
        previous_bid_amount = artwork.current_highest_bid
        previous_bidder: User | None = None
        if previous_bidder_id is not None and previous_bidder_id != user.id:
            previous_bidder = db.get(User, previous_bidder_id)

        # Minimize database roundtrips while holding the lock
        bid = Bid(user_id=user.id, artwork_id=artwork.id, amount=amount)
        db.add(bid)

        artwork.current_highest_bid = amount
        artwork.current_highest_bidder_id = user.id

        create_audit_log(
            db,
            user_id=user.id,
            action_type="bid_placed",
            entity_type="bid",
            entity_id=None,  # Will be populated after commit if needed, or link via relationship
            metadata={
                "artwork_id": artwork.id,
                "amount": amount,
                "previous_highest_bidder_id": previous_bidder_id,
                "previous_highest_bid": previous_bid_amount,
                "auction_window_id": window.id,
            },
            ip_address=ip_address,
        )

        db.commit()

        return BidPlacementResult(
            bid=bid,
            artwork=artwork,
            previous_bidder=previous_bidder,
            previous_bid_amount=previous_bid_amount,
        )
    except HTTPException:
        if db.in_transaction():
            db.rollback()
        raise
    except Exception:
        if db.in_transaction():
            db.rollback()
        raise
