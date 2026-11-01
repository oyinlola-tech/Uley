from fastapi import Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from botocore.exceptions import BotoCoreError, ClientError

from src.constants import IMAGE_LIMITS
from src.errors import ImageRejectedError, ImageScannerUnavailableError
from src.models import DeleteImageRequest, ImageScanResponse, SignedImageRequest, SignedImageResponse
from src.repositories import get_authorized_local_media_path
from src.services.imageScanning import delete_stored_property_image, scan_and_store_property_image, create_signed_image_urls_for_storage_keys
from src.utils.internalAuth import require_internal_service_token


async def read_bounded_upload(upload: UploadFile) -> bytes:
    image_chunks: list[bytes] = []
    total_bytes = 0
    while image_chunk := await upload.read(64 * 1024):
        total_bytes += len(image_chunk)
        if total_bytes > IMAGE_LIMITS["maximum_bytes"]:
            raise HTTPException(status_code=413, detail="Images must be 10 MB or smaller.")
        image_chunks.append(image_chunk)
    return b"".join(image_chunks)


async def scan_property_image(property_id: str, image: UploadFile = File(...), _: None = Depends(require_internal_service_token)) -> ImageScanResponse:
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")
    try:
        image_bytes = await read_bounded_upload(image)
        return await scan_and_store_property_image(property_id, image_bytes, image.content_type)
    except ImageRejectedError as validation_error:
        raise HTTPException(status_code=422, detail=str(validation_error)) from validation_error
    except ImageScannerUnavailableError as scanner_error:
        raise HTTPException(status_code=503, detail="The required image scanner is unavailable.") from scanner_error
    except (BotoCoreError, ClientError, OSError, ValueError) as storage_error:
        raise HTTPException(status_code=503, detail="Private image storage is unavailable.") from storage_error


async def sign_property_image_urls(request: SignedImageRequest, _: None = Depends(require_internal_service_token)) -> SignedImageResponse:
    try:
        signed_urls = await create_signed_image_urls_for_storage_keys(request.storage_keys)
        return SignedImageResponse(image_urls=signed_urls)
    except ValueError as request_error:
        raise HTTPException(status_code=422, detail="One or more image keys are invalid.") from request_error
    except (BotoCoreError, ClientError, OSError, ValueError) as storage_error:
        raise HTTPException(status_code=503, detail="Private image storage is unavailable.") from storage_error


async def delete_property_image(request: DeleteImageRequest, _: None = Depends(require_internal_service_token)) -> dict[str, bool]:
    try:
        await delete_stored_property_image(request.storage_key)
        return {"deleted": True}
    except (BotoCoreError, ClientError, OSError, ValueError) as storage_error:
        raise HTTPException(status_code=503, detail="Private image storage is unavailable.") from storage_error


async def get_signed_local_property_image(storage_key: str, expires: int, signature: str) -> FileResponse:
    try:
        if not storage_key.startswith(("properties/", "advertisements/")):
            raise ValueError("The signed image URL is invalid.")
        image_path = get_authorized_local_media_path(storage_key, expires, signature)
        return FileResponse(image_path, media_type="image/webp", headers={"Cache-Control": "private, max-age=300"})
    except (ValueError, OSError) as image_error:
        raise HTTPException(status_code=403, detail="The signed image URL is invalid or expired.") from image_error
