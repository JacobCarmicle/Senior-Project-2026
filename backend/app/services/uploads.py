import os
import uuid
from pathlib import Path

from supabase import create_client


ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))


def _backend() -> str:
    return os.environ.get("UPLOADS_BACKEND", "local").lower()


def upload_image(content: bytes, mime_type: str, filename: str, owner_id: str) -> dict:
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValueError("Unsupported file type")
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("File too large")

    if _backend() == "supabase":
        return _upload_supabase(content, mime_type, filename, owner_id)
    return _upload_local(content, mime_type, filename, owner_id)


def _upload_local(content: bytes, mime_type: str, filename: str, owner_id: str) -> dict:
    ext = filename.split(".")[-1] if "." in filename else "bin"
    key = f"{owner_id}/{uuid.uuid4()}.{ext}"
    out_dir = Path(__file__).resolve().parents[2] / "uploads" / "listing-images"
    out_path = out_dir / key
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(content)
    return {
        "public_url": f"/uploads/listing-images/{key}",
        "object_key": key,
        "mime_type": mime_type,
    }


def _upload_supabase(content: bytes, mime_type: str, filename: str, owner_id: str) -> dict:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    bucket = os.environ.get("SUPABASE_STORAGE_BUCKET", "listing-images")
    if not url or not key:
        raise ValueError("Supabase upload env is missing")

    ext = filename.split(".")[-1] if "." in filename else "bin"
    object_key = f"{owner_id}/{uuid.uuid4()}.{ext}"

    client = create_client(url, key)
    client.storage.from_(bucket).upload(object_key, content, {"content-type": mime_type, "upsert": "false"})
    public_url = client.storage.from_(bucket).get_public_url(object_key)

    return {"public_url": public_url, "object_key": object_key, "mime_type": mime_type}
