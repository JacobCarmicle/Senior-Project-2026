from io import BytesIO


def test_smoke_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_smoke_core_auth_and_listing_flow(client):
    signup = client.post(
        "/auth/signup",
        json={"email": "smoke@example.com", "password": "Password123!", "full_name": "Smoke User"},
    )
    assert signup.status_code == 201
    token = signup.json()["access_token"]

    files = {"files": ("smoke.jpg", BytesIO(b"img"), "image/jpeg")}
    upload = client.post("/uploads/images", headers={"Authorization": f"Bearer {token}"}, files=files)
    assert upload.status_code == 201

    create = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Smoke Listing",
            "description": "Smoke test listing",
            "price": 25,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": [upload.json()["items"][0]["public_url"]],
        },
    )
    assert create.status_code == 201
    listing_id = create.json()["id"]

    read = client.get(f"/listings/{listing_id}")
    assert read.status_code == 200
