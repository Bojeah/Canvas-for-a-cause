from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Artwork(Base):
    __tablename__ = "artworks"

    __table_args__ = (
        CheckConstraint(
            "current_highest_bid >= starting_price", name="check_highest_bid_ge_starting"
        ),
        CheckConstraint("starting_price >= 0", name="check_starting_price_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    artist_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list[dict[str, str | None]]] = mapped_column(JSON, nullable=False, default=list)
    starting_price: Mapped[int] = mapped_column(Integer, nullable=False)
    current_highest_bid: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_highest_bidder_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    auction_end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    highest_bidder = relationship("User", foreign_keys=[current_highest_bidder_id])
    bids = relationship("Bid", back_populates="artwork", cascade="all, delete-orphan")
