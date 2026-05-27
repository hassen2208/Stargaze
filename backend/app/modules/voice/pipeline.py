import os
import time

from sqlalchemy.orm import Session

from app.services.stt_service import STTService
from app.services.tts_service import text_to_speech
from app.modules.conversation.service import ConversationService

from app.core.evaluation_metrics import (
    conversation_errors_total,
    voice_pipeline_duration_seconds,
    voice_pipeline_requests_total,
    voice_transcription_duration_seconds,
    voice_tts_duration_seconds,
)


class VoicePipeline:

    @staticmethod
    async def process_voice(
        db: Session,
        user_id: int,
        audio_path: str
    ):
        total_start = time.perf_counter()
        stage = "initialization"

        try:
            logger.info("VOICE MODULE: 1. Iniciando transcripción:")
            #print("1. Iniciando transcripción")

            stage = "transcription"
            transcription_start = time.perf_counter()

            transcript = await STTService.transcribe_audio(
                audio_path
            )

            transcription_time = time.perf_counter() - transcription_start
            voice_transcription_duration_seconds.observe(
                transcription_time
            )

            logger.info("VOICE MODULE: 3. Enviando texto a Gemini:")
            #print("3. Enviando texto a Gemini")

            stage = "conversation"

            ai_response = await ConversationService.process_message(
                db,
                user_id,
                transcript
            )

            logger.info("VOICE MODULE: 4. Gemini respondió:")
            #print("4. Gemini respondió")
            #print(ai_response)

            response_text = ai_response.get(
                "message",
                ai_response.get("response", "Done.")
            )

            logger.info("VOICE MODULE: 5. Generando audio TTS:")
            #print("5. Generando audio TTS")

            stage = "tts"
            tts_start = time.perf_counter()

            generated_audio = await text_to_speech(
                response_text
            )

            tts_time = time.perf_counter() - tts_start
            voice_tts_duration_seconds.observe(
                tts_time
            )

            logger.info("VOICE MODULE: 6. Audio generado:")
            #print("6. Audio generado")

            total_time = time.perf_counter() - total_start
            voice_pipeline_duration_seconds.observe(
                total_time
            )

            voice_pipeline_requests_total.labels(
                status="success"
            ).inc()

            return {
                "transcript": transcript,
                "response": ai_response,
                "audio": generated_audio
            }

        except Exception:
            total_time = time.perf_counter() - total_start

            voice_pipeline_duration_seconds.observe(
                total_time
            )

            voice_pipeline_requests_total.labels(
                status="error"
            ).inc()

            conversation_errors_total.labels(
                stage=stage
            ).inc()

            raise

        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)