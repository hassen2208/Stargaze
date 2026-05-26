import os
import traceback

from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse, JSONResponse
from fastapi.background import BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.api_core.exceptions import ResourceExhausted

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.modules.voice.controller import VoiceController
from app.utils.audio_utils import generate_audio_filename

router = APIRouter()


def _safe_remove(path: str):
    """Elimina un archivo ignorando errores si ya no existe."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


@router.post("/process")
async def process_voice(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    file_path = None
    generated_audio_path = None
    try:
        print("1. Endpoint iniciado")
        extension = audio.filename.split(".")[-1]
        file_path = generate_audio_filename(extension)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)

        result = await VoiceController.process_voice(db, current_user.id, file_path)
        generated_audio_path = result["audio"]

        # Borrar ambos archivos temporales tras enviar la respuesta
        background_tasks.add_task(_safe_remove, file_path)
        background_tasks.add_task(_safe_remove, generated_audio_path)

        # Extraer intent y texto de respuesta del orquestador
        response = result.get("response", {})
        intent = response.get("intent", "") if isinstance(response, dict) else ""

        if isinstance(response, dict):
            response_text = (
                response.get("message")
                or response.get("text")
                or response.get("response")
                or ""
            )
        elif isinstance(response, str):
            response_text = response
        else:
            response_text = ""

        return FileResponse(
            path=generated_audio_path,
            media_type="audio/mpeg",
            headers={
                "X-Transcript": str(result.get("transcript", "")),
                "X-Intent":     intent,
                "X-Response":   str(response_text),
            },
        )

    except ResourceExhausted as e:
        print("CUOTA GEMINI AGOTADA:", str(e))
        # Limpiar archivos aunque haya error de cuota
        background_tasks.add_task(_safe_remove, file_path)
        background_tasks.add_task(_safe_remove, generated_audio_path)
        return JSONResponse(
            status_code=429,
            content={"detail": "Cuota de IA agotada. Crea una nueva API key en aistudio.google.com"},
        )
    except Exception as e:
        print("ERROR EN /voice/process")
        traceback.print_exc()
        # Limpiar archivos aunque haya cualquier otro error
        background_tasks.add_task(_safe_remove, file_path)
        background_tasks.add_task(_safe_remove, generated_audio_path)
        raise e


class TTSRequest(BaseModel):
    text: str


@router.post("/tts")
async def tts_endpoint(
    background_tasks: BackgroundTasks,
    payload: TTSRequest,
    current_user=Depends(get_current_user),
):
    from app.services.tts_service import text_to_speech
    audio_path = await text_to_speech(payload.text)
    background_tasks.add_task(_safe_remove, audio_path)
    return FileResponse(path=audio_path, media_type="audio/mpeg")


@router.get("/health")
def voice_health():
    return {"module": "voice", "status": "ok"}
