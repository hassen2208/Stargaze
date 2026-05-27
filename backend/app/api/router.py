from fastapi import APIRouter

from app.modules.auth.routes import router as auth_router
from app.modules.tasks.routes import router as tasks_router
from app.modules.voice.routes import router as voice_router
from app.modules.conversation.routes import router as conversation_router
from app.modules.monitoring.routes import router as monitoring_router
from app.modules.metrics.routes import router as metrics_router


api_router = APIRouter()

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"]
)

api_router.include_router(
    tasks_router,
    prefix="/tasks",
    tags=["tasks"]
)

api_router.include_router(
    voice_router,
    prefix="/voice",
    tags=["voice"]
)

api_router.include_router(
    conversation_router,
    prefix="/conversation",
    tags=["conversation"]
)

api_router.include_router(
    monitoring_router,
    prefix="/monitoring",
    tags=["monitoring"]
)

api_router.include_router(
    metrics_router,
    prefix="/metrics",
    tags=["metrics"]
)