from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.routers.auth import get_current_user
from app.schemas.uploads import UploadImagesResponse, UploadedImage
from app.services import uploads

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/images", response_model=UploadImagesResponse, status_code=status.HTTP_201_CREATED)
async def upload_images(
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded")

    uploaded: list[UploadedImage] = []

    for file in files:
        content = await file.read()
        try:
            item = uploads.upload_image(
                content=content,
                mime_type=file.content_type or "application/octet-stream",
                filename=file.filename or "upload.bin",
                owner_id=current_user["id"],
            )
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        uploaded.append(UploadedImage(public_url=item["public_url"], object_key=item.get("object_key")))

    return UploadImagesResponse(items=uploaded)
