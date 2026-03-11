def _signup(client, email: str, name: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": name},
    )
    assert res.status_code == 201
    return res.json()["access_token"], res.json()["user"]["id"]


def test_create_review_and_list_by_seller(client):
    buyer_token, buyer_id = _signup(client, "buyer-review@example.com", "Buyer Review")
    _, seller_id = _signup(client, "seller-review@example.com", "Seller Review")

    create = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={
            "seller_id": seller_id,
            "rating": 5,
            "comment": "Great seller, item matched description.",
        },
    )
    assert create.status_code == 201
    assert create.json()["buyer_id"] == buyer_id

    listed = client.get(f"/reviews/seller/{seller_id}")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["rating"] == 5


def test_review_validation_and_permissions(client):
    token, user_id = _signup(client, "self-review@example.com", "Self Review")

    self_review = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={"seller_id": user_id, "rating": 5, "comment": "Self review"},
    )
    assert self_review.status_code == 400

    bad_rating = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={"seller_id": "other-user", "rating": 10, "comment": "Too high"},
    )
    assert bad_rating.status_code == 422


def test_duplicate_review_for_same_buyer_seller_rejected(client):
    buyer_token, _ = _signup(client, "buyer-dupe-review@example.com", "Buyer Dupe")
    _, seller_id = _signup(client, "seller-dupe-review@example.com", "Seller Dupe")

    first = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"seller_id": seller_id, "rating": 4, "comment": "Good"},
    )
    second = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"seller_id": seller_id, "rating": 3, "comment": "Changed mind"},
    )

    assert first.status_code == 201
    assert second.status_code == 409
