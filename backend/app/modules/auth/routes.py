from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user

router = APIRouter()


@router.get("/health")
def auth_health():
    return {
        "module": "auth",
        "status": "ok"
    }


@router.get("/me")
def get_me(
    current_user = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }