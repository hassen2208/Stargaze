from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool

    API_PREFIX: str

    DATABASE_URL: str

    GEMINI_API_KEY: str
    DEEPGRAM_API_KEY: str
    ELEVENLABS_API_KEY: str

    FIREBASE_CREDENTIALS_PATH: str

    class Config:
        env_file = ".env"


settings = Settings()