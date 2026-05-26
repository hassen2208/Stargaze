import os
import traceback

from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from fastapi.background import BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.modules.voice.controller import VoiceController
from app.utils.audio_utils import generate_audio_filename

router = APIRouter()


@router.post("/process")
async def process_voice(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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
        background_tasks.add_task(os.remove, generated_audio_path)

        response = result.get("response", {})
        intent = response.get("intent", "") if isinstance(response, dict) else ""

        return FileResponse(
            path=generated_audio_path,
            media_type="audio/mpeg",
            headers={
                "X-Transcript": str(result.get("transcript", "")),
                "X-Intent": intent,
            },
        )
    except Exception as e:
        print("ERROR EN /voice/process")
        traceback.print_exc()
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
    background_tasks.add_task(os.remove, audio_path)
    return FileResponse(path=audio_path, media_type="audio/mpeg")


@router.get("/health")
def voice_health():
    return {"module": "voice", "status": "ok"}