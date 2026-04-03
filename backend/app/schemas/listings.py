from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ListingCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    price: Decimal = Field(ge=0)
    category: str = Field(min_length=1, max_length=80)
    location: str = Field(min_length=1, max_length=120)
    images: list[str] = Field(min_length=1)


class ListingUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    price: Decimal | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, min_length=1, max_length=80)
    location: str | None = Field(default=None, min_length=1, max_length=120)
    status: str | None = Field(default=None)
    images: list[str] | None = Field(default=None, min_length=1)


class ListingResponse(BaseModel):
    id: str
    seller_id: str
    seller_name: str | None = None
    title: str
    description: str
    price: Decimal
    category: str
    location: str
    status: str
    images: list[str]
    distance_miles: float | None = None
    created_at: datetime
    updated_at: datetime


class ListingListResponse(BaseModel):
    items: list[ListingResponse]
    total: int
    page: int
    page_size: int
