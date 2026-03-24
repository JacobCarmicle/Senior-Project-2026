# reviews_memory.py
from __future__ import annotations

import uuid
from datetime import UTC, datetime

REVIEWS_BY_ID: dict[str, dict] = {}

def reset_reviews_store() -> None:
    REVIEWS_BY_ID.clear()

def _now() -> datetime:
    return datetime.now(UTC)

def create_review(*, buyer_id: str, seller_id: str, rating: int, comment: str) -> dict:
    if buyer_id == seller_id:
        raise ValueError("Cannot review yourself")
    for review in REVIEWS_BY_ID.values():
        if review["buyer_id"] == buyer_id and review["seller_id"] == seller_id:
            raise RuntimeError("Duplicate review")
    review = {
        "id": str(uuid.uuid4()),
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "rating": rating,
        "comment": comment,
        "created_at": _now(),
    }
    REVIEWS_BY_ID[review["id"]] = review
    return review

def list_reviews_for_seller(seller_id: str) -> list[dict]:
    rows = [x for x in REVIEWS_BY_ID.values() if x["seller_id"] == seller_id]
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows

def get_seller_rating_summary(seller_id: str) -> dict:
    rows = list_reviews_for_seller(seller_id)
    count = len(rows)
    if count == 0:
        return {"seller_id": seller_id, "review_count": 0, "average_rating": 0.0}
    avg = round(sum(x["rating"] for x in rows) / count, 2)
    return {"seller_id": seller_id, "review_count": count, "average_rating": avg}