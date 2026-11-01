from enum import StrEnum


class MediaStorageBackend(StrEnum):
    LOCAL = "local"
    S3 = "s3"
