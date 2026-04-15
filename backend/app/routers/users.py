from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.routers.auth import get_current_user
from app.schemas.auth import PublicUser
from app.services import auth_local, google_auth, uploads

router = APIRouter(prefix="/users", tags=["users"])


def _to_public_user(user: dict) -> PublicUser:
    return PublicUser(
        id=user["id"],
        full_name=user["full_name"],
        created_at=user["created_at"],
        profile_picture=user.get("profile_picture"),
    )


@router.get("/{user_id}", response_model=PublicUser)
def get_user(user_id: str):
    user = auth_local.get_user_by_id(user_id)

    if not user:
        user = google_auth.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _to_public_user(user)


@router.patch("/me/avatar", response_model=PublicUser)
async def update_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()
    try:
        result = uploads.upload_image(
            content=content,
            mime_type=file.content_type or "application/octet-stream",
            filename=file.filename or "avatar.jpg",
            owner_id=current_user["id"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    user = auth_local.update_profile_picture(current_user["id"], result["public_url"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _to_public_user(user)
