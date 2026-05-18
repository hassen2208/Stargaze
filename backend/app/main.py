from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings

from prometheus_fastapi_instrumentator import Instrumentator

from app.core.database import Base, engine

from app.models.user_model import User
from app.models.task_model import Task
from app.models.conversation_model import Conversation

from app.middleware.logging_middleware import LoggingMiddleware

from app.middleware.error_handler import (
    global_exception_handler
)

from app.middleware.metrics_middleware import (
    MetricsMiddleware
)

from app.core.rate_limit import limiter

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

app.add_middleware(LoggingMiddleware)

app.add_exception_handler(
    Exception,
    global_exception_handler
)

app.add_middleware(
    MetricsMiddleware
)

app.state.limiter = limiter

app.include_router(
    api_router,
    prefix=settings.API_PREFIX
)

Instrumentator().instrument(app).expose(app)


@app.get("/")
def root():
    return {
        "message": "Stargaze API Running"
    }