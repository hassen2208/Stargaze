import app.models

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from prometheus_fastapi_instrumentator import Instrumentator

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, engine


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://stargaze-1.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(
    api_router,
    prefix=settings.API_PREFIX
)

Instrumentator().instrument(app).expose(
    app,
    endpoint="/metrics"
)


@app.get("/")
def root():
    return {
        "message": "Stargaze API Running"
    }