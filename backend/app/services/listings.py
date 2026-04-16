import os

from app.services import listings_supabase
from app.services import listings_memory as memory


def _use_supabase() -> bool:
    return os.environ.get("LISTINGS_BACKEND", "memory").lower() == "supabase"


def reset_listings_store() -> None:
    memory.reset_listings_store()


def create_listing(payload: dict, seller_id: str) -> dict:
    if _use_supabase():
        return listings_supabase.create_listing(payload, seller_id)
    return memory.create_listing(payload, seller_id)


def get_listing(listing_id: str) -> dict | None:
    if _use_supabase():
        return listings_supabase.get_listing(listing_id)
    return memory.get_listing(listing_id)


def list_public_listings(
    page: int = 1,
    page_size: int = 20,
    category: str | None = None,
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: float | None = None,
    sort: str | None = None,
) -> tuple[list[dict], int]:
    if _use_supabase():
        return listings_supabase.list_public_listings(page, page_size, category=category, user_lat=user_lat, user_lng=user_lng, radius_miles=radius_miles, sort=sort)
    return memory.list_public_listings(page, page_size, user_lat=user_lat, user_lng=user_lng, radius_miles=radius_miles, sort=sort)


def update_listing(listing_id: str, seller_id: str, patch: dict, is_admin: bool = False) -> dict | None:
    if _use_supabase():
        return listings_supabase.update_listing(listing_id, seller_id, patch, is_admin=is_admin)
    return memory.update_listing(listing_id, seller_id, patch, is_admin=is_admin)


def delete_listing(listing_id: str, seller_id: str, is_admin: bool = False) -> bool:
    if _use_supabase():
        return listings_supabase.delete_listing(listing_id, seller_id, is_admin=is_admin)
    return memory.delete_listing(listing_id, seller_id, is_admin=is_admin)


def list_all_listings() -> list[dict]:
    if _use_supabase():
        return listings_supabase.list_all_listings()
    return memory.list_all_listings()


def search_listings(
    keyword,
    category,
    min_price,
    max_price,
    page,
    page_size,
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: float | None = None,
    sort: str | None = None,
):
    if _use_supabase():
        return listings_supabase.search_listings(
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
    return memory.search_listings(
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
