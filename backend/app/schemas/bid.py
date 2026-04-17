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
