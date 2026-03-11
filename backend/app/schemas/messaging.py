from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, model_validator


ConversationStatus = Literal["open", "closed", "blocked"]
MessageKind = Literal["text", "image", "system"]


class ConversationCreateRequest(BaseModel):
    listing_id: str
    seller_id: str | None = None
    buyer_id: str | None = None

    @model_validator(mode="after")
    def validate_no_self_message(self):
        if self.buyer_id and self.seller_id and self.buyer_id == self.seller_id:
            raise ValueError("Buyer cannot start a conversation with themselves")
        return self


class ConversationResponse(BaseModel):
    id: str
    listing_id: str
    buyer_id: str
    seller_id: str
    status: ConversationStatus
    blocked_by_user_id: str | None = None
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    total: int


class ConversationStatusUpdateRequest(BaseModel):
    status: ConversationStatus


class MessageCreateRequest(BaseModel):
    conversation_id: str | None = None
    sender_id: str | None = None
    text: str | None = Field(default=None, min_length=1, max_length=4000)
    image_url: HttpUrl | None = None
    kind: MessageKind = "text"

    @model_validator(mode="after")
    def validate_text_or_image(self):
        if not self.text and not self.image_url:
            raise ValueError("Message requires text or image_url")
        return self


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    text: str | None = None
    image_url: str | None = None
    kind: MessageKind = "text"
    sent_at: datetime
    read_at: datetime | None = None


class MessageListResponse(BaseModel):
    items: list[MessageResponse]
    total: int
