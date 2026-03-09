from pydantic import BaseModel


class UploadedImage(BaseModel):
    public_url: str
    object_key: str | None = None


class UploadImagesResponse(BaseModel):
    items: list[UploadedImage]
