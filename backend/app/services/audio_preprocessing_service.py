import os
import uuid
import librosa
import soundfile as sf
import noisereduce as nr

from app.core.logger import logger


class AudioPreprocessingService:

    @staticmethod
    async def reduce_noise(audio_path: str) -> str:

        logger.info(
            f"Preprocessing audio: {audio_path}"
        )

        try:

            # Cargar audio
            audio_data, sample_rate = librosa.load(
                audio_path,
                sr=None
            )

            # Reducción ruido
            reduced_noise = nr.reduce_noise(
                y=audio_data,
                sr=sample_rate
            )

            # Nuevo archivo temporal
            processed_path = (
                f"temp/processed_{uuid.uuid4()}.wav"
            )

            os.makedirs("temp", exist_ok=True)

            # Guardar audio limpio
            sf.write(
                processed_path,
                reduced_noise,
                sample_rate
            )

            logger.success(
                "Noise reduction completed"
            )

            return processed_path

        except Exception:

            logger.exception(
                "Audio preprocessing failed"
            )

            # fallback:
            # retornar audio original
            return audio_path