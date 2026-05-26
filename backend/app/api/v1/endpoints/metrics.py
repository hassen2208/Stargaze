from fastapi import APIRouter

from app.core.metrics import (
    REQUEST_COUNT,
    LLM_REQUEST_COUNT,
)

from app.core.evaluation_metrics import (
    voice_pipeline_duration_seconds,
    voice_transcription_duration_seconds,
    voice_tts_duration_seconds,
    conversation_errors_total,
    llm_tokens_total,
    api_cost_usd_total,
    perceived_recognition_accuracy,
)

router = APIRouter(
    prefix="/metrics",
    tags=["Metrics"]
)


@router.get("/dashboard")
def dashboard_metrics():

    return {

        # Requests
        "total_requests":
            REQUEST_COUNT._value.get(),

        "llm_requests":
            LLM_REQUEST_COUNT._value.get(),

        # Tokens
        "total_tokens":
            llm_tokens_total.labels(
                type="total"
            )._value.get(),

        # Costos
        "total_cost_usd":
            api_cost_usd_total.labels(
                provider="gemini"
            )._value.get(),

        # Errores
        "conversation_errors":
            conversation_errors_total.labels(
                stage="conversation"
            )._value.get(),

        # Accuracy
        "recognition_accuracy":
            perceived_recognition_accuracy._value.get(),

        # Voice metrics
        "voice_pipeline_seconds":
            voice_pipeline_duration_seconds._sum.get(),

        "voice_transcription_seconds":
            voice_transcription_duration_seconds._sum.get(),

        "voice_tts_seconds":
            voice_tts_duration_seconds._sum.get(),
    }