def _signup_and_token(client, email: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": email.split("@")[0]},
    )
    assert res.status_code == 201
    return res.json()["access_token"], res.json()["user"]["id"]


def test_create_listing_requires_auth(client):
    res = client.post(
        "/listings",
        json={
            "title": "Bike for sale",
            "description": "Great bike in good condition",
            "price": 120,
            "category": "sports",
            "location": "Wichita, KS",
            "images": ["https://img.test/bike.jpg"],
        },
    )
    assert res.status_code == 401


def test_create_listing_success(client):
    token, _ = _signup_and_token(client, "seller@example.com")
    res = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Bike for sale",
            "description": "Great bike in good condition",
            "price": 120,
            "category": "sports",
            "location": "Wichita, KS",
            "images": ["https://img.test/bike.jpg"],
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Bike for sale"
    assert body["status"] == "active"


def test_get_listing_and_listings_public(client):
    token, _ = _signup_and_token(client, "seller2@example.com")
    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Desk lamp",
            "description": "LED desk lamp with adjustable arm",
            "price": 25,
            "category": "home",
            "location": "Wichita, KS",
            "images": ["https://img.test/lamp.jpg"],
        },
    ).json()

    one = client.get(f"/listings/{created['id']}")
    many = client.get("/listings")

    assert one.status_code == 200
    assert one.json()["id"] == created["id"]
    assert many.status_code == 200
    assert len(many.json()["items"]) >= 1


def test_update_and_delete_listing_owner_only(client):
    token_owner, _ = _signup_and_token(client, "owner@example.com")
    token_other, _ = _signup_and_token(client, "other@example.com")

    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token_owner}"},
        json={
            "title": "Textbook",
            "description": "Algorithms textbook, lightly used",
            "price": 40,
            "category": "books",
            "location": "Wichita, KS",
            "images": ["https://img.test/book.jpg"],
        },
    ).json()

    forbidden_update = client.patch(
        f"/listings/{created['id']}",
        headers={"Authorization": f"Bearer {token_other}"},
        json={"price": 35},
    )
    assert forbidden_update.status_code == 403

    ok_update = client.patch(
        f"/listings/{created['id']}",
        headers={"Authorization": f"Bearer {token_owner}"},
        json={"price": 35},
    )
    assert ok_update.status_code == 200
    assert float(ok_update.json()["price"]) == 35

    forbidden_delete = client.delete(
        f"/listings/{created['id']}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert forbidden_delete.status_code == 403

    ok_delete = client.delete(
        f"/listings/{created['id']}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert ok_delete.status_code == 204


def test_search_filters(client):
    token, _ = _signup_and_token(client, "seller3@example.com")

    payloads = [
        {
            "title": "Gaming chair",
            "description": "Comfortable black chair",
            "price": 140,
            "category": "furniture",
            "location": "Wichita, KS",
            "images": ["https://img.test/chair.jpg"],
        },
        {
            "title": "Office chair",
            "description": "Blue office chair",
            "price": 70,
            "category": "furniture",
            "location": "Wichita, KS",
            "images": ["https://img.test/chair2.jpg"],
        },
    ]

    for p in payloads:
        client.post("/listings", headers={"Authorization": f"Bearer {token}"}, json=p)

    res = client.get("/listings/search?keyword=chair&category=furniture&min_price=100")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Gaming chair"
