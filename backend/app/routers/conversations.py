from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.routers.auth import get_current_user
from app.schemas.messaging import (
    ConversationCreateRequest,
    ConversationListResponse,
    ConversationResponse,
    ConversationStatusUpdateRequest,
)
from app.services import conversations, listings

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _with_listing_title(convo: dict) -> dict:
    listing = listings.get_listing(convo["listing_id"])
    return {
        **convo,
        "listing_title": listing.get("title") if listing else None,
    }


@router.post("", response_model=ConversationResponse)
def create_conversation(
    payload: ConversationCreateRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    listing = listings.get_listing(payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    buyer_id = current_user["id"]
    seller_id = listing["seller_id"]

    if buyer_id == seller_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself on your own listing")

    convo, created = conversations.create_or_get_conversation(
        listing_id=payload.listing_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
    )
    if not created:
        response.status_code = status.HTTP_200_OK
        return ConversationResponse(**_with_listing_title(convo))

    response.status_code = status.HTTP_201_CREATED
    return ConversationResponse(**_with_listing_title(convo))


@router.get("", response_model=ConversationListResponse)
def list_conversations(current_user: dict = Depends(get_current_user)):
    rows = conversations.list_for_user(current_user["id"])
    hydrated = [_with_listing_title(x) for x in rows]
    return ConversationListResponse(items=[ConversationResponse(**x) for x in hydrated], total=len(hydrated))


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    try:
        convo = conversations.get_for_user(conversation_id, current_user["id"])
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail="Forbidden") from exc

    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse(**_with_listing_title(convo))


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def update_conversation_status(
    conversation_id: str,
    payload: ConversationStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        convo = conversations.update_status(conversation_id, current_user["id"], payload.status)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse(**_with_listing_title(convo))
