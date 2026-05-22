from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
<<<<<<< Updated upstream

from prometheus_fastapi_instrumentator import Instrumentator

=======
from app.core.firebase import *
>>>>>>> Stashed changes
from app.core.database import Base, engine
from app.models.user_model import User
from app.models.task_model import Task
from app.models.conversation_model import Conversation
# Comentados temporalmente para diagnóstico:
# from app.middleware.logging_middleware import LoggingMiddleware
# from app.middleware.error_handler import global_exception_handler
# from app.middleware.metrics_middleware import MetricsMiddleware
# from app.core.rate_limit import limiter
from prometheus_fastapi_instrumentator import Instrumentator

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# ── CORS configurado correctamente ──────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Middlewares comentados para ver el error real ──
# app.add_middleware(LoggingMiddleware)
# app.add_middleware(MetricsMiddleware)
# app.add_exception_handler(Exception, global_exception_handler)
# app.state.limiter = limiter

app.include_router(api_router, prefix=settings.API_PREFIX)
Instrumentator().instrument(app).expose(app)

@app.get("/")
def root():
<<<<<<< Updated upstream
    return {
        "message": "Stargaze API Running"
    }
=======
    return {"message": "Stargaze API Running"}
>>>>>>> Stashed changes
