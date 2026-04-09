from fastapi import APIRouter, Depends

from app.routers.auth import get_current_user
from app.schemas.notifications import NotificationListResponse, NotificationResponse
from app.services import notifications_supabase as svc

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(current_user: dict = Depends(get_current_user)):
    items, unread = svc.list_notifications(current_user["id"])
    return NotificationListResponse(
        items=[NotificationResponse(**n) for n in items],
        unread_count=unread,
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    svc.mark_read(notification_id, current_user["id"])
    items, _ = svc.list_notifications(current_user["id"])
    match = next((n for n in items if n["id"] == notification_id), None)
    if not match:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationResponse(**match)


@router.post("/read-all", status_code=204)
def mark_all_read(current_user: dict = Depends(get_current_user)):
    svc.mark_all_read(current_user["id"])
