from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ArtworkImage(BaseModel):
    url: HttpUrl
    thumbnail_url: HttpUrl | None = None


class ArtworkBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    artist_name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    images: list[ArtworkImage] = Field(default_factory=list)
    starting_price: int = Field(ge=0)
    auction_end_time: datetime | None = None

    @field_validator("images")
    @classmethod
    def validate_images(cls, value: list[ArtworkImage]) -> list[ArtworkImage]:
        if len(value) > 10:
            raise ValueError("A maximum of 10 images is allowed per artwork")
        return value


class ArtworkCreate(ArtworkBase):
    pass


class ArtworkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    artist_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    images: list[ArtworkImage] | None = None
    starting_price: int | None = Field(default=None, ge=0)
    auction_end_time: datetime | None = None
    status: Literal["active", "closed"] | None = None

    @field_validator("images")
    @classmethod
    def validate_images(cls, value: list[ArtworkImage] | None) -> list[ArtworkImage] | None:
        if value is not None and len(value) > 10:
            raise ValueError("A maximum of 10 images is allowed per artwork")
        return value


class ArtworkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    artist_name: str
    description: str | None
    images: list[ArtworkImage]
    starting_price: int
    current_highest_bid: int
    current_highest_bidder_id: int | None
    auction_end_time: datetime
    status: Literal["active", "closed"]
    created_at: datetime
