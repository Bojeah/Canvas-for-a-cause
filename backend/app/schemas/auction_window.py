from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuctionWindowUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    vip_exhibition_at: datetime | None = None
    bidding_starts_at: datetime | None = None
    bidding_ends_at: datetime | None = None


class AuctionWindowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    vip_exhibition_at: datetime
    bidding_starts_at: datetime
    bidding_ends_at: datetime
    closed_at: datetime | None
    phase: str
    countdown_target: datetime | None
    is_live: bool
    is_closed: bool
    created_at: datetime
    updated_at: datetime