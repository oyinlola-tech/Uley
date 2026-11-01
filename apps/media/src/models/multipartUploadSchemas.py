from pydantic import BaseModel, Field
from src.constants import MULTIPART_UPLOAD_LIMITS


class MultipartUploadStartRequest(BaseModel):
    upload_id: str = Field(pattern=r"^[0-9a-f-]{36}$")
    media_type: str = Field(pattern=r"^image/(jpeg|png|webp)$")


class MultipartUploadSessionResponse(BaseModel):
    provider_upload_id: str


class MultipartUploadPartRequest(BaseModel):
    provider_upload_id: str


class MultipartUploadCompleteRequest(BaseModel):
    provider_upload_id: str
    total_parts: int = Field(ge=1, le=MULTIPART_UPLOAD_LIMITS["maximum_parts"])


class MultipartUploadStatusRequest(BaseModel):
    provider_upload_id: str


class MultipartUploadStatusResponse(BaseModel):
    parts: list[dict[str, str | int]]
