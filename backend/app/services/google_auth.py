import os
from datetime import UTC, datetime, timedelta

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import jwt

from app.services import auth_local


def reset_users_store() -> None:
    # user persistence is now centralized in auth_local
    return None


def verify_google_id_token(token: str) -> dict:
    client_id = os.environ["GOOGLE_CLIENT_ID"]
    return google_id_token.verify_oauth2_token(token, google_requests.Request(), client_id)


def get_or_create_user(claims: dict) -> dict:
    email = claims["email"].lower()
    full_name = claims.get("name") or email.split("@")[0]
    google_sub = claims.get("sub")
    return auth_local.get_or_create_google_user(email=email, full_name=full_name, google_sub=google_sub)


def get_user_by_id(user_id: str) -> dict | None:
    return auth_local.get_user_by_id(user_id)


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
