from fileinput import filename
import os
import traceback

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.api_core.exceptions import ResourceExhausted

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.modules.voice.controller import VoiceController
from app.utils.audio_utils import generate_audio_filename

router = APIRouter()


@router.get("/health")
def voice_health():
    return {
        "module": "voice",
        "status": "ok"
    }


@router.post("/process")
async def process_voice(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    file_path = None
    generated_audio_path = None
    try:
        print("1. Endpoint iniciado")

        filename = audio.filename or "recording.webm"

        extension = (
        filename.rsplit(".", 1)[-1]
        if "." in filename
        else "webm"
)

        print(f"2. Extension detectada: {extension}")

        file_path = generate_audio_filename(
            extension
        )

        print(f"3. Ruta generada: {file_path}")

        content = await audio.read()

        print(f"4. Audio leído: {len(content)} bytes")

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        print("5. Audio guardado")

        result = await VoiceController.process_voice(
            db,
            current_user.id,
            file_path
        )

        print("VoiceController terminó")

        generated_audio_path = result["audio"]

        if not os.path.exists(generated_audio_path):
            raise FileNotFoundError(
                f"Generated audio not found: {generated_audio_path}"
            )

        background_tasks.add_task(
            os.remove,
            generated_audio_path
        )

        return FileResponse(
            path=generated_audio_path,
            media_type="audio/mpeg",
            filename="response.mp3",
            headers={
                "X-Transcript": result.get("transcript", "")
            }
        )

    except Exception as error:
        print("ERROR EN /voice/process")
        print("ERROR TYPE:", type(error).__name__)
        print("ERROR MESSAGE:", str(error))
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
