from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.services.firebase_service import FirebaseService

from app.modules.auth.service import AuthService

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    try:

        token = credentials.credentials

        decoded_token = FirebaseService.verify_token(token)

        user = AuthService.sync_user(
            db,
            decoded_token
        )

        return user

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )