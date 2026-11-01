import re

from src.repositories import create_signed_image_urls

PROPERTY_IMAGE_KEY_PATTERN = re.compile(r"^(?:properties|advertisements)/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$")


async def create_signed_image_urls_for_storage_keys(storage_keys: list[str]) -> dict[str, str]:
    if any(not PROPERTY_IMAGE_KEY_PATTERN.fullmatch(storage_key) for storage_key in storage_keys):
        raise ValueError("Only verified image storage keys are allowed.")
    if len(storage_keys) != len(set(storage_keys)):
        raise ValueError("Duplicate storage keys are not allowed.")
    return await create_signed_image_urls(storage_keys)
