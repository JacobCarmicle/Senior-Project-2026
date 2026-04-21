import os
import uuid
from datetime import UTC, datetime

from supabase import create_client

_supabase_client = None


def _supabase():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Supabase env vars missing")
    _supabase_client = create_client(url, key)
    return _supabase_client


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def create_report(
    reporter_id: str,
    target_type: str,
    target_id: str,
    reason: str,
    description: str | None,
    listing_id: str | None = None,
) -> dict:
    row = {
        "id": str(uuid.uuid4()),
        "reporter_id": reporter_id,
        "target_type": target_type,
        "target_id": target_id,
        "listing_id": listing_id,
        "reason": reason,
        "description": description or "",
        "status": "pending",
        "created_at": _now_iso(),
    }

    if target_id == reporter_id:
        raise PermissionError("Cannot report yourself or your own content")

    result = _supabase().table("reports").insert(row).execute().data[0]
    return result


def list_reports() -> list[dict]:
    rows = (
        _supabase()
        .table("reports")
        .select("*, reporter:users!reporter_id(full_name, email)")
        .order("created_at", desc=True)
        .execute()
        .data
    )

    # Collect target ids per type to batch-fetch names
    listing_ids = [r["target_id"] for r in rows if r.get("target_type") == "listing"]
    user_ids    = [r["target_id"] for r in rows if r.get("target_type") == "user"]
    message_ids = [r["target_id"] for r in rows if r.get("target_type") == "message"]
    review_ids = [r["target_id"] for r in rows if r.get("target_type") == "review"]

    listing_map: dict[str, str] = {}
    user_map:    dict[str, str] = {}
    message_map: dict[str, str] = {}
    review_map: dict[str, str] = {}

    if listing_ids:
        data = (
            _supabase().table("listings").select("id,title").in_("id", listing_ids).execute().data
        )
        listing_map = {x["id"]: x["title"] for x in data}

    if user_ids:
        data = (
            _supabase().table("users").select("id,full_name").in_("id", user_ids).execute().data
        )
        user_map = {x["id"]: x["full_name"] for x in data}

    if message_ids:
        data = (
            _supabase().table("messages").select("id,text").in_("id", message_ids).execute().data
        )
        message_map = {x["id"]: (x.get("text") or "")[:60] for x in data}

    if review_ids:
        data = (
            _supabase().table("reviews").select("id, comment").in_("id", review_ids).execute().data
        )
        review_map = {x["id"]: (x.get("comment") or "")[:60] for x in data}

    out = []
    for r in rows:
        reporter = r.pop("reporter", None) or {}
        r["reporter_name"] = reporter.get("full_name") or reporter.get("email") or "Unknown"

        t_type = r.get("target_type", "listing")
        t_id   = r.get("target_id", "")
        if t_type == "listing":
            r["target_name"] = listing_map.get(t_id, "Unknown listing")
        elif t_type == "user":
            r["target_name"] = user_map.get(t_id, "Unknown user")
        elif t_type == "message":
            preview = message_map.get(t_id, "")
            r["target_name"] = f'"{preview}…"' if preview else "Unknown message"
        elif t_type == "review":
            preview = review_map.get(t_id, "")
            r["target_name"] = f'"{preview}…"' if preview else "Uknown review"
        else:
            r["target_name"] = "Unknown"

        # Keep listing_title for backwards compat
        r["listing_title"] = r["target_name"]
        out.append(r)
    return out


def update_report_status(report_id: str, status: str, resolved_by: str | None = None) -> dict | None:
    if status not in ("pending", "reviewed", "dismissed"):
        raise ValueError("Invalid status")
    update: dict = {"status": status}
    if resolved_by:
        update["resolved_by"] = resolved_by
    rows = _supabase().table("reports").update(update).eq("id", report_id).execute().data
    if not rows:
        return None
    return rows[0]
