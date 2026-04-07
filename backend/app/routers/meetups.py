from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.routers.auth import get_current_user
from app.schemas.meetups import (
    MeetupCreateRequest,
    MeetupResponse,
    MeetupStatusUpdateRequest,
)
from app.services import meetups, realtime

router = APIRouter(prefix="/meetups", tags=["meetups"])


@router.post("", response_model=MeetupResponse)
async def create_meetup(
    payload: MeetupCreateRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    try:
        meetup = meetups.create_meetup(
            conversation_id=payload.conversation_id,
            proposer_id=current_user["id"],
            receiver_id=payload.receiver_id,
            scheduled_at=payload.scheduled_at.isoformat(),
            location=payload.location,
        )
    except ValueError as exc:
        response.status_code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    response.status_code = status.HTTP_201_CREATED
    payload = MeetupResponse(**meetup)
    await realtime.broadcast(
        meetup["conversation_id"],
        {"type": "meetup.created", "conversation_id": meetup["conversation_id"], "meetup": payload.model_dump(mode="json")},
    )
    return payload


@router.get("/{conversation_id}", response_model=MeetupResponse | None)
def get_meetup(conversation_id: str, current_user: dict = Depends(get_current_user)):
    meetup = meetups.get_meetup_for_conversation(conversation_id)
    if not meetup:
        return None

    if current_user["id"] not in [meetup["proposer_id"], meetup["receiver_id"]]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return MeetupResponse(**meetup)


@router.patch("/{meetup_id}/status", response_model=MeetupResponse)
async def update_meetup_status(
    meetup_id: str,
    payload: MeetupStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        meetup = meetups.update_meetup_status(meetup_id, current_user["id"], payload.status)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not meetup:
        raise HTTPException(status_code=404, detail="Meetup not found")

    payload = MeetupResponse(**meetup)
    await realtime.broadcast(
        meetup["conversation_id"],
        {"type": "meetup.status_changed", "conversation_id": meetup["conversation_id"], "meetup": payload.model_dump(mode="json")},
    )
    return payload


@router.delete("/{meetup_id}", response_model=MeetupResponse)
async def delete_meetup(meetup_id: str, current_user: dict = Depends(get_current_user)):
    try:
        meetup = meetups.delete_meetup(meetup_id, current_user["id"])
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    if not meetup:
        raise HTTPException(status_code=404, detail="Meetup not found")

    payload = MeetupResponse(**meetup)
    await realtime.broadcast(
        meetup["conversation_id"],
        {"type": "meetup.deleted", "conversation_id": meetup["conversation_id"], "meetup": payload.model_dump(mode="json")},
    )
    return payload
