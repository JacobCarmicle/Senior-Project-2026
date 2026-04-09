from fastapi import APIRouter, Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.schemas.reviews import (
    ReviewCreateRequest,
    ReviewListResponse,
    ReviewResponse,
    SellerRatingSummaryResponse,
    SellerTrustScoreResponse,
)

import os
from app.services import reviews_supabase
from app.services import reviews_memory as memory
from app.services import notifications_supabase as notif_svc

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
            listing_id=payload.listing_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    # Notify seller of new review
    if _use_supabase():
        try:
            stars = "★" * review["rating"] + "☆" * (5 - review["rating"])
            listing_title = review.get("listing_title") or "a listing"
            notif_svc.create_notification(
                user_id=payload.seller_id,
                type="new_review",
                title="New review received",
                body=f"{stars} — Someone left a review for {listing_title}",
                link=f"/user/{payload.seller_id}",
            )
        except Exception:
            pass  # Don't fail the review if notification fails

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

@router.delete("/delete/{review_id}")
def delete_review_endpoint(review_id: str, user=Depends(get_current_user)):
    print("Hello!")
    success = reviews_supabase.delete_review(
        review_id=review_id,
        user_id=user["id"],
        is_admin=user.get("role") == "admin",
    )
    return {"success": success}


@router.get("/seller/{seller_id}/trust", response_model=SellerTrustScoreResponse)
def seller_trust_score(seller_id: str):
    if not _use_supabase():
        raise HTTPException(status_code=501, detail="Trust scores require Supabase backend")
    score = reviews_supabase.get_seller_trust_score(seller_id)
    return SellerTrustScoreResponse(**score)
