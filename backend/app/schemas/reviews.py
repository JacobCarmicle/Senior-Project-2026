from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    seller_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)
    listing_id: str | None = None


class ReviewResponse(BaseModel):
    id: str
    buyer_id: str
    seller_id: str
    rating: int
    comment: str
    created_at: datetime
    listing_id: str | None = None
    listing_title: str | None = None


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int


class SellerRatingSummaryResponse(BaseModel):
    seller_id: str
    review_count: int
    average_rating: float


class SellerTrustScoreResponse(BaseModel):
    seller_id: str
    avg_rating: float
    review_count: int
    report_count: int
    trust_score: float
    trust_badge: str
