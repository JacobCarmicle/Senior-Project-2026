import os
from datetime import datetime, UTC
import uuid

from supabase import Client, create_client
from app.services import conversations_supabase as conversations 


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

def send_message(*, conversation_id: str, sender_id: str, text: str | None, image_url: str | None, kind: str):
    client = _get_client()

    convo = conversations.get_for_user(conversation_id, sender_id)
    if not convo:
        raise ValueError("Conversation not found or access denied")

    if convo["status"] == "blocked":
        raise PermissionError("Blocked conversation")

    if not text and not image_url:
        raise ValueError("Message must have text or image")

    created = (
        client.table("messages")
        .insert(
            {
                "id": str(uuid.uuid4()),
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "text": text,
                "image_url": image_url,
                "kind": kind,
                "sent_at": _now(),
            }
        )
        .execute()
    )

    client.table("conversations").update(
        {"updated_at": _now()}
    ).eq("id", conversation_id).execute()

    return created.data[0] if created.data else None

def list_messages_for_user(conversation_id: str, user_id: str) -> list[dict] | None:
    client = _get_client()

    convo = conversations.get_for_user(conversation_id, user_id)
    if not convo:
        return None
    
    users_res = (
        client.table("users")
        .select("id, full_name")
        .in_("id", [convo["buyer_id"], convo["seller_id"]])
        .execute()
    )

    users = {u["id"]: u["full_name"] for u in users_res.data}

    rows = (
        client.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("sent_at", desc=False)
        .execute()
    )

    for message in rows.data:
        message["sender_username"] = users.get(message["sender_id"])

    return rows.data or []

def mark_read(*, conversation_id: str, message_id: str, reader_id: str):
    client = _get_client()

    convo = conversations.get_for_user(conversation_id, reader_id)
    if not convo:
        raise ValueError("Conversation not found or access denied")

    msg_res = (
        client.table("messages")
        .select("*")
        .eq("id", message_id)
        .limit(1)
        .execute()
    )

    if not msg_res.data:
        return None

    msg = msg_res.data[0]

    if msg["conversation_id"] != conversation_id:
        return None

    if msg["sender_id"] == reader_id:
        raise ValueError("Sender cannot mark their own message as read")

    updated = (
        client.table("messages")
        .update({"read_at": _now()})
        .eq("id", message_id)
        .execute()
    )

    return updated.data[0] if updated.data else None