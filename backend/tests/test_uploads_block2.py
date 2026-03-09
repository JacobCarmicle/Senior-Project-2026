from io import BytesIO


def _signup_and_token(client, email: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": email.split("@")[0]},
    )
    assert res.status_code == 201
    return res.json()["access_token"]


def test_upload_requires_auth(client):
    files = {"files": ("test.jpg", BytesIO(b"abc"), "image/jpeg")}
    res = client.post("/uploads/images", files=files)
    assert res.status_code == 401


def test_upload_rejects_invalid_mime(client):
    token = _signup_and_token(client, "upload1@example.com")
    files = {"files": ("bad.txt", BytesIO(b"abc"), "text/plain")}
    res = client.post("/uploads/images", headers={"Authorization": f"Bearer {token}"}, files=files)
    assert res.status_code == 400


def test_upload_success_returns_public_url_and_key(client):
    token = _signup_and_token(client, "upload2@example.com")
    files = {"files": ("photo.jpg", BytesIO(b"jpeg-bytes"), "image/jpeg")}
    res = client.post("/uploads/images", headers={"Authorization": f"Bearer {token}"}, files=files)

    assert res.status_code == 201
    body = res.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["public_url"]
    assert body["items"][0]["object_key"]
