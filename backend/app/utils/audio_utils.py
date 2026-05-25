import os
from uuid import uuid4


TEMP_AUDIO_DIR = "app/temp_audio"


def generate_audio_filename(extension: str) -> str:
    os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

    clean_extension = extension.replace(".", "").lower()

    return os.path.join(
        TEMP_AUDIO_DIR,
        f"{uuid4()}.{clean_extension}"
    )