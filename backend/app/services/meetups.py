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

def create_meetup(*, conversation_id, proposer_id, receiver_id, scheduled_at, location=None):
    client = _get_client()

    existing = (
        client.table("meetups")
        .select("*")
        .eq("conversation_id", conversation_id)
        .limit(1)
        .execute()
    ).data

    if existing:
        raise ValueError("A meetup already exists for this conversation")

    created = (
        client.table("meetups")
        .insert({
            "conversation_id": conversation_id,
            "proposer_id": proposer_id,
            "receiver_id": receiver_id,
            "scheduled_at": scheduled_at,
            "location": location,
            "status": "pending",
            "created_at": _now(),
        })
        .execute()
    )

    return created.data[0]

def get_meetup_for_conversation(conversation_id: str):
    client = _get_client()
    res = (
        client.table("meetups")
        .select("*")
        .eq("conversation_id", conversation_id)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None

def update_meetup_status(meetup_id: str, user_id: str, status: str):
    if status not in ("pending", "accepted", "declined", "cancelled"):
        raise ValueError("Invalid status")

    client = _get_client()
    meetup = client.table("meetups").select("*").eq("id", meetup_id).limit(1).execute().data[0]

    if status in ("accepted", "declined") and meetup["receiver_id"] != user_id:
        raise PermissionError("Only the receiver can accept or decline the meetup")
    if status == "cancelled" and meetup["proposer_id"] != user_id:
        raise PermissionError("Only the proposer can cancel the meetup")

    updated = (
        client.table("meetups")
        .update({"status": status})
        .eq("id", meetup_id)
        .execute()
    )
    return updated.data[0]

def delete_meetup(meetup_id: str, user_id: str):
    client = _get_client()
    meetup = client.table("meetups").select("*").eq("id", meetup_id).limit(1).execute().data[0]

    if meetup["proposer_id"] != user_id and meetup["receiver_id"] != user_id:
        raise PermissionError("Only the proposer can delete this meetup")

    res = client.table("meetups").delete().eq("id", meetup_id).execute()
    return res.data[0] if res.data else None