def _signup(client, email: str, full_name: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": full_name},
    )
    assert res.status_code == 201
    return res.json()["user"], res.json()["access_token"]


def test_uat_user_can_signup_create_and_find_listing(client):
    _, token = _signup(client, "uat@example.com", "UAT User")

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


def test_uat_buyer_can_message_seller_and_leave_review(client):
    seller, seller_token = _signup(client, "uat-seller@example.com", "UAT Seller")
    _, buyer_token = _signup(client, "uat-buyer@example.com", "UAT Buyer")

    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={
            "title": "UAT Console",
            "description": "Good condition",
            "price": 120,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": ["https://img.test/uat-console.jpg"],
        },
    )
    assert created.status_code == 201
    listing_id = created.json()["id"]

    convo = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing_id},
    )
    assert convo.status_code == 201
    conversation_id = convo.json()["id"]

    sent = client.post(
        f"/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"text": "Can I pick this up today?"},
    )
    assert sent.status_code == 201

    review = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"seller_id": seller["id"], "rating": 5, "comment": "Great seller"},
    )
    assert review.status_code == 201
