from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def global_health():

    return {
        "status": "healthy",
        "service": "stargaze-api"
    }


@router.get("/ready")
def readiness_check():

    return {
        "ready": True
    }