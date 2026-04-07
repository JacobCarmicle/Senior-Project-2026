def _signup(client, email: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": "Sec User"},
    )
    assert res.status_code == 201
    return res.json()["access_token"]


def test_security_protected_routes_require_auth(client):
    assert client.post("/listings", json={}).status_code == 401
    assert client.post("/uploads/images").status_code == 401


def test_security_invalid_token_rejected(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert res.status_code == 401


def test_security_listing_ownership_enforced(client):
    owner_token = _signup(client, "owner-security@example.com")
    other_token = _signup(client, "other-security@example.com")

    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "title": "Owned listing",
            "description": "Ownership test",
            "price": 10,
            "category": "books",
            "location": "Wichita, KS",
            "images": ["https://img.test/1.jpg"],
        },
    )
    assert created.status_code == 201
    listing_id = created.json()["id"]

    forbidden = client.patch(
        f"/listings/{listing_id}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"price": 5},
    )
    assert forbidden.status_code == 403
