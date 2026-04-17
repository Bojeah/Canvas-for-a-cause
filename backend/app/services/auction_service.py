from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import session_scope
from app.models.artwork import Artwork
from app.models.auction_window import AuctionWindow
from app.services.audit_service import create_audit_log

logger = logging.getLogger(__name__)
DEFAULT_AUCTION_DURATION_DAYS = 14


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _create_default_window(db: Session) -> AuctionWindow:
    now = _utc_now()
    window = AuctionWindow(
        title="Canvas for a Cause",
        vip_exhibition_at=now,
        bidding_starts_at=now,
        bidding_ends_at=now + timedelta(days=DEFAULT_AUCTION_DURATION_DAYS),
    )
    db.add(window)
    db.flush()
    return window


def get_current_auction_window(db: Session) -> AuctionWindow:
    window = db.query(AuctionWindow).order_by(AuctionWindow.id.asc()).first()
    if window is None:
        window = _create_default_window(db)
    return window


def _phase(window: AuctionWindow, now: datetime | None = None) -> str:
    current_time = now or _utc_now()
    if window.closed_at is not None:
        return "closed"
    if current_time < _normalize_utc(window.bidding_starts_at):
        return "upcoming"
    if current_time <= _normalize_utc(window.bidding_ends_at):
        return "live"
    return "ended"


def serialize_auction_window(window: AuctionWindow) -> dict[str, object]:
    phase = _phase(window)
    if phase == "upcoming":
        countdown_target = _normalize_utc(window.bidding_starts_at)
    elif phase == "live":
        countdown_target = _normalize_utc(window.bidding_ends_at)
    else:
        countdown_target = None

    return {
        "id": window.id,
        "title": window.title,
        "vip_exhibition_at": _normalize_utc(window.vip_exhibition_at),
        "bidding_starts_at": _normalize_utc(window.bidding_starts_at),
        "bidding_ends_at": _normalize_utc(window.bidding_ends_at),
        "closed_at": _normalize_utc(window.closed_at) if window.closed_at else None,
        "phase": phase,
        "countdown_target": countdown_target,
        "is_live": phase == "live",
        "is_closed": phase == "closed",
        "created_at": _normalize_utc(window.created_at),
        "updated_at": _normalize_utc(window.updated_at),
    }


def update_auction_window(db: Session, payload, *, actor_user_id: int | None, ip_address: str | None) -> AuctionWindow:
    window = get_current_auction_window(db)
    if window.closed_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Auction window is closed")

    changes = payload.model_dump(exclude_unset=True)
    now = _utc_now()

    if "title" in changes and changes["title"] is not None:
        window.title = changes["title"].strip()

    if "vip_exhibition_at" in changes and changes["vip_exhibition_at"] is not None:
        window.vip_exhibition_at = _normalize_utc(changes["vip_exhibition_at"])

    if "bidding_starts_at" in changes and changes["bidding_starts_at"] is not None:
        window.bidding_starts_at = _normalize_utc(changes["bidding_starts_at"])

    if "bidding_ends_at" in changes and changes["bidding_ends_at"] is not None:
        window.bidding_ends_at = _normalize_utc(changes["bidding_ends_at"])

    if window.bidding_ends_at <= window.bidding_starts_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bidding end must be after bidding start")
    if window.bidding_ends_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bidding end must be in the future")

    window.updated_at = now

    # Keep existing artwork end times aligned to the single global bidding window.
    db.query(Artwork).update(
        {Artwork.auction_end_time: window.bidding_ends_at},
        synchronize_session=False,
    )

    create_audit_log(
        db,
        user_id=actor_user_id,
        action_type="auction_window_updated",
        entity_type="auction_window",
        entity_id=window.id,
        metadata=serialize_auction_window(window),
        ip_address=ip_address,
    )
    db.flush()
    return window


def close_auction_window(
    db: Session,
    *,
    actor_user_id: int | None,
    ip_address: str | None,
    reason: str,
) -> AuctionWindow:
    window = get_current_auction_window(db)
    if window.closed_at is not None:
        return window

    now = _utc_now()
    window.closed_at = now
    window.updated_at = now

    db.query(Artwork).update(
        {Artwork.status: "closed"},
        synchronize_session=False,
    )

    create_audit_log(
        db,
        user_id=actor_user_id,
        action_type="auction_window_closed",
        entity_type="auction_window",
        entity_id=window.id,
        metadata={"reason": reason, **serialize_auction_window(window)},
        ip_address=ip_address,
    )
    db.flush()
    return window


def close_expired_auction_window(db: Session, *, actor_user_id: int | None, ip_address: str | None) -> bool:
    window = get_current_auction_window(db)
    if window.closed_at is not None:
        return False
    if _phase(window) != "ended":
        return False

    close_auction_window(
        db,
        actor_user_id=actor_user_id,
        ip_address=ip_address,
        reason="bidding_end_time_reached",
    )
    return True


def close_expired_auction_window_task(*, actor_user_id: int | None = None, ip_address: str | None = None) -> None:
    """Background task entrypoint that owns its DB session."""
    try:
        with session_scope() as db:
            if close_expired_auction_window(db, actor_user_id=actor_user_id, ip_address=ip_address):
                db.commit()
    except Exception:
        logger.error(
            "Background task failed while closing expired auction window",
            extra={"actor_user_id": actor_user_id, "ip_address": ip_address},
            exc_info=True,
        )