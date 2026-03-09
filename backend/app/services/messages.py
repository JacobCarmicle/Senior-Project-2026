from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.services import conversations

MESSAGES_BY_ID: dict[str, dict] = {}
MESSAGES_BY_CONVERSATION: dict[str, list[str]] = {}


def reset_messages_store() -> None:
    MESSAGES_BY_ID.clear()
    MESSAGES_BY_CONVERSATION.clear()


def _now() -> datetime:
    return datetime.now(UTC)


def send_message(*, conversation_id: str, sender_id: str, text: str | None, image_url: str | None, kind: str):
    convo = conversations.get_for_user(conversation_id, sender_id)
    if not convo:
        return None

    if convo["status"] == "blocked":
        raise PermissionError("Blocked conversation")

    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "text": text,
        "image_url": image_url,
        "kind": kind,
        "sent_at": _now(),
        "read_at": None,
    }
    MESSAGES_BY_ID[msg["id"]] = msg
    MESSAGES_BY_CONVERSATION.setdefault(conversation_id, []).append(msg["id"])
    return msg


def list_messages_for_user(conversation_id: str, user_id: str) -> list[dict] | None:
    convo = conversations.get_for_user(conversation_id, user_id)
    if not convo:
        return None

    ids = MESSAGES_BY_CONVERSATION.get(conversation_id, [])
    return [MESSAGES_BY_ID[x] for x in ids]


def mark_read(*, conversation_id: str, message_id: str, reader_id: str):
    convo = conversations.get_for_user(conversation_id, reader_id)
    if not convo:
        return None

    msg = MESSAGES_BY_ID.get(message_id)
    if not msg or msg["conversation_id"] != conversation_id:
        return None

    if msg["sender_id"] == reader_id:
        raise ValueError("Sender cannot mark their own message as read")

    msg["read_at"] = _now()
    return msg
