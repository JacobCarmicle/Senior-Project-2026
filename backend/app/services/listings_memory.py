import uuid
from datetime import UTC, datetime
from decimal import Decimal

LISTINGS_BY_ID: dict[str, dict] = {}


def reset_listings_store() -> None:
    LISTINGS_BY_ID.clear()


def _now() -> datetime:
    return datetime.now(UTC)


def create_listing(payload: dict, seller_id: str) -> dict:
    now = _now()
    listing = {
        "id": str(uuid.uuid4()),
        "seller_id": seller_id,
        "title": payload["title"],
        "description": payload["description"],
        "price": Decimal(str(payload["price"])),
        "category": payload["category"],
        "location": payload["location"],
        "status": "active",
        "images": payload["images"],
        "created_at": now,
        "updated_at": now,
    }
    LISTINGS_BY_ID[listing["id"]] = listing
    return listing


def get_listing(listing_id: str) -> dict | None:
    listing = LISTINGS_BY_ID.get(listing_id)
    if not listing or listing["status"] == "deleted":
        return None
    return listing


def list_public_listings(page: int = 1, page_size: int = 20) -> tuple[list[dict], int]:
    items = [l for l in LISTINGS_BY_ID.values() if l["status"] != "deleted"]
    items.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end], total


def update_listing(listing_id: str, seller_id: str, patch: dict) -> dict | None:
    listing = LISTINGS_BY_ID.get(listing_id)
    if not listing or listing["status"] == "deleted":
        return None
    if listing["seller_id"] != seller_id:
        raise PermissionError("Forbidden")

    for key in ["title", "description", "price", "category", "location", "status"]:
        if key in patch and patch[key] is not None:
            if key == "price":
                listing[key] = Decimal(str(patch[key]))
            else:
                listing[key] = patch[key]
    listing["updated_at"] = _now()
    return listing


def delete_listing(listing_id: str, seller_id: str) -> bool:
    listing = LISTINGS_BY_ID.get(listing_id)
    if not listing or listing["status"] == "deleted":
        return False
    if listing["seller_id"] != seller_id:
        raise PermissionError("Forbidden")

    listing["status"] = "deleted"
    listing["updated_at"] = _now()
    return True


def search_listings(
    keyword: str | None,
    category: str | None,
    min_price: Decimal | None,
    max_price: Decimal | None,
    page: int,
    page_size: int,
) -> tuple[list[dict], int]:
    items = [l for l in LISTINGS_BY_ID.values() if l["status"] == "active"]

    if keyword:
        needle = keyword.lower()
        items = [
            l
            for l in items
            if needle in l["title"].lower() or needle in l["description"].lower()
        ]
    if category:
        items = [l for l in items if l["category"].lower() == category.lower()]
    if min_price is not None:
        items = [l for l in items if l["price"] >= min_price]
    if max_price is not None:
        items = [l for l in items if l["price"] <= max_price]

    items.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end], total
