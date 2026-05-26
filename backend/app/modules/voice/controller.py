from sqlalchemy.orm import Session

from app.modules.voice.pipeline import (
    VoicePipeline
)


class VoiceController:

    @staticmethod
    async def process_voice(
        db: Session,
        user_id: int,
        audio_path: str
    ):

        return await VoicePipeline.process_voice(
            db,
            user_id,
            audio_path
        )