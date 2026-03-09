import os
import uuid
from datetime import UTC, datetime, timedelta

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import jwt


USERS_BY_EMAIL: dict[str, dict] = {}


def reset_users_store() -> None:
    USERS_BY_EMAIL.clear()


def verify_google_id_token(token: str) -> dict:
    client_id = os.environ["GOOGLE_CLIENT_ID"]
    return google_id_token.verify_oauth2_token(token, google_requests.Request(), client_id)


def get_or_create_user(claims: dict) -> dict:
    email = claims["email"].lower()
    existing = USERS_BY_EMAIL.get(email)
    if existing:
        return existing

    now = datetime.now(UTC).isoformat()
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "full_name": claims.get("name") or email.split("@")[0],
        "role": "user",
        "created_at": now,
        "google_sub": claims.get("sub"),
    }
    USERS_BY_EMAIL[email] = user
    return user


def get_user_by_id(user_id: str) -> dict | None:
    for user in USERS_BY_EMAIL.values():
        if user["id"] == user_id:
            return user
    return None


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
