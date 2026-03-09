from fastapi import APIRouter, Depends, HTTPException, status

from app.routers.auth import get_current_user
from app.schemas.messaging import MessageCreateRequest, MessageListResponse, MessageResponse
from app.services import messages

router = APIRouter(prefix="/conversations", tags=["messages"])


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: str,
    payload: MessageCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        msg = messages.send_message(
            conversation_id=conversation_id,
            sender_id=current_user["id"],
            text=payload.text,
            image_url=str(payload.image_url) if payload.image_url else None,
            kind="image" if payload.image_url and not payload.text else payload.kind,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    if not msg:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return MessageResponse(**msg)


@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
def list_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    rows = messages.list_messages_for_user(conversation_id, current_user["id"])
    if rows is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return MessageListResponse(items=[MessageResponse(**x) for x in rows], total=len(rows))


@router.patch("/{conversation_id}/messages/{message_id}/read", response_model=MessageResponse)
def mark_message_read(
    conversation_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        msg = messages.mark_read(
            conversation_id=conversation_id,
            message_id=message_id,
            reader_id=current_user["id"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not msg:
        raise HTTPException(status_code=404, detail="Message or conversation not found")
    return MessageResponse(**msg)
