from app.services import reviews_memory


def test_seller_rating_aggregation_empty_defaults():
    summary = reviews_memory.get_seller_rating_summary("seller-none")
    assert summary["average_rating"] == 0.0
    assert summary["review_count"] == 0


def test_seller_rating_aggregation_computes_average_and_count():
    reviews_memory.create_review(buyer_id="b1", seller_id="seller-agg", rating=5, comment="Great")
    reviews_memory.create_review(buyer_id="b2", seller_id="seller-agg", rating=3, comment="Okay")
    reviews_memory.create_review(buyer_id="b3", seller_id="seller-agg", rating=4, comment="Good")

    summary = reviews_memory.get_seller_rating_summary("seller-agg")

    assert summary["review_count"] == 3
    assert summary["average_rating"] == 4.0


def test_seller_rating_summary_endpoint(client):
    a = client.post(
        "/auth/signup",
        json={"email": "agg-a@example.com", "password": "Password123!", "full_name": "Agg A"},
    )
    b = client.post(
        "/auth/signup",
        json={"email": "agg-b@example.com", "password": "Password123!", "full_name": "Agg B"},
    )
    seller = client.post(
        "/auth/signup",
        json={"email": "agg-seller@example.com", "password": "Password123!", "full_name": "Agg Seller"},
    )

    token_a = a.json()["access_token"]
    token_b = b.json()["access_token"]
    seller_id = seller.json()["user"]["id"]

    r1 = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"seller_id": seller_id, "rating": 5, "comment": "Excellent"},
    )
    r2 = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"seller_id": seller_id, "rating": 4, "comment": "Nice seller"},
    )
    assert r1.status_code == 201
    assert r2.status_code == 201

    summary = client.get(f"/reviews/seller/{seller_id}/rating-summary")
    assert summary.status_code == 200
    body = summary.json()
    assert body["review_count"] == 2
    assert body["average_rating"] == 4.5
