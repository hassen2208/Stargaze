import pytest

from unittest.mock import (
    AsyncMock,
    MagicMock,
    patch
)

from app.modules.conversation.service import (
    ConversationService
)

@pytest.mark.asyncio
async def test_process_message():

    db = MagicMock()

    user_id = 1

    message = "Create a task"

    fake_task = MagicMock()

    fake_task.id = 1
    fake_task.title = "Task"
    fake_task.description = "Desc"
    fake_task.status = "pending"
    fake_task.priority = "high"
    fake_task.due_date = "2026-01-01"

    with patch(
        "app.modules.conversation.service.TaskService.get_tasks",
        return_value=[fake_task]
    ):

        with patch(
            "app.modules.conversation.service.GeminiService.generate_response",
            new_callable=AsyncMock,
            return_value='{"intent":"create_task"}'
        ):

            with patch(
                "app.modules.conversation.service.parse_llm_json",
                return_value={
                    "intent": "create_task"
                }
            ):

                with patch(
                    "app.modules.conversation.service.AIOrchestrator.execute_intent",
                    new_callable=AsyncMock,
                    return_value={
                        "message": "Task created"
                    }
                ):

                    result = await ConversationService.process_message(
                        db,
                        user_id,
                        message
                    )

                    db.add.assert_called_once()

                    db.commit.assert_called_once()

                    assert result == {
                        "message": "Task created"
                    }