from __future__ import annotations

import os
from datetime import datetime, UTC

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


def _now():
    return datetime.now(UTC).isoformat()

def create_or_get_conversation(*, listing_id, buyer_id, seller_id):
    client = _get_client()

    existing = (
        client.table("conversations")
        .select("*")
        .eq("listing_id", listing_id)
        .eq("buyer_id", buyer_id)
        .eq("seller_id", seller_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        return existing.data[0], False

    created = (
        client.table("conversations")
        .insert({
            "listing_id": listing_id,
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "status": "open",
        })
        .execute()
    )

    return created.data[0], True

def list_for_user(user_id: str) -> list[dict]:
    print("listing conversations")

    client = _get_client()

    print("passed get client")

    rows = (
        client.table("conversations")
        .select("*")
        .or_(f"buyer_id.eq.{user_id},seller_id.eq.{user_id}")
        .order("updated_at", desc=True)
        .execute()
    )

    return rows.data or []

def get_for_user(conversation_id: str, user_id: str) -> dict | None:
    print("getting conversation_id for " + conversation_id + " user_id " + user_id)
    
    client = _get_client()

    res = (
        client.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .or_(f"buyer_id.eq.{user_id},seller_id.eq.{user_id}")
        .limit(1)
        .execute()
    )

    if not res.data:
        return None

    return res.data[0]

def update_status(conversation_id: str, user_id: str, status: str) -> dict | None:
    client = _get_client()

    convo = get_for_user(conversation_id, user_id)
    if not convo:
        return None

    if convo["status"] == "blocked" and status != "blocked":
        if convo.get("blocked_by_user_id") != user_id:
            raise PermissionError("Only blocking user can reopen blocked conversation")

    blocked_by = convo.get("blocked_by_user_id")

    if status == "blocked":
        blocked_by = user_id
    elif status != "blocked":
        blocked_by = None

    updated = (
        client.table("conversations")
        .update(
            {
                "status": status,
                "blocked_by_user_id": blocked_by,
                "updated_at": _now(),
            }
        )
        .eq("id", conversation_id)
        .execute()
    )

    return updated.data[0] if updated.data else None