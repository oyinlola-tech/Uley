import hashlib
import io
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError

from src.constants import IMAGE_LIMITS
from src.errors import ImageRejectedError
from src.interfaces import SanitizedImage

FORMATS_TO_MEDIA_TYPES = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


def sanitize_property_image(image_bytes: bytes, declared_media_type: str | None) -> SanitizedImage:
    if not image_bytes or len(image_bytes) > IMAGE_LIMITS["maximum_bytes"]:
        raise ImageRejectedError("The image is empty or exceeds the 10 MB limit.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(image_bytes)) as source_image:
                if source_image.format not in IMAGE_LIMITS["supported_formats"] or source_image.n_frames != 1:
                    raise ImageRejectedError("Upload a single JPEG, PNG, or WebP image.")
                source_image.verify()
            with Image.open(io.BytesIO(image_bytes)) as source_image:
                if declared_media_type and declared_media_type != FORMATS_TO_MEDIA_TYPES.get(source_image.format):
                    raise ImageRejectedError("The image data does not match its declared file type.")
                oriented_image = ImageOps.exif_transpose(source_image)
                width, height = oriented_image.size
                if not is_acceptable_image_size(width, height):
                    raise ImageRejectedError("The image dimensions are outside the allowed range.")
                normalized_image = oriented_image.convert("RGBA" if "A" in oriented_image.getbands() else "RGB")
                output = io.BytesIO()
                normalized_image.save(output, format="WEBP", quality=IMAGE_LIMITS["webp_quality"], method=4)
    except (Image.DecompressionBombError, Image.DecompressionBombWarning, UnidentifiedImageError, OSError, ValueError) as image_error:
        raise ImageRejectedError("The uploaded file is not a safe, readable image.") from image_error
    sanitized_bytes = output.getvalue()
    return SanitizedImage(sanitized_bytes, hashlib.sha256(sanitized_bytes).hexdigest(), width, height, "image/webp")


def is_acceptable_image_size(width: int, height: int) -> bool:
    return (
        IMAGE_LIMITS["minimum_width"] <= width <= IMAGE_LIMITS["maximum_width"]
        and IMAGE_LIMITS["minimum_height"] <= height <= IMAGE_LIMITS["maximum_height"]
        and width * height <= IMAGE_LIMITS["maximum_pixels"]
    )
