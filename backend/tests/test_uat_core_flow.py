def test_uat_user_can_signup_create_and_find_listing(client):
    signup = client.post(
        "/auth/signup",
        json={"email": "uat@example.com", "password": "Password123!", "full_name": "UAT User"},
    )
    assert signup.status_code == 201
    token = signup.json()["access_token"]

    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "UAT Phone",
            "description": "UAT listing description",
            "price": 199,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": ["https://img.test/uat.jpg"],
        },
    )
    assert created.status_code == 201
    listing_id = created.json()["id"]

    read_one = client.get(f"/listings/{listing_id}")
    assert read_one.status_code == 200

    search = client.get("/listings/search?keyword=UAT&category=electronics")
    assert search.status_code == 200
    assert any(item["id"] == listing_id for item in search.json()["items"])
