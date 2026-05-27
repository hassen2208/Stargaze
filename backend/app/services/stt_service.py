import asyncio

from typing import Any, cast

from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
)

from loguru import logger

from app.core.config import settings


deepgram = DeepgramClient(
    settings.DEEPGRAM_API_KEY
)


class STTService:

    @staticmethod
    async def transcribe_audio(
        file_path: str
    ) -> str:
        max_retries = settings.DEEPGRAM_MAX_RETRIES
        fallback_enabled = settings.STT_FALLBACK_ENABLED
        fallback_text = settings.STT_FALLBACK_TEXT

        last_error: Exception | None = None

        for attempt in range(max_retries + 1):
            try:
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

                prerecorded_client = cast(
                    Any,
                    deepgram.listen.prerecorded.v("1")
                )

                response = prerecorded_client.transcribe_file(
                    payload,
                    options
                )

                response_data = (
                    response.to_dict()
                    if hasattr(response, "to_dict")
                    else response
                )

                channels = (
                    response_data
                    .get("results", {})
                    .get("channels", [])
                )

                if not channels:
                    raise ValueError(
                        "Deepgram response does not contain channels."
                    )

                alternatives = channels[0].get(
                    "alternatives",
                    []
                )

                if not alternatives:
                    raise ValueError(
                        "Deepgram response does not contain alternatives."
                    )

                transcript = alternatives[0].get(
                    "transcript",
                    ""
                ).strip()

                if not transcript:
                    raise ValueError(
                        "Deepgram returned an empty transcript."
                    )

                return transcript

            except Exception as error:
                last_error = error

                logger.error(
                    f"Deepgram transcription failed. "
                    f"Attempt {attempt + 1}/{max_retries + 1}. "
                    f"Error: {error}"
                )

                if attempt < max_retries:
                    await asyncio.sleep(1)

        if fallback_enabled:
            logger.warning(
                "Using STT fallback text because Deepgram failed."
            )

            return fallback_text

        if last_error:
            raise last_error

        raise RuntimeError(
            "Unknown Deepgram transcription error."
        )