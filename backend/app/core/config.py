from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Stargaze API"
    APP_VERSION: str = "1.0.0"

    API_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"

    DEEPGRAM_API_KEY: str
    ELEVENLABS_API_KEY: str | None = None

    FIREBASE_CREDENTIALS_PATH: str

    DEBUG: bool = False

    DEEPGRAM_MAX_RETRIES: int = 2
    STT_FALLBACK_ENABLED: bool = False
    STT_FALLBACK_TEXT: str = "Crear tarea validar métricas del sistema mañana urgente"

    GEMINI_INPUT_COST_PER_1M_TOKENS_USD: float = 0.075
    GEMINI_OUTPUT_COST_PER_1M_TOKENS_USD: float = 0.30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid"
    )


settings = Settings()