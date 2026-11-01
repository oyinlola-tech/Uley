from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.enums import MediaStorageBackend


class ApplicationSettings(BaseSettings):
    service_api_key: SecretStr = Field(min_length=32)
    clamav_host: str = "clamav"
    clamav_port: int = 3310
    clamav_timeout_seconds: float = 20
    storage_backend: MediaStorageBackend = MediaStorageBackend.LOCAL
    local_storage_path: Path = Path("/data/media")
    public_base_url: str = "http://localhost:8020"
    s3_endpoint_url: str | None = None
    s3_region: str = "auto"
    s3_bucket: str | None = None
    s3_access_key_id: SecretStr | None = None
    s3_secret_access_key: SecretStr | None = None
    image_url_lifetime_seconds: int = 900
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MEDIA_", extra="ignore")


@lru_cache
def get_application_settings() -> ApplicationSettings:
    return ApplicationSettings()
