import os
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("LISTINGS_BACKEND", "memory")
os.environ.setdefault("UPLOADS_BACKEND", "local")

from app.main import app  # noqa: E402
from app.services.google_auth import reset_users_store as reset_google_users_store  # noqa: E402
from app.services.auth_local import reset_local_auth_state  # noqa: E402
from app.services.listings import reset_listings_store  # noqa: E402
from app.services.conversations import reset_conversations_store  # noqa: E402
from app.services.messages import reset_messages_store  # noqa: E402


@pytest.fixture(autouse=True)
def reset_state():
    reset_google_users_store()
    reset_local_auth_state()
    reset_listings_store()
    reset_conversations_store()
    reset_messages_store()


@pytest.fixture()
def client():
    return TestClient(app)
