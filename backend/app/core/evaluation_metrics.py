from prometheus_client import Counter, Gauge, Histogram


voice_pipeline_duration_seconds = Histogram(
    "voice_pipeline_duration_seconds",
    "Tiempo total del pipeline de voz en segundos",
)

voice_transcription_duration_seconds = Histogram(
    "voice_transcription_duration_seconds",
    "Tiempo de transcripción de audio a texto en segundos",
)

voice_tts_duration_seconds = Histogram(
    "voice_tts_duration_seconds",
    "Tiempo de generación de voz TTS en segundos",
)

voice_pipeline_requests_total = Counter(
    "voice_pipeline_requests_total",
    "Cantidad de ejecuciones del pipeline de voz",
    ["status"],
)

conversation_errors_total = Counter(
    "conversation_errors_total",
    "Cantidad de errores del sistema conversacional",
    ["stage"],
)

llm_tokens_total = Counter(
    "llm_tokens_total",
    "Consumo total de tokens del modelo LLM",
    ["type"],
)

api_cost_usd_total = Counter(
    "api_cost_usd_total",
    "Costo estimado acumulado de APIs externas en USD",
    ["provider"],
)

perceived_recognition_accuracy = Gauge(
    "perceived_recognition_accuracy",
    "Precisión percibida del reconocimiento de voz, valor entre 0 y 1",
)