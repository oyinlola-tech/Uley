from src.repositories.objectStorage import MEDIA_KEY_PATTERN, create_signed_image_urls


async def create_signed_complaint_media_urls(storage_keys: list[str]) -> dict[str, str]:
    if any(not MEDIA_KEY_PATTERN.fullmatch(key) or not key.startswith("complaints/") for key in storage_keys):
        raise ValueError("Only complaint evidence keys can be signed.")
    if len(storage_keys) != len(set(storage_keys)):
        raise ValueError("Duplicate storage keys are not allowed.")
    return await create_signed_image_urls(storage_keys)
