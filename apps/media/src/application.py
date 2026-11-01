from fastapi import FastAPI

from src.routes.healthRoutes import health_router
from src.routes.imageRoutes import image_router

application = FastAPI(title="Uley Media Safety", version="0.1.0", docs_url=None, redoc_url=None)
application.include_router(health_router)
application.include_router(image_router, prefix="/internal/v1")
