import os

os.environ["APP_NAME"] = "test"
os.environ["APP_VERSION"] = "1.0"
os.environ["DEBUG"] = "True"
os.environ["API_PREFIX"] = "/api"
os.environ["DATABASE_URL"] = "sqlite:///test.db"
os.environ["GEMINI_API_KEY"] = "test"
os.environ["DEEPGRAM_API_KEY"] = "test"
os.environ["ELEVENLABS_API_KEY"] = "test"
os.environ["FIREBASE_CREDENTIALS_PATH"] = "test"

from unittest.mock import MagicMock, patch

from app.modules.auth.service import AuthService


def test_sync_user_returns_existing_user():

    db = MagicMock()

    firebase_data = {
        "uid": "123",
        "email": "test@test.com",
        "name": "Mor"
    }

    existing_user = {
        "id": 1
    }

    with patch(
        "app.modules.auth.service.AuthRepository.get_user_by_uid",
        return_value=existing_user
    ):

        result = AuthService.sync_user(
            db,
            firebase_data
        )

        assert result == existing_user