import os
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")

from app.main import app  # noqa: E402
from app.services.google_auth import reset_users_store  # noqa: E402


@pytest.fixture(autouse=True)
def reset_state():
    reset_users_store()


@pytest.fixture()
def client():
    return TestClient(app)
