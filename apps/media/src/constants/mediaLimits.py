IMAGE_LIMITS = {
    "maximum_bytes": 10 * 1024 * 1024,
    "maximum_width": 8000,
    "maximum_height": 8000,
    "maximum_pixels": 40_000_000,
    "minimum_width": 400,
    "minimum_height": 300,
    "supported_formats": {"JPEG", "PNG", "WEBP"},
    "webp_quality": 86,
    "clamav_chunk_bytes": 64 * 1024,
}

MULTIPART_UPLOAD_LIMITS = {
    "minimum_non_final_part_bytes": 5 * 1024 * 1024,
    "maximum_part_bytes": 5 * 1024 * 1024,
    "maximum_parts": 2,
}
