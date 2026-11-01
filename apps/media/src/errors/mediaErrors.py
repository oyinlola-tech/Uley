class ImageRejectedError(Exception):
    """Raised when image bytes violate the media acceptance policy."""


class ImageScannerUnavailableError(Exception):
    """Raised when a required security scanner cannot complete its check."""
