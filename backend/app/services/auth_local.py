import os
import re
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client

USERS_BY_EMAIL: dict[str, dict] = {}
RESET_TOKENS: dict[str, str] = {}
LATEST_RESET_TOKEN_BY_EMAIL: dict[str, str] = {}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_PASSWORD_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")
_supabase_client = None


def _users_backend() -> str:
    return os.environ.get("USERS_BACKEND", "memory").lower()


def _supabase():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Supabase env missing for USERS_BACKEND=supabase")
    _supabase_client = create_client(url, key)
    return _supabase_client


def reset_local_auth_state() -> None:
    USERS_BY_EMAIL.clear()
    RESET_TOKENS.clear()
    LATEST_RESET_TOKEN_BY_EMAIL.clear()


def validate_password_rules(password: str) -> bool:
    return bool(_PASSWORD_REGEX.match(password))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _normalize_db_user(row: dict) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row.get("full_name") or "",
        "role": row.get("role") or "user",
        "status": row.get("status") or "active",
        "created_at": row.get("created_at") or _now_iso(),
        "password_hash": row.get("password_hash"),
        "google_sub": row.get("google_sub"),
    }


def _db_get_user_by_email(email: str) -> dict | None:
    rows = _supabase().table("users").select("*").eq("email", email.lower()).limit(1).execute().data
    if not rows:
        return None
    return _normalize_db_user(rows[0])


def _db_get_user_by_id(user_id: str) -> dict | None:
    rows = _supabase().table("users").select("*").eq("id", user_id).limit(1).execute().data
    if not rows:
        return None
    return _normalize_db_user(rows[0])


def create_user(email: str, password: str, full_name: str) -> dict:
    key = email.lower()
    if _users_backend() == "supabase":
        if _db_get_user_by_email(key):
            raise ValueError("Email already registered")
        row = {
            "id": str(uuid.uuid4()),
            "email": key,
            "full_name": full_name,
            "role": "user",
            "password_hash": hash_password(password),
        }
        created = _supabase().table("users").insert(row).execute().data[0]
        return _normalize_db_user(created)

    if key in USERS_BY_EMAIL:
        raise ValueError("Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "email": key,
        "full_name": full_name,
        "role": "user",
        "created_at": _now_iso(),
        "password_hash": hash_password(password),
    }
    USERS_BY_EMAIL[key] = user
    return user


def authenticate_user(email: str, password: str) -> dict | None:
    if _users_backend() == "supabase":
        user = _db_get_user_by_email(email)
    else:
        user = USERS_BY_EMAIL.get(email.lower())
    if not user:
        return None
    if not user.get("password_hash"):
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    if user.get("status") == "disabled":
        raise ValueError("Account is disabled")
    return user


def get_or_create_google_user(email: str, full_name: str, google_sub: str | None) -> dict:
    key = email.lower()
    if _users_backend() == "supabase":
        existing = _db_get_user_by_email(key)
        if existing:
            update = {}
            if google_sub and not existing.get("google_sub"):
                update["google_sub"] = google_sub
            if full_name and not existing.get("full_name"):
                update["full_name"] = full_name
            if update:
                _supabase().table("users").update(update).eq("id", existing["id"]).execute()
                existing.update(update)
            return existing

        row = {
            "id": str(uuid.uuid4()),
            "email": key,
            "full_name": full_name or key.split("@")[0],
            "role": "user",
            "google_sub": google_sub,
        }
        created = _supabase().table("users").insert(row).execute().data[0]
        return _normalize_db_user(created)

    existing = USERS_BY_EMAIL.get(key)
    if existing:
        if google_sub and not existing.get("google_sub"):
            existing["google_sub"] = google_sub
        return existing

    user = {
        "id": str(uuid.uuid4()),
        "email": key,
        "full_name": full_name or key.split("@")[0],
        "role": "user",
        "created_at": _now_iso(),
        "google_sub": google_sub,
    }
    USERS_BY_EMAIL[key] = user
    return user


def create_access_token(user: dict) -> str:
    secret = os.environ.get("JWT_SECRET", "dev-secret")
    now = datetime.now(UTC)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=24)).timestamp()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    secret = os.environ.get("JWT_SECRET", "dev-secret")
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def get_user_by_id(user_id: str) -> dict | None:
    if _users_backend() == "supabase":
        return _db_get_user_by_id(user_id)
    for user in USERS_BY_EMAIL.values():
        if user["id"] == user_id:
            return user
    return None


def create_reset_token(email: str) -> str | None:
    user = _db_get_user_by_email(email) if _users_backend() == "supabase" else USERS_BY_EMAIL.get(email.lower())
    if not user:
        return None

    token = str(uuid.uuid4())
    RESET_TOKENS[token] = user["email"]
    LATEST_RESET_TOKEN_BY_EMAIL[user["email"]] = token
    return token


def latest_reset_token_for(email: str) -> str | None:
    return LATEST_RESET_TOKEN_BY_EMAIL.get(email.lower())


def apply_password_reset(token: str, new_password: str) -> None:
    email = RESET_TOKENS.get(token)
    if not email:
        raise ValueError("Invalid reset token")

    if _users_backend() == "supabase":
        user = _db_get_user_by_email(email)
        if not user:
            raise ValueError("Invalid reset token")
        _supabase().table("users").update({"password_hash": hash_password(new_password)}).eq("id", user["id"]).execute()
    else:
        user = USERS_BY_EMAIL.get(email)
        if not user:
            raise ValueError("Invalid reset token")
        user["password_hash"] = hash_password(new_password)

    RESET_TOKENS.pop(token, None)


# ── Admin user management ──────────────────────────────────────────────────────

def list_users() -> list[dict]:
    if _users_backend() == "supabase":
        rows = _supabase().table("users").select("*").order("created_at", desc=True).execute().data
        return [_normalize_db_user(r) for r in rows]
    return [_normalize_db_user(u) for u in USERS_BY_EMAIL.values()]


def set_user_role(user_id: str, role: str) -> dict | None:
    if role not in ("user", "admin"):
        raise ValueError("Invalid role")
    if _users_backend() == "supabase":
        rows = _supabase().table("users").update({"role": role}).eq("id", user_id).execute().data
        if not rows:
            return None
        return _normalize_db_user(rows[0])
    for user in USERS_BY_EMAIL.values():
        if user["id"] == user_id:
            user["role"] = role
            return _normalize_db_user(user)
    return None


def set_user_status(user_id: str, status: str) -> dict | None:
    if status not in ("active", "disabled"):
        raise ValueError("Invalid status")
    if _users_backend() == "supabase":
        rows = _supabase().table("users").update({"status": status}).eq("id", user_id).execute().data
        if not rows:
            return None
        return _normalize_db_user(rows[0])
    for user in USERS_BY_EMAIL.values():
        if user["id"] == user_id:
            user["status"] = status
            return _normalize_db_user(user)
    return None
