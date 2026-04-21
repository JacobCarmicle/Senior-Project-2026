from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.routers.auth import get_current_user
from app.services import reports as reports_service

router = APIRouter(prefix="/reports", tags=["reports"])

VALID_REASONS = [
    "Inappropriate content",
    "Misrepresentation",
    "Spam",
    "Prohibited item",
    "Suspected scam",
    "Other",
]

VALID_TARGET_TYPES = {"listing", "user", "message", "review"}


class CreateReportRequest(BaseModel):
    target_type: str
    target_id: str
    listing_id: str | None = None
    reason: str
    description: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: CreateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    if payload.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid target_type")
    if payload.reason not in VALID_REASONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reason")

    try:
        report = reports_service.create_report(
            reporter_id=current_user["id"],
            target_type=payload.target_type,
            target_id=payload.target_id,
            reason=payload.reason,
            description=payload.description,
            listing_id=payload.listing_id,
        )
        return report
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
