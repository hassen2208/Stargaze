from sqlalchemy.orm import Session

from app.modules.auth.repository import AuthRepository


class AuthService:

    @staticmethod
    def sync_user(
        db: Session,
        firebase_data: dict
    ):

        firebase_uid = firebase_data.get("uid")

        email = firebase_data.get("email")

        name = firebase_data.get("name")

        existing_user = AuthRepository.get_user_by_uid(
            db,
            firebase_uid
        )

        if existing_user:
            return existing_user

        return AuthRepository.create_user(
            db=db,
            firebase_uid=firebase_uid,
            email=email,
            name=name
        )