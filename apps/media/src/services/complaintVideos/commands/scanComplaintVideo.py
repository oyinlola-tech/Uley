import asyncio
import hashlib
import io
import json
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from PIL import Image

from src.constants.videoLimits import VIDEO_LIMITS
from src.enums import ImageScanStatus
from src.models.mediaSchemas import ComplaintVideoResponse
from src.repositories.objectStorage import create_private_media
from src.utils import scan_bytes_with_clamav


async def scan_and_store_complaint_video(complaint_id: str, video_bytes: bytes, declared_media_type: str | None) -> ComplaintVideoResponse:
    if declared_media_type != VIDEO_LIMITS["allowed_media_type"] or len(video_bytes) > VIDEO_LIMITS["maximum_bytes"]:
        raise HTTPException(status_code=415, detail="Upload an MP4 video that is 20 MB or smaller.")
    if len(video_bytes) < 12 or video_bytes[4:8] != b"ftyp":
        raise HTTPException(status_code=422, detail="The uploaded file is not a valid MP4 video.")
    await scan_bytes_with_clamav(video_bytes)
    try:
        safe_video, poster_bytes, duration_seconds = await asyncio.wait_for(
            normalize_video(video_bytes), timeout=VIDEO_LIMITS["maximum_upload_seconds"]
        )
    except (ValueError, TimeoutError) as processing_error:
        raise HTTPException(status_code=422, detail="The video could not be processed safely or exceeds 90 seconds.") from processing_error
    if len(safe_video) > VIDEO_LIMITS["maximum_bytes"]:
        raise HTTPException(status_code=413, detail="The processed video exceeds the 20 MB limit.")
    await scan_bytes_with_clamav(safe_video)
    await scan_bytes_with_clamav(poster_bytes)
    digest = hashlib.sha256(safe_video).hexdigest()
    media_id = str(uuid4())
    video_key = f"complaints/{complaint_id}/{media_id}.mp4"
    poster_key = f"complaints/{complaint_id}/{media_id}.webp"
    try:
        await create_private_media(video_key, safe_video, "video/mp4", digest)
        await create_private_media(poster_key, poster_bytes, "image/webp", hashlib.sha256(poster_bytes).hexdigest())
    except Exception:
        from src.repositories.objectStorage import delete_object

        for storage_key in (video_key, poster_key):
            try:
                await delete_object(storage_key)
            except Exception:
                continue
        raise OSError("Complaint video storage failed.")
    return ComplaintVideoResponse(
        video_storage_key=video_key, poster_storage_key=poster_key, sha256=digest,
        size_bytes=len(safe_video), duration_seconds=duration_seconds, scan_status=ImageScanStatus.CLEAN,
    )


async def normalize_video(video_bytes: bytes) -> tuple[bytes, bytes, int]:
    with tempfile.TemporaryDirectory(prefix="uley-complaint-video-") as temporary_directory:
        temporary_path = Path(temporary_directory)
        output_video = temporary_path / "normalized.mp4"
        probe, _ = await run_process([
            "ffprobe", "-v", "error", "-protocol_whitelist", "pipe,file", "-show_entries",
            "format=duration", "-of", "json", "pipe:0",
        ], video_bytes, 20)
        duration = float(json.loads(probe[0])["format"]["duration"])
        if duration <= 0 or duration > VIDEO_LIMITS["maximum_duration_seconds"]:
            raise ValueError("The video must be 90 seconds or shorter.")
        await run_process([
            "ffmpeg", "-v", "error", "-y", "-protocol_whitelist", "pipe,file", "-i", "pipe:0",
            "-t", str(VIDEO_LIMITS["maximum_duration_seconds"]), "-map_metadata", "-1", "-vf",
            "scale=w='min(1280,iw)':h=-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "29",
            "-c:a", "aac", "-b:a", "96k", "-maxrate", "1100k", "-bufsize", "2200k", "-fs", str(VIDEO_LIMITS["maximum_bytes"]),
            "-movflags", "+faststart", str(output_video),
        ], video_bytes, VIDEO_LIMITS["maximum_upload_seconds"])
        safe_video = output_video.read_bytes()
        poster_png = temporary_path / "poster.png"
        await run_process([
            "ffmpeg", "-v", "error", "-y", "-ss", "0", "-i", str(output_video), "-frames:v", "1",
            "-vf", "scale=w='min(640,iw)':h=-2", str(poster_png),
        ], b"", 20)
        poster_image = Image.open(poster_png).convert("RGB")
        poster_buffer = io.BytesIO()
        poster_image.save(poster_buffer, format="WEBP", quality=78, method=4)
        return safe_video, poster_buffer.getvalue(), max(1, round(duration))


async def run_process(arguments: list[str], input_bytes: bytes, timeout_seconds: int) -> tuple[bytes, bytes]:
    process = await asyncio.create_subprocess_exec(*arguments, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(input=input_bytes), timeout=timeout_seconds)
    except TimeoutError:
        process.kill()
        await process.wait()
        raise ValueError("Video processing took too long.")
    if process.returncode != 0:
        raise ValueError("The video could not be decoded safely.")
    return stdout, stderr
