import pytest
from pydantic import ValidationError

from app.schemas.messaging import ConversationCreateRequest, ConversationResponse, MessageCreateRequest


def test_conversation_create_schema_valid():
    payload = ConversationCreateRequest(
        listing_id="listing-123",
        seller_id="seller-1",
    )
    assert payload.listing_id == "listing-123"
    assert payload.seller_id == "seller-1"


def test_conversation_create_schema_rejects_self_message():
    with pytest.raises(ValidationError):
        ConversationCreateRequest(
            listing_id="listing-123",
            seller_id="same-user",
            buyer_id="same-user",
        )


def test_message_create_schema_requires_text_or_image():
    with pytest.raises(ValidationError):
        MessageCreateRequest(conversation_id="c1", sender_id="u1")


def test_message_create_schema_accepts_text_message():
    msg = MessageCreateRequest(
        conversation_id="c1",
        sender_id="u1",
        text="Is this still available?",
    )
    assert msg.text == "Is this still available?"
    assert msg.image_url is None


def test_message_create_schema_accepts_image_message():
    msg = MessageCreateRequest(
        conversation_id="c1",
        sender_id="u1",
        image_url="https://img.test/chat.jpg",
    )
    assert str(msg.image_url) == "https://img.test/chat.jpg"


def test_conversation_response_schema_status_enum():
    convo = ConversationResponse(
        id="conv-1",
        listing_id="listing-1",
        buyer_id="buyer-1",
        seller_id="seller-1",
        status="open",
        created_at="2026-03-09T00:00:00Z",
        updated_at="2026-03-09T00:00:00Z",
    )
    assert convo.status == "open"
