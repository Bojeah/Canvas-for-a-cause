from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BidCreate(BaseModel):
    amount: int = Field(gt=0)


class BidRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    artwork_id: int
    amount: int
    timestamp: datetime


class AdminBidRead(BaseModel):
    id: int
    user_id: int
    user_full_name: str | None
    user_email: str | None
    artwork_id: int
    artwork_title: str | None
    amount: int
    timestamp: datetime
