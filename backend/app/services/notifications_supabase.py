import os
from typing import Optional

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


def create_notification(
    user_id: str,
    type: str,
    title: str,
    body: str,
    link: Optional[str] = None,
) -> dict:
    client = _get_client()
    res = (
        client.table("notifications")
        .insert({"user_id": user_id, "type": type, "title": title, "body": body, "link": link})
        .execute()
    )
    return res.data[0]


def list_notifications(user_id: str, limit: int = 20) -> tuple[list[dict], int]:
    client = _get_client()
    res = (
        client.table("notifications")
        .select("*", count="exact")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    items = res.data or []
    unread = sum(1 for n in items if n.get("read_at") is None)
    return items, unread


def mark_read(notification_id: str, user_id: str) -> bool:
    from datetime import datetime, timezone
    client = _get_client()
    res = (
        client.table("notifications")
        .update({"read_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(res.data)


def mark_all_read(user_id: str) -> None:
    from datetime import datetime, timezone
    client = _get_client()
    (
        client.table("notifications")
        .update({"read_at": datetime.now(timezone.utc).isoformat()})
        .eq("user_id", user_id)
        .is_("read_at", "null")
        .execute()
    )
