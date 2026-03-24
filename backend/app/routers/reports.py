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


class CreateReportRequest(BaseModel):
    listing_id: str
    reason: str
    description: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: CreateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    if payload.reason not in VALID_REASONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reason")

    report = reports_service.create_report(
        reporter_id=current_user["id"],
        listing_id=payload.listing_id,
        reason=payload.reason,
        description=payload.description,
    )
    return report
