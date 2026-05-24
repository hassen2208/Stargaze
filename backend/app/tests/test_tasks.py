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

from unittest.mock import (
    MagicMock,
    patch
)

import pytest

from fastapi import HTTPException

from app.modules.tasks.service import (
    TaskService
)


def test_create_task_success():

    db = MagicMock()

    task_data = {
        "title": "Test task",
        "priority": "high"
    }

    created_task = {
        "id": 1,
        "title": "Test task"
    }

    with patch(
        "app.modules.tasks.service.TaskRepository.create_task",
        return_value=created_task
    ):

        result = TaskService.create_task(
            db,
            1,
            task_data
        )

        assert result == created_task


def test_create_task_invalid_priority():

    db = MagicMock()

    task_data = {
        "title": "Test task",
        "priority": "super-high"
    }

    with pytest.raises(HTTPException) as exc:

        TaskService.create_task(
            db,
            1,
            task_data
        )

    assert exc.value.status_code == 400

    assert exc.value.detail == "Invalid priority"


def test_get_task_not_found():

    db = MagicMock()

    with patch(
        "app.modules.tasks.service.TaskRepository.get_task_by_id",
        return_value=None
    ):

        with pytest.raises(HTTPException) as exc:

            TaskService.get_task(
                db,
                1,
                1
            )

        assert exc.value.status_code == 404

        assert exc.value.detail == "Task not found"


def test_update_task_invalid_status():

    db = MagicMock()

    fake_task = {
        "id": 1
    }

    update_data = {
        "status": "unknown-status"
    }

    with patch(
        "app.modules.tasks.service.TaskService.get_task",
        return_value=fake_task
    ):

        with pytest.raises(HTTPException) as exc:

            TaskService.update_task(
                db,
                1,
                1,
                update_data
            )

        assert exc.value.status_code == 400

        assert exc.value.detail == "Invalid status"


def test_delete_task_success():

    db = MagicMock()

    fake_task = {
        "id": 1
    }

    deleted_task = {
        "message": "Task deleted"
    }

    with patch(
        "app.modules.tasks.service.TaskService.get_task",
        return_value=fake_task
    ):

        with patch(
            "app.modules.tasks.service.TaskRepository.soft_delete_task",
            return_value=deleted_task
        ):

            result = TaskService.delete_task(
                db,
                1,
                1
            )

            assert result == deleted_task