from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


ArtworkCurrency = Literal["NGN", "USD"]


class ArtworkImage(BaseModel):
    url: HttpUrl
    thumbnail_url: HttpUrl | None = None


class ArtworkBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    artist_name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    images: list[ArtworkImage] = Field(default_factory=list)
    currency: ArtworkCurrency = "NGN"
    starting_price: int = Field(ge=0)
    auction_end_time: datetime | None = None

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in {"NGN", "USD"}:
            raise ValueError("Unsupported currency")
        return normalized

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
    currency: ArtworkCurrency | None = None
    starting_price: int | None = Field(default=None, ge=0)
    auction_end_time: datetime | None = None
    status: Literal["active", "closed"] | None = None

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
          return None
        normalized = value.strip().upper()
        if normalized not in {"NGN", "USD"}:
            raise ValueError("Unsupported currency")
        return normalized

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
    currency: ArtworkCurrency
    starting_price: int
    current_highest_bid: int
    current_highest_bidder_id: int | None
    auction_end_time: datetime
    status: Literal["active", "closed"]
    created_at: datetime
