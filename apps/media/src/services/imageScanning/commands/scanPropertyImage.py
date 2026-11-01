import asyncio

from src.interfaces import SanitizedImage
from src.enums import ImageScanStatus
from src.models import ImageScanResponse
from src.repositories import create_private_image
from src.utils import sanitize_property_image, scan_bytes_with_clamav


async def scan_and_store_image(entity_id: str, image_bytes: bytes, declared_media_type: str | None, image_scope: str = "properties") -> ImageScanResponse:
    await scan_bytes_with_clamav(image_bytes)
    sanitized_image: SanitizedImage = await asyncio.to_thread(sanitize_property_image, image_bytes, declared_media_type)
    await scan_bytes_with_clamav(sanitized_image.content)
    storage_key = await create_private_image(entity_id, sanitized_image, image_scope)
    return ImageScanResponse(
        storage_key=storage_key,
        sha256=sanitized_image.sha256,
        width=sanitized_image.width,
        height=sanitized_image.height,
        media_type=sanitized_image.media_type,
        scan_status=ImageScanStatus.CLEAN,
    )


async def scan_and_store_property_image(property_id: str, image_bytes: bytes, declared_media_type: str | None) -> ImageScanResponse:
    return await scan_and_store_image(property_id, image_bytes, declared_media_type)


async def scan_and_store_advertisement_image(advertisement_id: str, image_bytes: bytes, declared_media_type: str | None) -> ImageScanResponse:
    return await scan_and_store_image(advertisement_id, image_bytes, declared_media_type, "advertisements")
