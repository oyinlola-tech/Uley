from dataclasses import dataclass


@dataclass(frozen=True)
class SanitizedImage:
    content: bytes
    sha256: str
    width: int
    height: int
    media_type: str
