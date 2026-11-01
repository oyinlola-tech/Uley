from uuid import UUID

from botocore.exceptions import ClientError

from src.configs import get_application_settings
from src.repositories.objectStorage import get_object_storage_client


def get_upload_object_key(upload_id: str) -> str:
    return f"upload-sessions/{UUID(upload_id)}"


def create_s3_multipart_session(upload_id: str, media_type: str) -> str:
    settings = get_application_settings()
    result = get_object_storage_client().create_multipart_upload(
        Bucket=settings.s3_bucket, Key=get_upload_object_key(upload_id), ContentType=media_type,
        ServerSideEncryption="AES256", Metadata={"upload-session-id": upload_id},
    )
    return result["UploadId"]


def upload_s3_multipart_part(upload_id: str, provider_upload_id: str, part_number: int, content: bytes) -> None:
    settings = get_application_settings()
    get_object_storage_client().upload_part(
        Bucket=settings.s3_bucket, Key=get_upload_object_key(upload_id), UploadId=provider_upload_id,
        PartNumber=part_number, Body=content,
    )


def list_s3_multipart_parts(upload_id: str, provider_upload_id: str) -> list[dict[str, str | int]]:
    settings = get_application_settings()
    client = get_object_storage_client()
    response = client.list_parts(Bucket=settings.s3_bucket, Key=get_upload_object_key(upload_id), UploadId=provider_upload_id)
    return [{"part_number": part["PartNumber"], "etag": part["ETag"]} for part in response.get("Parts", [])]


def complete_s3_multipart_session(upload_id: str, provider_upload_id: str, total_parts: int) -> bytes:
    settings = get_application_settings()
    client = get_object_storage_client()
    object_key = get_upload_object_key(upload_id)
    try:
        client.head_object(Bucket=settings.s3_bucket, Key=object_key)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") not in {"404", "NoSuchKey", "NotFound"}:
            raise
        parts = list_s3_multipart_parts(upload_id, provider_upload_id)
        if [part["part_number"] for part in parts] != list(range(1, total_parts + 1)):
            raise ValueError("Some image upload chunks are missing.") from None
        client.complete_multipart_upload(
            Bucket=settings.s3_bucket, Key=object_key, UploadId=provider_upload_id,
            MultipartUpload={"Parts": [{"PartNumber": part["part_number"], "ETag": part["etag"]} for part in parts]},
        )
    response = client.get_object(Bucket=settings.s3_bucket, Key=object_key)
    content = response["Body"].read()
    return content


def abort_s3_multipart_session(upload_id: str, provider_upload_id: str) -> None:
    settings = get_application_settings()
    client = get_object_storage_client()
    object_key = get_upload_object_key(upload_id)
    try:
        client.delete_object(Bucket=settings.s3_bucket, Key=object_key)
    finally:
        try:
            client.abort_multipart_upload(Bucket=settings.s3_bucket, Key=object_key, UploadId=provider_upload_id)
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") not in {"NoSuchUpload", "404"}:
                raise
