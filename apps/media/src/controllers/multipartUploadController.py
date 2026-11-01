from fastapi import Depends, HTTPException, Request, Response
from botocore.exceptions import BotoCoreError, ClientError

from src.configs import get_application_settings
from src.constants import MULTIPART_UPLOAD_LIMITS
from src.enums import MediaStorageBackend
from src.models import MultipartUploadCompleteRequest, MultipartUploadPartRequest, MultipartUploadStartRequest, MultipartUploadStatusRequest, MultipartUploadStatusResponse, MultipartUploadSessionResponse
from src.repositories import abort_s3_multipart_session, complete_s3_multipart_session, create_s3_multipart_session, list_s3_multipart_parts, upload_s3_multipart_part
from src.utils.internalAuth import require_internal_service_token


def require_s3_storage() -> None:
    if get_application_settings().storage_backend != MediaStorageBackend.S3:
        raise HTTPException(status_code=409, detail="Shared upload sessions require S3 storage.")


async def start_multipart_upload(request: MultipartUploadStartRequest, _: None = Depends(require_internal_service_token), __: None = Depends(require_s3_storage)) -> MultipartUploadSessionResponse:
    try:
        return MultipartUploadSessionResponse(provider_upload_id=create_s3_multipart_session(request.upload_id, request.media_type))
    except (BotoCoreError, ClientError, ValueError) as error:
        raise HTTPException(status_code=503, detail="Shared image storage could not start this upload.") from error


async def upload_multipart_part(upload_id: str, part_number: int, request: Request, provider_upload_id: str, _: None = Depends(require_internal_service_token), __: None = Depends(require_s3_storage)) -> dict[str, bool]:
    content = await request.body()
    if part_number < 1 or part_number > MULTIPART_UPLOAD_LIMITS["maximum_parts"] or not content or len(content) > MULTIPART_UPLOAD_LIMITS["maximum_part_bytes"]:
        raise HTTPException(status_code=413, detail="The image upload chunk is invalid.")
    try:
        upload_s3_multipart_part(upload_id, provider_upload_id, part_number, content)
        return {"uploaded": True}
    except (BotoCoreError, ClientError, ValueError) as error:
        raise HTTPException(status_code=503, detail="The image upload chunk could not be stored.") from error


async def get_multipart_upload_status(upload_id: str, request: MultipartUploadStatusRequest, _: None = Depends(require_internal_service_token), __: None = Depends(require_s3_storage)) -> MultipartUploadStatusResponse:
    try:
        return MultipartUploadStatusResponse(parts=list_s3_multipart_parts(upload_id, request.provider_upload_id))
    except (BotoCoreError, ClientError, ValueError) as error:
        raise HTTPException(status_code=503, detail="Shared image upload status is unavailable.") from error


async def complete_multipart_upload(upload_id: str, request: MultipartUploadCompleteRequest, _: None = Depends(require_internal_service_token), __: None = Depends(require_s3_storage)) -> Response:
    try:
        content = complete_s3_multipart_session(upload_id, request.provider_upload_id, request.total_parts)
        return Response(content=content, media_type="application/octet-stream")
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (BotoCoreError, ClientError) as error:
        raise HTTPException(status_code=503, detail="The shared image upload could not be completed.") from error


async def abort_multipart_upload(upload_id: str, request: MultipartUploadPartRequest, _: None = Depends(require_internal_service_token), __: None = Depends(require_s3_storage)) -> dict[str, bool]:
    try:
        abort_s3_multipart_session(upload_id, request.provider_upload_id)
        return {"aborted": True}
    except (BotoCoreError, ClientError, ValueError) as error:
        raise HTTPException(status_code=503, detail="The abandoned image upload could not be removed.") from error
