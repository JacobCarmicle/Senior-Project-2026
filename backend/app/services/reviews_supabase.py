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

def create_review(*, buyer_id: str, seller_id: str, rating: int, comment: str) -> dict:
    print("create review called")

    client = _get_client()

    if buyer_id == seller_id:
        raise ValueError("Cannot review yourself")

    # Prevent duplicates
    existing = (
        client.table("reviews")
        .select("id")
        .eq("buyer_id", buyer_id)
        .eq("seller_id", seller_id)
        .execute()
    )

    if existing.data:
        raise RuntimeError("Duplicate review")

    res = (
        client.table("reviews")
        .insert({
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "rating": rating,
            "comment": comment,
        })
        .execute()
    )

    return res.data[0]

def list_reviews_for_seller(seller_id: str) -> list[dict]:
    client = _get_client()

    res = (
        client.table("reviews")
        .select("*")
        .eq("seller_id", seller_id)
        .order("created_at", desc=True)
        .execute()
    )

    return res.data

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