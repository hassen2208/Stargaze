from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.api.dependencies import get_current_user

from app.schemas.voice_schema import (
    VoiceMessage
)

from app.modules.conversation.controller import (
    ConversationController
)

router = APIRouter()


@router.post("/process")
async def process_message(
    payload: VoiceMessage,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return await ConversationController.process_message(
        db,
        current_user.id,
        payload.message
    )