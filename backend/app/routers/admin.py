from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.routers.auth import get_current_user
from app.services import auth_local, listings as listings_service, reports as reports_service
from app.schemas.listings import ListingResponse, ListingUpdateRequest

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    return current_user


class UserPatchRequest(BaseModel):
    role: str | None = None
    status: str | None = None


@router.get("/users")
def list_users(current_user: dict = Depends(_require_admin)):
    return auth_local.list_users()


@router.patch("/users/{user_id}")
def patch_user(
    user_id: str,
    payload: UserPatchRequest,
    current_user: dict = Depends(_require_admin),
):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify your own account")

    updated = None
    try:
        if payload.role is not None:
            updated = auth_local.set_user_role(user_id, payload.role)
        if payload.status is not None:
            updated = auth_local.set_user_status(user_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated


# ── Admin Listings ─────────────────────────────────────────────────────────────

@router.get("/listings")
def list_listings(current_user: dict = Depends(_require_admin)):
    items = listings_service.list_all_listings()
    return [ListingResponse(**item) for item in items]


@router.patch("/listings/{listing_id}", response_model=ListingResponse)
def patch_listing(
    listing_id: str,
    payload: ListingUpdateRequest,
    current_user: dict = Depends(_require_admin),
):
    item = listings_service.update_listing(listing_id, current_user["id"], payload.model_dump(exclude_unset=True), is_admin=True)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return ListingResponse(**item)


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: str, current_user: dict = Depends(_require_admin)):
    ok = listings_service.delete_listing(listing_id, current_user["id"], is_admin=True)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")


# ── Admin Reports ───────────────────────────────────────────────────────────────

class ReportPatchRequest(BaseModel):
    status: str


@router.get("/reports")
def list_reports(current_user: dict = Depends(_require_admin)):
    return reports_service.list_reports()


@router.patch("/reports/{report_id}")
def patch_report(
    report_id: str,
    payload: ReportPatchRequest,
    current_user: dict = Depends(_require_admin),
):
    try:
        updated = reports_service.update_report_status(report_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated
