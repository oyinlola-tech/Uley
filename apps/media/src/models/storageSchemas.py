from pydantic import BaseModel, Field


class DeleteImageRequest(BaseModel):
    storage_key: str = Field(pattern=r"^(?:(?:properties|advertisements)/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp|complaints/[0-9a-f-]{36}/[0-9a-f-]{36}\.(?:mp4|webp))$")
