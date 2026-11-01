from fastapi import Depends, File, HTTPException, UploadFile
from botocore.exceptions import BotoCoreError, ClientError

from src.errors import ImageRejectedError, ImageScannerUnavailableError
from src.models import ImageScanResponse
from src.services.imageScanning import scan_and_store_advertisement_image
from src.utils.internalAuth import require_internal_service_token
from src.controllers.imageController import read_bounded_upload


async def scan_advertisement_image(advertisement_id: str, image: UploadFile = File(...), _: None = Depends(require_internal_service_token)) -> ImageScanResponse:
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")
    try:
        image_bytes = await read_bounded_upload(image)
        return await scan_and_store_advertisement_image(advertisement_id, image_bytes, image.content_type)
    except ImageRejectedError as validation_error:
        raise HTTPException(status_code=422, detail=str(validation_error)) from validation_error
    except ImageScannerUnavailableError as scanner_error:
        raise HTTPException(status_code=503, detail="The required image scanner is unavailable.") from scanner_error
    except (BotoCoreError, ClientError, OSError, ValueError) as storage_error:
        raise HTTPException(status_code=503, detail="Private image storage is unavailable.") from storage_error
