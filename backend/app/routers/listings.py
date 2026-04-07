from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.routers.auth import get_current_user
from app.schemas.listings import (
    ListingCreateRequest,
    ListingListResponse,
    ListingResponse,
    ListingUpdateRequest,
)
from app.services import listings

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreateRequest, current_user: dict = Depends(get_current_user)):
    item = listings.create_listing(payload.model_dump(), current_user["id"])
    return ListingResponse(**item)


@router.get("", response_model=ListingListResponse)
def list_listings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: float | None = Query(default=None, gt=0),
    sort: str | None = Query(default=None),
):
    items, total = listings.list_public_listings(
        page=page,
        page_size=page_size,
        user_lat=user_lat,
        user_lng=user_lng,
        radius_miles=radius_miles,
        sort=sort,
    )
    return ListingListResponse(items=[ListingResponse(**x) for x in items], total=total, page=page, page_size=page_size)


@router.get("/search", response_model=ListingListResponse)
def search_listings(
    keyword: str | None = None,
    category: str | None = None,
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: float | None = Query(default=None, gt=0),
    sort: str | None = Query(default=None),
):
    items, total = listings.search_listings(
        keyword,
        category,
        min_price,
        max_price,
        page,
        page_size,
        user_lat=user_lat,
        user_lng=user_lng,
        radius_miles=radius_miles,
        sort=sort,
    )
    return ListingListResponse(items=[ListingResponse(**x) for x in items], total=total, page=page, page_size=page_size)


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: str):
    item = listings.get_listing(listing_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return ListingResponse(**item)


@router.patch("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: str,
    payload: ListingUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    is_admin = current_user.get("role") == "admin"
    try:
        item = listings.update_listing(listing_id, current_user["id"], payload.model_dump(exclude_unset=True), is_admin=is_admin)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden") from exc

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return ListingResponse(**item)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    is_admin = current_user.get("role") == "admin"
    try:
        ok = listings.delete_listing(listing_id, current_user["id"], is_admin=is_admin)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden") from exc

    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
