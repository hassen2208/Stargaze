import os
import traceback

from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse
from fastapi.background import BackgroundTasks
from sqlalchemy.orm import Session

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
        print(f"2. Extension detectada: {extension}")

        file_path = generate_audio_filename(extension)
        print(f"3. Ruta generada: {file_path}")

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "wb") as buffer:
            content = await audio.read()
            print(f"4. Audio leído: {len(content)} bytes")
            buffer.write(content)

        print("5. Audio guardado")

        result = await VoiceController.process_voice(db, current_user.id, file_path)
        print("6. VoiceController terminó")

        generated_audio_path = result["audio"]
        background_tasks.add_task(os.remove, generated_audio_path)

        # Extract intent from the orchestrator response
        response = result.get("response", {})
        intent = response.get("intent", "") if isinstance(response, dict) else ""

        return FileResponse(
            path=generated_audio_path,
            media_type="audio/mpeg",
            headers={
                "X-Transcript": str(result.get("transcript", "")),
                "X-Intent":     intent,
            },
        )

    except Exception as e:
        print("ERROR EN /voice/process")
        print(str(e))
        traceback.print_exc()
        raise e


@router.get("/health")
def voice_health():
    return {"module": "voice", "status": "ok"}