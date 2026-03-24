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


def create_report(reporter_id: str, listing_id: str, reason: str, description: str | None) -> dict:
    row = {
        "id": str(uuid.uuid4()),
        "reporter_id": reporter_id,
        "listing_id": listing_id,
        "reason": reason,
        "description": description or "",
        "status": "pending",
        "created_at": _now_iso(),
    }
    result = _supabase().table("reports").insert(row).execute().data[0]
    return result


def list_reports() -> list[dict]:
    rows = (
        _supabase()
        .table("reports")
        .select("*, reporter:users!reporter_id(full_name, email), listing:listings!listing_id(title)")
        .order("created_at", desc=True)
        .execute()
        .data
    )
    out = []
    for r in rows:
        reporter = r.pop("reporter", None) or {}
        listing = r.pop("listing", None) or {}
        r["reporter_name"] = reporter.get("full_name") or reporter.get("email") or "Unknown"
        r["listing_title"] = listing.get("title") or "Unknown"
        out.append(r)
    return out


def update_report_status(report_id: str, status: str) -> dict | None:
    if status not in ("pending", "reviewed", "dismissed"):
        raise ValueError("Invalid status")
    rows = _supabase().table("reports").update({"status": status}).eq("id", report_id).execute().data
    if not rows:
        return None
    return rows[0]
