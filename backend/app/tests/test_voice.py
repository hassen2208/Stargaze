import os
import pytest

from unittest.mock import (
    AsyncMock,
    MagicMock,
    patch
)

from app.modules.voice.pipeline import VoicePipeline

@pytest.mark.asyncio
async def test_process_voice():

    db = MagicMock()

    user_id = 1

    audio_path = "audio.wav"

    with patch(
        "app.modules.voice.pipeline.STTService.transcribe_audio",
        new_callable=AsyncMock,
        return_value="Hola"
    ):

        with patch(
            "app.modules.voice.pipeline.ConversationService.process_message",
            new_callable=AsyncMock,
            return_value={
                "message": "Hola usuario"
            }
        ):

            with patch(
                "app.modules.voice.pipeline.text_to_speech",
                new_callable=AsyncMock,
                return_value="response.mp3"
            ):

                with patch(
                    "app.modules.voice.pipeline.os.path.exists",
                    return_value=True
                ):

                    with patch(
                        "app.modules.voice.pipeline.os.remove"
                    ) as mock_remove:

                        result = await VoicePipeline.process_voice(
                            db,
                            user_id,
                            audio_path
                        )

                        mock_remove.assert_called_once_with(
                            audio_path
                        )

                        assert result["transcript"] == "Hola"

                        assert result["response"] == {
                            "message": "Hola usuario"
                        }

                        assert result["audio"] == "response.mp3"