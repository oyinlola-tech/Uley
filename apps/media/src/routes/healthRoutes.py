from fastapi import APIRouter
from fastapi.responses import JSONResponse

from src.repositories import check_object_storage_health
from src.utils.clamavClient import ping_clamav

health_router = APIRouter()


@health_router.get("/health/live")
async def check_liveness() -> dict[str, str]:
    return {"status": "live"}


@health_router.get("/health/ready")
async def check_readiness() -> JSONResponse:
    malware_scanner_is_ready, object_storage_is_ready = await ping_clamav(), await check_object_storage_health()
    is_ready = malware_scanner_is_ready and object_storage_is_ready
    return JSONResponse(
        status_code=200 if is_ready else 503,
        content={"status": "ready" if is_ready else "not_ready", "clamav": malware_scanner_is_ready, "object_storage": object_storage_is_ready},
    )
