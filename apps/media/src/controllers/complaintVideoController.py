from fastapi import Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from botocore.exceptions import BotoCoreError, ClientError

from src.constants import VIDEO_LIMITS
from src.errors import ImageRejectedError, ImageScannerUnavailableError
from src.models import ComplaintVideoResponse, SignedMediaRequest, SignedMediaResponse
from src.repositories.objectStorage import get_authorized_local_media_path
from src.services.complaintVideos import create_signed_complaint_media_urls, scan_and_store_complaint_video
from src.utils.internalAuth import require_internal_service_token


async def scan_complaint_video(complaint_id: str, video: UploadFile = File(...), _: None = Depends(require_internal_service_token)) -> ComplaintVideoResponse:
    chunks: list[bytes] = []
    size_bytes = 0
    while chunk := await video.read(64 * 1024):
        size_bytes += len(chunk)
        if size_bytes > VIDEO_LIMITS["maximum_bytes"]:
            raise HTTPException(status_code=413, detail="Videos must be 20 MB or smaller.")
        chunks.append(chunk)
    try:
        return await scan_and_store_complaint_video(complaint_id, b"".join(chunks), video.content_type)
    except HTTPException:
        raise
    except ImageRejectedError as malware_error:
        raise HTTPException(status_code=422, detail="The uploaded video did not pass the security scan.") from malware_error
    except ImageScannerUnavailableError as scanner_error:
        raise HTTPException(status_code=503, detail="The required malware scanner is unavailable.") from scanner_error
    except ValueError as video_error:
        raise HTTPException(status_code=422, detail="The uploaded video could not be validated.") from video_error
    except (BotoCoreError, ClientError, OSError) as storage_error:
        raise HTTPException(status_code=503, detail="Private complaint media storage is unavailable.") from storage_error


async def sign_complaint_media_urls(request: SignedMediaRequest, _: None = Depends(require_internal_service_token)) -> SignedMediaResponse:
    try:
        return SignedMediaResponse(media_urls=await create_signed_complaint_media_urls(request.storage_keys))
    except ValueError as request_error:
        raise HTTPException(status_code=422, detail="One or more complaint media keys are invalid.") from request_error
    except (BotoCoreError, ClientError, OSError) as storage_error:
        raise HTTPException(status_code=503, detail="Private complaint media storage is unavailable.") from storage_error


async def get_signed_complaint_media(storage_key: str, expires: int, signature: str) -> FileResponse:
    try:
        if not storage_key.startswith("complaints/"):
            raise ValueError("The signed complaint media URL is invalid.")
        media_path = get_authorized_local_media_path(storage_key, expires, signature)
        media_type = "video/mp4" if storage_key.endswith(".mp4") else "image/webp"
        return FileResponse(media_path, media_type=media_type, headers={"Cache-Control": "private, max-age=300"})
    except (ValueError, OSError) as media_error:
        raise HTTPException(status_code=403, detail="The signed complaint media URL is invalid or expired.") from media_error
