from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_auth_health():

    response = client.get(
        "/api/v1/auth/health"
    )

    assert response.status_code == 200