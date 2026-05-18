from sqlalchemy.orm import Session

from app.modules.conversation.service import (
    ConversationService
)


class ConversationController:

    @staticmethod
    async def process_message(
        db: Session,
        user_id: int,
        message: str
    ):

        return await ConversationService.process_message(
            db,
            user_id,
            message
        )