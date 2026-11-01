from pydantic import BaseModel, Field
from src.enums import ImageScanStatus


class ImageScanResponse(BaseModel):
    storage_key: str
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    media_type: str = "image/webp"
    scan_status: ImageScanStatus


class SignedImageRequest(BaseModel):
    storage_keys: list[str] = Field(min_length=1, max_length=100)


class SignedImageResponse(BaseModel):
    image_urls: dict[str, str]


class ComplaintVideoResponse(BaseModel):
    video_storage_key: str
    poster_storage_key: str
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    size_bytes: int = Field(gt=0)
    duration_seconds: int = Field(gt=0, le=90)
    media_type: str = "video/mp4"
    scan_status: ImageScanStatus


class SignedMediaRequest(BaseModel):
    storage_keys: list[str] = Field(min_length=1, max_length=100)


class SignedMediaResponse(BaseModel):
    media_urls: dict[str, str]
