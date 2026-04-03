def _signup(client, email: str, full_name: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": full_name},
    )
    assert res.status_code == 201
    return res.json()["user"], res.json()["access_token"]


def test_system_buyer_seller_messaging_and_reviews_flow(client):
    seller, seller_token = _signup(client, "seller-system@example.com", "Seller System")
    buyer, buyer_token = _signup(client, "buyer-system@example.com", "Buyer System")

    created = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={
            "title": "System Flow Listing",
            "description": "Used for end-to-end system test",
            "price": 75,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": ["https://img.test/system.jpg"],
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
        json={"text": "Hi, is this still available?"},
    )
    assert sent.status_code == 201

    seller_messages = client.get(
        f"/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert seller_messages.status_code == 200
    assert len(seller_messages.json()["items"]) >= 1

    reviewed = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"seller_id": seller["id"], "rating": 5, "comment": "Great transaction"},
    )
    assert reviewed.status_code == 201

    summary = client.get(f"/reviews/seller/{seller['id']}/rating-summary")
    assert summary.status_code == 200
    assert summary.json()["review_count"] >= 1
    assert summary.json()["average_rating"] >= 1
