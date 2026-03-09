import os
import re
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

USERS_BY_EMAIL: dict[str, dict] = {}
RESET_TOKENS: dict[str, str] = {}
LATEST_RESET_TOKEN_BY_EMAIL: dict[str, str] = {}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


_PASSWORD_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


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


def create_user(email: str, password: str, full_name: str) -> dict:
    key = email.lower()
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
    user = USERS_BY_EMAIL.get(email.lower())
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
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
    for user in USERS_BY_EMAIL.values():
        if user["id"] == user_id:
            return user
    return None


def create_reset_token(email: str) -> str | None:
    user = USERS_BY_EMAIL.get(email.lower())
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

    user = USERS_BY_EMAIL.get(email)
    if not user:
        raise ValueError("Invalid reset token")

    user["password_hash"] = hash_password(new_password)
    RESET_TOKENS.pop(token, None)
