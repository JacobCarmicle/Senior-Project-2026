from __future__ import annotations

import os

from app.services import saved_supabase


# ── In-memory store ────────────────────────────────────────────────────────────

SAVED_BY_USER: dict[str, set[str]] = {}


def reset_saved_store() -> None:
    SAVED_BY_USER.clear()


def _use_supabase() -> bool:
    return os.environ.get("SAVED_BACKEND", "memory").lower() == "supabase"


# ── Public API ─────────────────────────────────────────────────────────────────

def toggle_save(user_id: str, listing_id: str) -> bool:
    """Toggle saved state. Returns True if now saved, False if now unsaved."""
    if _use_supabase():
        return saved_supabase.toggle_save(user_id, listing_id)
    saved = SAVED_BY_USER.setdefault(user_id, set())
    if listing_id in saved:
        saved.discard(listing_id)
        return False
    saved.add(listing_id)
    return True


def get_saved_listings(user_id: str) -> list[dict]:
    """Return full listing dicts for all saved listings, skipping deleted ones."""
    if _use_supabase():
        return saved_supabase.get_saved_listings(user_id)
    from app.services import listings as listings_service
    ids = list(SAVED_BY_USER.get(user_id, set()))
    items = []
    for listing_id in ids:
        listing = listings_service.get_listing(listing_id)
        if listing:
            items.append(listing)
    return items


def is_saved(user_id: str, listing_id: str) -> bool:
    if _use_supabase():
        return saved_supabase.is_saved(user_id, listing_id)
    return listing_id in SAVED_BY_USER.get(user_id, set())
