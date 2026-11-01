import asyncio
import hashlib
import hmac
import re
import time
from pathlib import Path
from uuid import uuid4

import boto3
from botocore.config import Config

from src.configs import get_application_settings
from src.enums import MediaStorageBackend
from src.interfaces import SanitizedImage

MEDIA_KEY_PATTERN = re.compile(r"^(?:(?:properties|advertisements)/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp|complaints/[0-9a-f-]{36}/[0-9a-f-]{36}\.(?:mp4|jpg))$")


def get_object_storage_client():
    settings = get_application_settings()
    if not settings.s3_bucket or not settings.s3_access_key_id or not settings.s3_secret_access_key:
        raise ValueError("S3 storage requires bucket and credentials.")
    if not settings.s3_access_key_id.get_secret_value() or not settings.s3_secret_access_key.get_secret_value():
        raise ValueError("S3 storage requires bucket and credentials.")
    return boto3.client(
        "s3", endpoint_url=settings.s3_endpoint_url, region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key_id.get_secret_value(),
        aws_secret_access_key=settings.s3_secret_access_key.get_secret_value(),
        config=Config(signature_version="s3v4"),
    )


def get_local_object_path(storage_key: str) -> Path:
    if not MEDIA_KEY_PATTERN.fullmatch(storage_key):
        raise ValueError("The media storage key is invalid.")
    settings = get_application_settings()
    storage_root = settings.local_storage_path.resolve()
    object_path = (storage_root / storage_key).resolve()
    if storage_root not in object_path.parents:
        raise ValueError("The image storage key is invalid.")
    return object_path


def create_local_signed_url(storage_key: str, expires_at: int) -> str:
    settings = get_application_settings()
    signed_value = f"{storage_key}:{expires_at}".encode()
    signature = hmac.new(settings.service_api_key.get_secret_value().encode(), signed_value, hashlib.sha256).hexdigest()
    route = "images/local" if storage_key.startswith(("properties/", "advertisements/")) else "media/local"
    return f"{settings.public_base_url.rstrip('/')}/internal/v1/{route}/{storage_key}?expires={expires_at}&signature={signature}"


def get_authorized_local_media_path(storage_key: str, expires_at: int, signature: str) -> Path:
    settings = get_application_settings()
    signed_value = f"{storage_key}:{expires_at}".encode()
    expected_signature = hmac.new(settings.service_api_key.get_secret_value().encode(), signed_value, hashlib.sha256).hexdigest()
    if expires_at < int(time.time()) or not hmac.compare_digest(expected_signature, signature):
        raise ValueError("The signed image URL is invalid or expired.")
    return get_local_object_path(storage_key)


async def create_private_image(entity_id: str, image: SanitizedImage, image_scope: str = "properties") -> str:
    if image_scope not in {"properties", "advertisements"}:
        raise ValueError("The image storage scope is invalid.")
    settings = get_application_settings()
    storage_key = f"{image_scope}/{entity_id}/{uuid4()}.webp"
    if settings.storage_backend == MediaStorageBackend.LOCAL:
        file_path = get_local_object_path(storage_key)
        await asyncio.to_thread(file_path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(file_path.write_bytes, image.content)
        return storage_key
    await asyncio.to_thread(
        get_object_storage_client().put_object, Bucket=settings.s3_bucket, Key=storage_key, Body=image.content,
        ContentType=image.media_type, ServerSideEncryption="AES256", Metadata={"sha256": image.sha256},
    )
    return storage_key


async def create_private_media(storage_key: str, content: bytes, media_type: str, sha256: str) -> None:
    if not MEDIA_KEY_PATTERN.fullmatch(storage_key) or not storage_key.startswith("complaints/"):
        raise ValueError("The complaint media storage key is invalid.")
    settings = get_application_settings()
    if settings.storage_backend == MediaStorageBackend.LOCAL:
        file_path = get_local_object_path(storage_key)
        await asyncio.to_thread(file_path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(file_path.write_bytes, content)
        return
    await asyncio.to_thread(
        get_object_storage_client().put_object, Bucket=settings.s3_bucket, Key=storage_key, Body=content,
        ContentType=media_type, ServerSideEncryption="AES256", Metadata={"sha256": sha256},
    )


async def create_signed_image_urls(storage_keys: list[str]) -> dict[str, str]:
    settings = get_application_settings()
    if settings.storage_backend == MediaStorageBackend.LOCAL:
        expires_at = int(time.time()) + settings.image_url_lifetime_seconds
        return {key: create_local_signed_url(key, expires_at) for key in storage_keys}
    client = get_object_storage_client()
    urls = await asyncio.gather(*[
        asyncio.to_thread(client.generate_presigned_url, "get_object", Params={"Bucket": settings.s3_bucket, "Key": key}, ExpiresIn=settings.image_url_lifetime_seconds)
        for key in storage_keys
    ])
    return dict(zip(storage_keys, urls, strict=True))


async def delete_object(storage_key: str) -> None:
    settings = get_application_settings()
    if settings.storage_backend == MediaStorageBackend.LOCAL:
        file_path = get_local_object_path(storage_key)
        await asyncio.to_thread(file_path.unlink, missing_ok=True)
        return
    await asyncio.to_thread(get_object_storage_client().delete_object, Bucket=settings.s3_bucket, Key=storage_key)


async def check_object_storage_health() -> bool:
    settings = get_application_settings()
    if settings.storage_backend == MediaStorageBackend.LOCAL:
        try:
            storage_path = settings.local_storage_path.resolve()
            await asyncio.to_thread(storage_path.mkdir, parents=True, exist_ok=True)
            probe_path = storage_path / f".health-{uuid4()}"
            await asyncio.to_thread(probe_path.write_text, "ready")
            await asyncio.to_thread(probe_path.unlink, missing_ok=True)
            return True
        except OSError:
            return False
    try:
        await asyncio.to_thread(get_object_storage_client().head_bucket, Bucket=settings.s3_bucket)
        return True
    except Exception:
        return False
