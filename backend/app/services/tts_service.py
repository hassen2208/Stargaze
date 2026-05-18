import tempfile
import edge_tts


VOICE = "es-CO-SalomeNeural"


async def text_to_speech(
    text: str
) -> str:

    """
    Convierte texto a audio usando Edge-TTS.
    Retorna la ruta temporal del MP3 generado.
    """

    temp_audio = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".mp3"
    )

    communicate = edge_tts.Communicate(
        text=text,
        voice=VOICE
    )

    await communicate.save(
        temp_audio.name
    )

    return temp_audio.name