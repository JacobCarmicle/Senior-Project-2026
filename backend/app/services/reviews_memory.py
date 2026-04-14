from __future__ import annotations

import uuid
from datetime import UTC, datetime

REVIEWS_BY_ID: dict[str, dict] = {}


def reset_reviews_store() -> None:
    REVIEWS_BY_ID.clear()


def _now() -> datetime:
    return datetime.now(UTC)


def create_review(
    *,
    buyer_id: str,
    seller_id: str,
    rating: int,
    comment: str,
    listing_id: str | None = None,
) -> dict:
    if buyer_id == seller_id:
        raise ValueError("Cannot review yourself")

    for review in REVIEWS_BY_ID.values():
        same_buyer = review["buyer_id"] == buyer_id
        if listing_id:
            if same_buyer and review.get("listing_id") == listing_id:
                raise RuntimeError("Duplicate review")
        else:
            if same_buyer and review["seller_id"] == seller_id and review.get("listing_id") is None:
                raise RuntimeError("Duplicate review")

    review = {
        "id": str(uuid.uuid4()),
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "rating": rating,
        "comment": comment,
        "listing_id": listing_id,
        "listing_title": None,
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
