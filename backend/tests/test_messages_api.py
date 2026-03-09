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
            "title": "Message API listing",
            "description": "Listing used for messages API tests",
            "price": 50,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": ["https://img.test/x.jpg"],
        },
    )
    assert res.status_code == 201
    return res.json()


def _open_conversation(client, buyer_token: str, listing_id: str):
    res = client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"listing_id": listing_id},
    )
    assert res.status_code in (200, 201)
    return res.json()


def test_send_and_list_messages_in_conversation(client):
    seller_token, _ = _signup(client, "seller-msg@example.com", "Seller Msg")
    buyer_token, _ = _signup(client, "buyer-msg@example.com", "Buyer Msg")
    listing = _create_listing(client, seller_token)
    convo = _open_conversation(client, buyer_token, listing["id"])

    send = client.post(
        f"/conversations/{convo['id']}/messages",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"text": "Hey, is this still available?"},
    )
    assert send.status_code == 201
    msg_id = send.json()["id"]

    list_res = client.get(
        f"/conversations/{convo['id']}/messages",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert list_res.status_code == 200
    assert any(m["id"] == msg_id for m in list_res.json()["items"])


def test_cannot_send_message_when_conversation_blocked(client):
    seller_token, _ = _signup(client, "seller-block-msg@example.com", "Seller Block Msg")
    buyer_token, _ = _signup(client, "buyer-block-msg@example.com", "Buyer Block Msg")
    listing = _create_listing(client, seller_token)
    convo = _open_conversation(client, buyer_token, listing["id"])

    block = client.patch(
        f"/conversations/{convo['id']}",
        headers={"Authorization": f"Bearer {seller_token}"},
        json={"status": "blocked"},
    )
    assert block.status_code == 200

    send = client.post(
        f"/conversations/{convo['id']}/messages",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"text": "Can I still message?"},
    )
    assert send.status_code == 403


def test_message_read_receipt(client):
    seller_token, seller_id = _signup(client, "seller-read-msg@example.com", "Seller Read Msg")
    buyer_token, _ = _signup(client, "buyer-read-msg@example.com", "Buyer Read Msg")
    listing = _create_listing(client, seller_token)
    convo = _open_conversation(client, buyer_token, listing["id"])

    send = client.post(
        f"/conversations/{convo['id']}/messages",
        headers={"Authorization": f"Bearer {buyer_token}"},
        json={"text": "Please confirm"},
    )
    assert send.status_code == 201
    msg = send.json()

    read = client.patch(
        f"/conversations/{convo['id']}/messages/{msg['id']}/read",
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    assert read.status_code == 200
    assert read.json()["read_at"] is not None

    sender_cannot_mark_read = client.patch(
        f"/conversations/{convo['id']}/messages/{msg['id']}/read",
        headers={"Authorization": f"Bearer {buyer_token}"},
    )
    assert sender_cannot_mark_read.status_code == 400

    assert msg["sender_id"] != seller_id
