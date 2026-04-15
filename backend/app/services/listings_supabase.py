import os
from decimal import Decimal

from supabase import Client, create_client

from app.services.geo import haversine_miles, parse_location_coords


_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is not None:
        return _client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Supabase env is missing")

    _client = create_client(url, key)
    return _client


def create_listing(payload: dict, seller_id: str) -> dict:
    client = _get_client()
    created = (
        client.table("listings")
        .insert(
            {
                "seller_id": seller_id,
                "title": payload["title"],
                "description": payload["description"],
                "price": float(payload["price"]),
                "category": payload["category"],
                "location": payload["location"],
            }
        )
        .execute()
    )
    item = created.data[0]

    for i, url in enumerate(payload["images"]):
        client.table("listing_media").insert(
            {
                "listing_id": item["id"],
                "public_url": url,
                "is_primary": i == 0,
            }
        ).execute()

    return get_listing(item["id"])


def _with_images(items: list[dict]) -> list[dict]:
    client = _get_client()
    if not items:
        return []

    ids = [x["id"] for x in items]
    media = client.table("listing_media").select("listing_id,public_url,created_at").in_("listing_id", ids).execute().data

    by_listing: dict[str, list[str]] = {i: [] for i in ids}
    media.sort(key=lambda x: x.get("created_at") or "")
    for m in media:
        by_listing[m["listing_id"]].append(m["public_url"])

    out = []
    for item in items:
        item["price"] = Decimal(str(item["price"]))
        item["images"] = by_listing.get(item["id"], [])
        out.append(item)
    return out


def get_listing(listing_id: str) -> dict | None:
    client = _get_client()
    res = client.table("listings").select("*").eq("id", listing_id).neq("status", "deleted").limit(1).execute().data
    if not res:
        return None
    item = _with_images(res)[0]
    user_rows = client.table("users").select("full_name").eq("id", item["seller_id"]).limit(1).execute().data
    item["seller_name"] = user_rows[0]["full_name"] if user_rows else None
    return item


def _apply_distance(
    items: list[dict],
    user_lat: float | None,
    user_lng: float | None,
    radius_miles: float | None,
    sort: str | None,
) -> list[dict]:
    out: list[dict] = []
    for item in items:
        row = dict(item)
        row["distance_miles"] = None
        if user_lat is not None and user_lng is not None:
            coords = parse_location_coords(row.get("location"))
            if coords:
                row["distance_miles"] = round(haversine_miles(user_lat, user_lng, coords[0], coords[1]), 2)

        if radius_miles is not None:
            if row["distance_miles"] is None or row["distance_miles"] > radius_miles:
                continue

        out.append(row)

    if sort == "distance" and user_lat is not None and user_lng is not None:
        out.sort(key=lambda x: x["distance_miles"] if x["distance_miles"] is not None else float("inf"))
    return out


def list_public_listings(
    page: int = 1,
    page_size: int = 20,
    category: str | None = None,
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: float | None = None,
    sort: str | None = None,
) -> tuple[list[dict], int]:
    client = _get_client()
    start = (page - 1) * page_size
    end = start + page_size - 1
    q = (
        client.table("listings")
        .select("*", count="exact")
        .eq("status", "active")
        .order("created_at", desc=True)
    )
    if category:
        q = q.ilike("category", category)
    rows = q.range(start, end).execute()
    items = _with_images(rows.data)
    items = _apply_distance(items, user_lat, user_lng, radius_miles, sort)
    return items, len(items) if radius_miles is not None else (rows.count or 0)


def update_listing(listing_id: str, seller_id: str, patch: dict, is_admin: bool = False) -> dict | None:
    client = _get_client()
    existing = client.table("listings").select("id,seller_id,status").eq("id", listing_id).limit(1).execute().data
    if not existing or existing[0].get("status") == "deleted":
        return None
    if existing[0]["seller_id"] != seller_id and not is_admin:
        raise PermissionError("Forbidden")

    images = patch.get("images") if "images" in patch else None

    update_payload = {k: v for k, v in patch.items() if k in {"title", "description", "price", "category", "location", "status"}}
    if "price" in update_payload:
        update_payload["price"] = float(update_payload["price"])

    if update_payload:
        client.table("listings").update(update_payload).eq("id", listing_id).execute()

    if images is not None:
        old_media = client.table("listing_media").select("id,object_key").eq("listing_id", listing_id).execute().data
        client.table("listing_media").delete().eq("listing_id", listing_id).execute()

        bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "listing-images")
        keys = [m.get("object_key") for m in old_media if m.get("object_key")]
        if keys:
            try:
                client.storage.from_(bucket).remove(keys)
            except Exception:
                pass

        for i, url in enumerate(images):
            client.table("listing_media").insert(
                {
                    "listing_id": listing_id,
                    "public_url": url,
                    "is_primary": i == 0,
                }
            ).execute()

    return get_listing(listing_id)


def delete_listing(listing_id: str, seller_id: str, is_admin: bool = False) -> bool:
    client = _get_client()
    existing = client.table("listings").select("id,seller_id,status").eq("id", listing_id).limit(1).execute().data
    if not existing or existing[0].get("status") == "deleted":
        return False
    if existing[0]["seller_id"] != seller_id and not is_admin:
        raise PermissionError("Forbidden")

    media = client.table("listing_media").select("object_key").eq("listing_id", listing_id).execute().data
    client.table("listing_media").delete().eq("listing_id", listing_id).execute()

    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "listing-images")
    keys = [m.get("object_key") for m in media if m.get("object_key")]
    if keys:
        try:
            client.storage.from_(bucket).remove(keys)
        except Exception:
            pass

    client.table("listings").update({"status": "deleted"}).eq("id", listing_id).execute()
    return True


def list_all_listings() -> list[dict]:
    client = _get_client()
    rows = client.table("listings").select("*").order("created_at", desc=True).execute()
    items = _with_images(rows.data)
    ids = list({item["seller_id"] for item in items})
    if ids:
        users = client.table("users").select("id,full_name").in_("id", ids).execute().data
        name_map = {u["id"]: u["full_name"] for u in users}
        for item in items:
            item["seller_name"] = name_map.get(item["seller_id"])
    return items


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
    client = _get_client()
    q = client.table("listings").select("*", count="exact").eq("status", "active")

    if category:
        q = q.ilike("category", category)
    if min_price is not None:
        q = q.gte("price", float(min_price))
    if max_price is not None:
        q = q.lte("price", float(max_price))
    if keyword:
        like = f"%{keyword}%"
        q = q.or_(f"title.ilike.{like},description.ilike.{like}")

    start = (page - 1) * page_size
    end = start + page_size - 1
    rows = q.order("created_at", desc=True).range(start, end).execute()
    items = _with_images(rows.data)
    items = _apply_distance(items, user_lat, user_lng, radius_miles, sort)
    return items, len(items) if radius_miles is not None else (rows.count or 0)
