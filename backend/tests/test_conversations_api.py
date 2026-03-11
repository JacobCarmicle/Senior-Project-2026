def _signup(client, email: str, name: str):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": name},
    )
    assert res.status_code == 201
    return res.json()["access_token"], res.json()["user"]["id"]


def _create_listing(client, token: str):
    res = client.post(
        "/listings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Seller listing",
            "description": "Seller item for conversation tests",
            "price": 40,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": ["https://img.test/item.jpg"],
        },
    )
    assert res.status_code == 201
    return res.json()


def test_create_conversation_is_idempotent_for_same_listing_and_users(client):
    seller_token, seller_id = _signup(client, "seller-conv@example.com", "Seller Conv")
    buyer_token, buyer_id = _signup(client, "buyer-conv@example.com", "Buyer Conv")
    listing = _create_listing(client, seller_token)

    first = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing["id"]},
    )
    second = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing["id"]},
    )

    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["buyer_id"] == buyer_id
    assert first.json()["seller_id"] == seller_id


def test_cannot_start_conversation_on_own_listing(client):
    seller_token, _ = _signup(client, "self-conv@example.com", "Self Conv")
    listing = _create_listing(client, seller_token)

    res = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={"listing_id": listing["id"]},
    )

    assert res.status_code == 400


def test_list_my_conversations_and_access_control(client):
    seller_token, _ = _signup(client, "seller-access@example.com", "Seller Access")
    buyer_token, _ = _signup(client, "buyer-access@example.com", "Buyer Access")
    other_token, _ = _signup(client, "other-access@example.com", "Other Access")
    listing = _create_listing(client, seller_token)

    convo = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing["id"]},
    ).json()

    mine = client.get("/conversations", headers={"Authorization": f"Bearer {buyer_token}"})
    assert mine.status_code == 200
    assert any(item["id"] == convo["id"] for item in mine.json()["items"])

    forbidden = client.get(
        f"/conversations/{convo['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert forbidden.status_code == 403


def test_close_reopen_block_conversation_rules(client):
    seller_token, _ = _signup(client, "seller-state@example.com", "Seller State")
    buyer_token, _ = _signup(client, "buyer-state@example.com", "Buyer State")
    listing = _create_listing(client, seller_token)

    convo = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing["id"]},
    ).json()

    close = client.patch(
        f"/conversations/{convo['id']}",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"status": "closed"},
    )
    assert close.status_code == 200
    assert close.json()["status"] == "closed"

    reopen = client.patch(
        f"/conversations/{convo['id']}",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={"status": "open"},
    )
    assert reopen.status_code == 200
    assert reopen.json()["status"] == "open"

    block = client.patch(
        f"/conversations/{convo['id']}",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={"status": "blocked"},
    )
    assert block.status_code == 200
    assert block.json()["status"] == "blocked"

    other_reopen = client.patch(
        f"/conversations/{convo['id']}",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"status": "open"},
    )
    assert other_reopen.status_code == 403
