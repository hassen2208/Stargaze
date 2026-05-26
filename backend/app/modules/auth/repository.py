from sqlalchemy.orm import Session

from app.models.user_model import User


class AuthRepository:

    @staticmethod
    def get_user_by_uid(
        db: Session,
        firebase_uid: str
    ):

        return db.query(User).filter(
            User.firebase_uid == firebase_uid
        ).first()

    @staticmethod
    def create_user(
        db: Session,
        firebase_uid: str,
        email: str,
        name: str | None = None
    ):

        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        return user