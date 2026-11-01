import asyncio
import struct

from src.configs import get_application_settings
from src.constants import IMAGE_LIMITS
from src.errors import ImageRejectedError, ImageScannerUnavailableError


async def scan_bytes_with_clamav(image_bytes: bytes) -> None:
    settings = get_application_settings()
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(settings.clamav_host, settings.clamav_port),
            timeout=settings.clamav_timeout_seconds,
        )
        writer.write(b"zINSTREAM\0")
        chunk_size = IMAGE_LIMITS["clamav_chunk_bytes"]
        for start in range(0, len(image_bytes), chunk_size):
            image_chunk = image_bytes[start : start + chunk_size]
            writer.write(struct.pack("!I", len(image_chunk)) + image_chunk)
        writer.write(struct.pack("!I", 0))
        await writer.drain()
        response = await asyncio.wait_for(reader.readline(), timeout=settings.clamav_timeout_seconds)
        writer.close()
        await writer.wait_closed()
    except (OSError, TimeoutError, asyncio.TimeoutError) as scan_error:
        raise ImageScannerUnavailableError("The malware scanner is unavailable.") from scan_error
    if response.endswith(b"FOUND\n"):
        raise ImageRejectedError("The image contains content identified as malware.")
    if not response.endswith(b"OK\n"):
        raise ImageScannerUnavailableError("The malware scanner did not confirm a clean result.")


async def ping_clamav() -> bool:
    settings = get_application_settings()
    try:
        reader, writer = await asyncio.wait_for(asyncio.open_connection(settings.clamav_host, settings.clamav_port), timeout=3)
        writer.write(b"zPING\0")
        await writer.drain()
        response = await asyncio.wait_for(reader.readline(), timeout=3)
        writer.close()
        await writer.wait_closed()
        return response == b"PONG\n"
    except (OSError, TimeoutError, asyncio.TimeoutError):
        return False
