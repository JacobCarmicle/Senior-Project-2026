from fastapi import APIRouter, Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.schemas.reviews import (
    ReviewCreateRequest,
    ReviewListResponse,
    ReviewResponse,
    SellerRatingSummaryResponse,
)

import os;
from app.services import reviews_supabase
from app.services import reviews_memory as memory

router = APIRouter(prefix="/reviews", tags=["reviews"])

def _use_supabase() -> bool:
    result = os.environ.get("REVIEWS_BACKEND", "memory").lower() == "supabase"
    print(result)
    return result

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreateRequest, current_user: dict = Depends(get_current_user)):
    backend = reviews_supabase if _use_supabase() else memory
    try:
        review = backend.create_review(
            buyer_id=current_user["id"],
            seller_id=payload.seller_id,
            rating=payload.rating,
            comment=payload.comment,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return ReviewResponse(**review)

@router.get("/seller/{seller_id}", response_model=ReviewListResponse)
def list_reviews_for_seller(seller_id: str):
    items = None
    if _use_supabase():
        items = reviews_supabase.list_reviews_for_seller(seller_id)
    else:
        items = memory.list_reviews_for_seller(seller_id)
    return ReviewListResponse(items=[ReviewResponse(**x) for x in items], total=len(items))\


@router.get("/seller/{seller_id}/rating-summary", response_model=SellerRatingSummaryResponse)
def seller_rating_summary(seller_id: str):
    summary = None
    if _use_supabase():
        summary = reviews_supabase.get_seller_rating_summary(seller_id)
    else:
        summary = memory.get_seller_rating_summary(seller_id)
    
    return SellerRatingSummaryResponse(**summary)
