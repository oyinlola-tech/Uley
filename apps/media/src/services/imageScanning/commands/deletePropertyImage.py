from src.repositories import delete_object


async def delete_stored_property_image(storage_key: str) -> None:
    await delete_object(storage_key)
