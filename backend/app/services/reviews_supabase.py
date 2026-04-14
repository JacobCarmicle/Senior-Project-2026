import os
from supabase import Client, create_client


_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client:
        return _client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise RuntimeError("Missing Supabase env vars")

    _client = create_client(url, key)
    return _client

def create_review(*, buyer_id: str, seller_id: str, rating: int, comment: str, listing_id: str | None = None) -> dict:
    print("create review called")

    client = _get_client()

    if buyer_id == seller_id:
        raise ValueError("Cannot review yourself")

    # Prevent duplicates per listing (or per seller if no listing)
    if listing_id:
        existing = (
            client.table("reviews")
            .select("id")
            .eq("buyer_id", buyer_id)
            .eq("listing_id", listing_id)
            .execute()
        )
    else:
        existing = (
            client.table("reviews")
            .select("id")
            .eq("buyer_id", buyer_id)
            .eq("seller_id", seller_id)
            .is_("listing_id", "null")
            .execute()
        )

    if existing.data:
        raise RuntimeError("Duplicate review")

    payload: dict = {
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "rating": rating,
        "comment": comment,
    }
    if listing_id:
        payload["listing_id"] = listing_id

    res = (
        client.table("reviews")
        .insert(payload)
        .execute()
    )

    return res.data[0]

def list_reviews_for_seller(seller_id: str) -> list[dict]:
    client = _get_client()

    res = (
        client.table("reviews")
        .select("*, listings(title)")
        .eq("seller_id", seller_id)
        .order("created_at", desc=True)
        .execute()
    )

    rows = []
    for row in res.data:
        listing = row.pop("listings", None)
        row["listing_title"] = listing["title"] if listing else None
        rows.append(row)

    return rows

def get_seller_trust_score(seller_id: str) -> dict:
    client = _get_client()

    res = (
        client.table("seller_trust_scores")
        .select("*")
        .eq("seller_id", seller_id)
        .execute()
    )

    if not res.data:
        return {
            "seller_id": seller_id,
            "avg_rating": 0.0,
            "review_count": 0,
            "report_count": 0,
            "trust_score": 0.0,
            "trust_badge": "Limited Activity",
        }

    row = res.data[0]
    return {
        "seller_id": seller_id,
        "avg_rating": float(row["avg_rating"]),
        "review_count": int(row["review_count"]),
        "report_count": int(row["report_count"]),
        "trust_score": float(row["trust_score"]),
        "trust_badge": row["trust_badge"],
    }


def get_seller_rating_summary(seller_id: str) -> dict:
    rows = list_reviews_for_seller(seller_id)

    count = len(rows)
    if count == 0:
        return {
            "seller_id": seller_id,
            "review_count": 0,
            "average_rating": 0.0,
        }

    avg = round(sum(r["rating"] for r in rows) / count, 2)

    return {
        "seller_id": seller_id,
        "review_count": count,
        "average_rating": avg,
    }

def delete_review(review_id: str, user_id: str, is_admin: bool = False) -> bool:
    client = _get_client()
    review = client.table("reviews").select("")

    existing = (
        client.table("reviews")
        .select("id,buyer_id")
        .eq("id", review_id)
        .limit(1)
        .execute()
        .data
    )

    if not existing:
        return False
    
    review = existing[0]

    if review["buyer_id"] != user_id and not is_admin:
        raise PermissionError("Forbidden")

    client.table("reviews").delete().eq("id", review_id).execute()

    return True