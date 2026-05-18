import uuid
import os


TEMP_AUDIO_DIR = "app/temp_audio"


def generate_audio_filename(
    extension: str
):

    filename = f"{uuid.uuid4()}.{extension}"

    return os.path.join(
        TEMP_AUDIO_DIR,
        filename
    )