from io import BytesIO

from app.services import google_auth


def _signup(client, email: str, password: str = "Password123!", full_name: str = "User"):
    return client.post(
        "/auth/signup",
        json={"email": email, "password": password, "full_name": full_name},
    )


def test_integration_local_auth_listing_lifecycle(client):
    # Auth (SRS/Design: register/login + protected flows)
    signup = _signup(client, "integration@example.com", full_name="Integration User")
    assert signup.status_code == 201
    token = signup.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "integration@example.com"

    # Upload image first (Design flow used by create listing page)
    files = {"files": ("listing.jpg", BytesIO(b"img-bytes"), "image/jpeg")}
    upload = client.post("/uploads/images", headers={"Authorization": f"Bearer {token}"}, files=files)
    assert upload.status_code == 201
    image_url = upload.json()["items"][0]["public_url"]

    # Create listing
    create = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Integration Listing",
            "description": "End-to-end listing created in integration test",
            "price": 123,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": [image_url],
        },
    )
    assert create.status_code == 201
    listing_id = create.json()["id"]

    # Read/list/search
    read_one = client.get(f"/listings/{listing_id}")
    assert read_one.status_code == 200

    read_many = client.get("/listings")
    assert read_many.status_code == 200
    assert any(item["id"] == listing_id for item in read_many.json()["items"])

    search = client.get("/listings/search?keyword=Integration&category=electronics")
    assert search.status_code == 200
    assert any(item["id"] == listing_id for item in search.json()["items"])

    # Update/delete lifecycle
    update = client.patch(
        f"/listings/{listing_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"price": 99, "title": "Updated Integration Listing"},
    )
    assert update.status_code == 200
    assert float(update.json()["price"]) == 99

    delete = client.delete(f"/listings/{listing_id}", headers={"Authorization": f"Bearer {token}"})
    assert delete.status_code == 204

    after_delete = client.get(f"/listings/{listing_id}")
    assert after_delete.status_code == 404


def test_integration_google_oauth_can_access_protected_routes(client, monkeypatch):
    def fake_verify(_token: str):
        return {
            "aud": "test-google-client-id",
            "email": "google-integration@example.com",
            "email_verified": True,
            "name": "Google Integration",
            "sub": "google-sub-int",
        }

    monkeypatch.setattr(google_auth, "verify_google_id_token", fake_verify)

    oauth = client.post("/auth/oauth/google", json={"token": "valid-token"})
    assert oauth.status_code == 200
    token = oauth.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "google-integration@example.com"

    files = {"files": ("google.jpg", BytesIO(b"img"), "image/jpeg")}
    upload = client.post("/uploads/images", headers={"Authorization": f"Bearer {token}"}, files=files)
    assert upload.status_code == 201


def test_integration_enforces_listing_ownership(client):
    owner = _signup(client, "owner-int@example.com", full_name="Owner Int")
    other = _signup(client, "other-int@example.com", full_name="Other Int")
    owner_token = owner.json()["access_token"]
    other_token = other.json()["access_token"]

    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "title": "Owner Listing",
            "description": "Owned by owner user",
            "price": 10,
            "category": "books",
            "location": "Wichita, KS",
            "images": ["https://img.test/owner.jpg"],
        },
    )
    assert created.status_code == 201
    listing_id = created.json()["id"]

    forbidden_update = client.patch(
        f"/listings/{listing_id}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"price": 5},
    )
    assert forbidden_update.status_code == 403

    forbidden_delete = client.delete(
        f"/listings/{listing_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert forbidden_delete.status_code == 403
