from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bid(Base):
    __tablename__ = "bids"

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_bid_amount_positive"),
        Index("idx_artwork_timestamp", "artwork_id", text("timestamp DESC")),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    artwork_id: Mapped[int] = mapped_column(ForeignKey("artworks.id"), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )

    user = relationship("User", back_populates="bids")
    artwork = relationship("Artwork", back_populates="bids")
