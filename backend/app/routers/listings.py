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
from app.services import listings_supabase
from app.services import notifications_supabase as notif_svc
from app.services import reviews_supabase

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreateRequest, current_user: dict = Depends(get_current_user)):
    item = listings.create_listing(payload.model_dump(), current_user["id"])
    return ListingResponse(**item)


@router.get("", response_model=ListingListResponse)
def list_listings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    category: str | None = Query(default=None),
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: float | None = Query(default=None, gt=0),
    sort: str | None = Query(default=None),
):
    items, total = listings.list_public_listings(
        page=page,
        page_size=page_size,
        category=category,
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
    patch = payload.model_dump(exclude_unset=True)

    # Capture pre-update state for badge-change detection
    pre_badge: str | None = None
    old_status: str | None = None
    seller_id: str | None = None
    if patch.get("status") == "sold":
        try:
            existing = listings_supabase._get_client() \
                .table("listings").select("id,seller_id,status") \
                .eq("id", listing_id).limit(1).execute().data
            if existing:
                old_status = existing[0].get("status")
                seller_id = existing[0].get("seller_id")
                pre_badge = reviews_supabase.get_seller_trust_score(seller_id)["trust_badge"]
        except Exception:
            pass

    try:
        item = listings.update_listing(listing_id, current_user["id"], patch, is_admin=is_admin)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden") from exc

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    # Notify seller when listing is marked sold
    if patch.get("status") == "sold" and old_status != "sold" and seller_id:
        try:
            post_badge = reviews_supabase.get_seller_trust_score(seller_id)["trust_badge"]
            if pre_badge != post_badge:
                notif_svc.create_notification(
                    user_id=seller_id,
                    type="badge_earned",
                    title=f"Badge unlocked: {post_badge}",
                    body=f"You earned the \"{post_badge}\" badge. Keep up the great work!",
                    link=f"/user/{seller_id}",
                )
            else:
                notif_svc.create_notification(
                    user_id=seller_id,
                    type="first_sale" if old_status == "active" else "listing_sold",
                    title="Your listing sold!",
                    body=f'"{item["title"]}" has been marked as sold. Congrats!',
                    link=f"/listing/{listing_id}",
                )
        except Exception:
            pass

    return ListingResponse(**item)


@router.get("/{listing_id}/similar", response_model=ListingListResponse)
def similar_listings(
    listing_id: str,
    limit: int = Query(default=6, ge=1, le=12),
):
    item = listings.get_listing(listing_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    from app.services import listings_supabase
    items, _ = listings_supabase.search_listings(
        keyword=None,
        category=item["category"],
        min_price=None,
        max_price=None,
        page=1,
        page_size=limit + 1,
    )
    similar = [x for x in items if x["id"] != listing_id][:limit]
    return ListingListResponse(items=[ListingResponse(**x) for x in similar], total=len(similar), page=1, page_size=limit)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    is_admin = current_user.get("role") == "admin"

    # Fetch listing before deletion to notify seller
    target = listings.get_listing(listing_id) if is_admin else None

    try:
        ok = listings.delete_listing(listing_id, current_user["id"], is_admin=is_admin)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden") from exc

    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    # Notify seller when admin removes their listing
    if is_admin and target:
        try:
            notif_svc.create_notification(
                user_id=target["seller_id"],
                type="listing_removed",
                title="Your listing was removed",
                body=f'Your listing "{target["title"]}" was removed by an admin for violating our policies.',
                link="/my-listings",
            )
        except Exception:
            pass
