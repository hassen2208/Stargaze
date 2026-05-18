from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource
)

from app.core.config import settings

deepgram = DeepgramClient(
    settings.DEEPGRAM_API_KEY
)


class STTService:

    @staticmethod
    async def transcribe_audio(
        file_path: str
    ):

        with open(file_path, "rb") as audio:

            buffer_data = audio.read()

        payload: FileSource = {
            "buffer": buffer_data
        }

        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            language="es"
        )

        response = deepgram.listen.prerecorded.v(
            "1"
        ).transcribe_file(
            payload,
            options
        )

        transcript = response.results.channels[
            0
        ].alternatives[
            0
        ].transcript

        return transcript