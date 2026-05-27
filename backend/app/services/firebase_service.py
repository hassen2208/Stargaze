import firebase_admin

from firebase_admin import credentials, auth

from app.core.config import settings


if not firebase_admin._apps:
    cred = credentials.Certificate(
        settings.FIREBASE_CREDENTIALS_PATH
    )

    firebase_admin.initialize_app(cred)


class FirebaseService:

    @staticmethod
    def verify_token(token: str):
        decoded_token = auth.verify_id_token(token)

        return decoded_token