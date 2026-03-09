from app.services import google_auth


def test_google_oauth_success_returns_token_and_user(client, monkeypatch):
    def fake_verify(token: str):
        assert token == "valid-token"
        return {
            "aud": "test-google-client-id",
            "email": "jane@example.com",
            "email_verified": True,
            "name": "Jane Doe",
            "sub": "google-sub-1",
        }

    monkeypatch.setattr(google_auth, "verify_google_id_token", fake_verify)

    res = client.post("/auth/oauth/google", json={"token": "valid-token"})

    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "jane@example.com"
    assert body["user"]["full_name"] == "Jane Doe"
    assert body["user"]["role"] == "user"


def test_google_oauth_invalid_token_returns_401(client, monkeypatch):
    def fake_verify(_token: str):
        raise ValueError("bad token")

    monkeypatch.setattr(google_auth, "verify_google_id_token", fake_verify)

    res = client.post("/auth/oauth/google", json={"token": "bad-token"})

    assert res.status_code == 401


def test_google_oauth_audience_mismatch_returns_401(client, monkeypatch):
    def fake_verify(_token: str):
        return {
            "aud": "wrong-client-id",
            "email": "jane@example.com",
            "email_verified": True,
            "name": "Jane Doe",
            "sub": "google-sub-1",
        }

    monkeypatch.setattr(google_auth, "verify_google_id_token", fake_verify)

    res = client.post("/auth/oauth/google", json={"token": "valid-token"})

    assert res.status_code == 401


def test_google_oauth_unverified_email_returns_401(client, monkeypatch):
    def fake_verify(_token: str):
        return {
            "aud": "test-google-client-id",
            "email": "jane@example.com",
            "email_verified": False,
            "name": "Jane Doe",
            "sub": "google-sub-1",
        }

    monkeypatch.setattr(google_auth, "verify_google_id_token", fake_verify)

    res = client.post("/auth/oauth/google", json={"token": "valid-token"})

    assert res.status_code == 401


def test_google_oauth_reuses_existing_user(client, monkeypatch):
    def fake_verify(_token: str):
        return {
            "aud": "test-google-client-id",
            "email": "jane@example.com",
            "email_verified": True,
            "name": "Jane Doe",
            "sub": "google-sub-1",
        }

    monkeypatch.setattr(google_auth, "verify_google_id_token", fake_verify)

    first = client.post("/auth/oauth/google", json={"token": "valid-token"})
    second = client.post("/auth/oauth/google", json={"token": "valid-token"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["user"]["id"] == second.json()["user"]["id"]
