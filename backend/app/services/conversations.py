from __future__ import annotations

import uuid
from datetime import UTC, datetime

CONVERSATIONS_BY_ID: dict[str, dict] = {}


def reset_conversations_store() -> None:
    CONVERSATIONS_BY_ID.clear()


def _now() -> datetime:
    return datetime.now(UTC)


def create_or_get_conversation(*, listing_id: str, buyer_id: str, seller_id: str) -> tuple[dict, bool]:
    for convo in CONVERSATIONS_BY_ID.values():
        if (
            convo["listing_id"] == listing_id
            and convo["buyer_id"] == buyer_id
            and convo["seller_id"] == seller_id
        ):
            return convo, False

    now = _now()
    convo = {
        "id": str(uuid.uuid4()),
        "listing_id": listing_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "status": "open",
        "blocked_by_user_id": None,
        "created_at": now,
        "updated_at": now,
    }
    CONVERSATIONS_BY_ID[convo["id"]] = convo
    return convo, True


def list_for_user(user_id: str) -> list[dict]:
    rows = [
        x
        for x in CONVERSATIONS_BY_ID.values()
        if x["buyer_id"] == user_id or x["seller_id"] == user_id
    ]
    rows.sort(key=lambda x: x["updated_at"], reverse=True)
    return rows


def get_for_user(conversation_id: str, user_id: str) -> dict | None:
    convo = CONVERSATIONS_BY_ID.get(conversation_id)
    if not convo:
        return None
    if convo["buyer_id"] != user_id and convo["seller_id"] != user_id:
        raise PermissionError("Forbidden")
    return convo


def update_status(conversation_id: str, user_id: str, status: str) -> dict | None:
    convo = get_for_user(conversation_id, user_id)
    if not convo:
        return None

    if convo["status"] == "blocked" and status != "blocked":
        if convo.get("blocked_by_user_id") != user_id:
            raise PermissionError("Only blocking user can reopen blocked conversation")

    convo["status"] = status
    if status == "blocked":
        convo["blocked_by_user_id"] = user_id
    elif status != "blocked":
        convo["blocked_by_user_id"] = None

    convo["updated_at"] = _now()
    return convo
