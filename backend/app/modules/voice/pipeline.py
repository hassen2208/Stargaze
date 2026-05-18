import os

from sqlalchemy.orm import Session

from app.services.stt_service import (
    STTService
)

from app.services.tts_service import (
    text_to_speech
)

from app.modules.conversation.service import (
    ConversationService
)


class VoicePipeline:

    @staticmethod
    async def process_voice(
        db: Session,
        user_id: int,
        audio_path: str
    ):

        print("1. Iniciando transcripción")

        transcript = await STTService.transcribe_audio(
            audio_path
        )

        print("2. Transcripción completada")
        print("========== TRANSCRIPT ==========")
        print(transcript)
        print("================================")

        print("3. Enviando texto a Gemini")

        ai_response = await ConversationService.process_message(
            db,
            user_id,
            transcript
        )

        print("4. Gemini respondió")
        print(ai_response)

        response_text = ai_response.get(
            "message",
            "Done."
        )

        print("5. Generando audio TTS")

        generated_audio = await text_to_speech(
            response_text
        )

        print("6. Audio generado")

        if os.path.exists(audio_path):
            os.remove(audio_path)

        return {
            "transcript": transcript,
            "response": ai_response,
            "audio": generated_audio
        }