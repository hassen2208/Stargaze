from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.modules.metrics.routes import metrics_dashboard

router = APIRouter()


@router.get("/health")
def monitoring_health():
    return {
        "module": "monitoring",
        "status": "ok"
    }


@router.get("/ready")
def monitoring_ready():
    return {
        "status": "ready"
    }


@router.get("/metrics-summary")
def metrics_summary(
    current_user = Depends(get_current_user)
):
    return metrics_dashboard(
        current_user
    )