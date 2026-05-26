from sqlalchemy.orm import Session

from app.modules.auth.service import AuthService


class AuthController:

    @staticmethod
    def authenticate_user(
        db: Session,
        firebase_data: dict
    ):

        return AuthService.sync_user(
            db,
            firebase_data
        )