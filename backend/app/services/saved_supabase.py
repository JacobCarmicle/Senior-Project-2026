from __future__ import annotations

import os
import uuid
from decimal import Decimal

from supabase import Client, create_client

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


def toggle_save(user_id: str, listing_id: str) -> bool:
    """Toggle saved state. Returns True if now saved, False if now unsaved."""
    client = _get_client()
    existing = (
        client.table("saved_listings")
        .select("saved_id")
        .eq("user_id", user_id)
        .eq("listing_id", listing_id)
        .execute()
    )
    if existing.data:
        client.table("saved_listings").delete().eq("user_id", user_id).eq("listing_id", listing_id).execute()
        return False
    client.table("saved_listings").insert({
        "saved_id": str(uuid.uuid4()),
        "user_id": user_id,
        "listing_id": listing_id,
    }).execute()
    return True


def get_saved_listings(user_id: str) -> list[dict]:
    client = _get_client()

    rows = (
        client.table("saved_listings")
        .select("listing_id")
        .eq("user_id", user_id)
        .order("saved_at", desc=True)
        .execute()
        .data
    )
    if not rows:
        return []

    ids = [r["listing_id"] for r in rows]

    listings = (
        client.table("listings")
        .select("*")
        .in_("id", ids)
        .neq("status", "deleted")
        .execute()
        .data
    )
    if not listings:
        return []

    media = (
        client.table("listing_media")
        .select("listing_id,public_url,created_at")
        .in_("listing_id", ids)
        .execute()
        .data
    )
    media.sort(key=lambda x: x.get("created_at") or "")
    by_listing: dict[str, list[str]] = {i: [] for i in ids}
    for m in media:
        by_listing[m["listing_id"]].append(m["public_url"])

    # Fetch seller names
    seller_ids = list({l["seller_id"] for l in listings})
    users = (
        client.table("users")
        .select("id,full_name")
        .in_("id", seller_ids)
        .execute()
        .data
    )
    name_map = {u["id"]: u["full_name"] for u in users}

    # Preserve saved_at ordering from the saved_listings rows
    order = {lid: i for i, lid in enumerate(ids)}
    listings.sort(key=lambda l: order.get(l["id"], 999))

    out = []
    for item in listings:
        item["price"] = Decimal(str(item["price"]))
        item["images"] = by_listing.get(item["id"], [])
        item["seller_name"] = name_map.get(item["seller_id"])
        out.append(item)
    return out


def is_saved(user_id: str, listing_id: str) -> bool:
    client = _get_client()
    rows = (
        client.table("saved_listings")
        .select("saved_id")
        .eq("user_id", user_id)
        .eq("listing_id", listing_id)
        .execute()
        .data
    )
    return bool(rows)
