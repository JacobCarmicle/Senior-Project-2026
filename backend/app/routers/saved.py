from fastapi import APIRouter, Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.schemas.listings import ListingListResponse, ListingResponse
from app.services import listings as listings_service
from app.services import saved as saved_service

router = APIRouter(tags=["saved"])


@router.get("/user/me/saved", response_model=ListingListResponse)
def get_saved_listings(current_user: dict = Depends(get_current_user)):
    items = saved_service.get_saved_listings(current_user["id"])
    responses = [ListingResponse(**item) for item in items]
    return ListingListResponse(items=responses, total=len(responses), page=1, page_size=len(responses))


@router.post("/listings/{listing_id}/save")
def toggle_save(listing_id: str, current_user: dict = Depends(get_current_user)):
    listing = listings_service.get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    now_saved = saved_service.toggle_save(current_user["id"], listing_id)
    return {"saved": now_saved}
