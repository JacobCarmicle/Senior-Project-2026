from fastapi import APIRouter, Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.schemas.reviews import ReviewCreateRequest, ReviewListResponse, ReviewResponse
from app.services import reviews

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreateRequest, current_user: dict = Depends(get_current_user)):
    try:
        review = reviews.create_review(
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
    items = reviews.list_reviews_for_seller(seller_id)
    return ReviewListResponse(items=[ReviewResponse(**x) for x in items], total=len(items))
