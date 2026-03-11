from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    seller_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)


class ReviewResponse(BaseModel):
    id: str
    buyer_id: str
    seller_id: str
    rating: int
    comment: str
    created_at: datetime


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int


class SellerRatingSummaryResponse(BaseModel):
    seller_id: str
    review_count: int
    average_rating: float
