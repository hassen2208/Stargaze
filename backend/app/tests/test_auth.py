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
        "id": 1,
        "firebase_uid": "123"
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