

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

import os
import time

from app.core.evaluation_metrics import (
    api_cost_usd_total,
    conversation_errors_total,
    llm_tokens_total,
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
            print("1. Iniciando transcripción")

            stage = "transcription"
            transcription_start = time.perf_counter()

            try:
                transcript = await STTService.transcribe_audio(audio_path)
            finally:
                transcription_time = time.perf_counter() - transcription_start
                voice_transcription_duration_seconds.observe(transcription_time)


            print("2. Transcripción completada")
            print("========== TRANSCRIPT ==========")
            print(transcript)
            print("================================")

            print("3. Enviando texto a Gemini")

            stage = "conversation"

            ai_response = await ConversationService.process_message(
                db,
                user_id,
                transcript
            )

            print("4. Gemini respondió")
            print(ai_response)

          
            usage = ai_response.get("usage") or ai_response.get("usage_metadata") or {}

            prompt_tokens = (
                usage.get("prompt_tokens")
                or usage.get("prompt_token_count")
                or 0
            )

            completion_tokens = (
                usage.get("completion_tokens")
                or usage.get("candidates_token_count")
                or usage.get("output_tokens")
                or 0
            )

            total_tokens = (
                usage.get("total_tokens")
                or usage.get("total_token_count")
                or prompt_tokens + completion_tokens
            )

            if prompt_tokens:
                llm_tokens_total.labels(type="prompt").inc(prompt_tokens)

            if completion_tokens:
                llm_tokens_total.labels(type="completion").inc(completion_tokens)

            if total_tokens:
                llm_tokens_total.labels(type="total").inc(total_tokens)

            
            gemini_input_cost_per_1m = 0.075
            gemini_output_cost_per_1m = 0.30

            estimated_gemini_cost = (
                (prompt_tokens / 1_000_000) * gemini_input_cost_per_1m
                + (completion_tokens / 1_000_000) * gemini_output_cost_per_1m
            )

            if estimated_gemini_cost:
                api_cost_usd_total.labels(provider="gemini").inc(
                    estimated_gemini_cost
                )

            response_text = ai_response.get(
                "message",
                "Done."
            )

            print("5. Generando audio TTS")

            stage = "tts"
            tts_start = time.perf_counter()

            generated_audio = await text_to_speech(
                response_text
            )

            tts_time = time.perf_counter() - tts_start
            voice_tts_duration_seconds.observe(tts_time)

            print("6. Audio generado")

            total_time = time.perf_counter() - total_start
            voice_pipeline_duration_seconds.observe(total_time)
            voice_pipeline_requests_total.labels(status="success").inc()

            return {
                "transcript": transcript,
                "response": ai_response,
                "audio": generated_audio
            }

        except Exception:
            total_time = time.perf_counter() - total_start
            voice_pipeline_duration_seconds.observe(total_time)

            voice_pipeline_requests_total.labels(status="error").inc()
            conversation_errors_total.labels(stage=stage).inc()

            raise

        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)