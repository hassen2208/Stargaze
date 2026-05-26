from pydantic import BaseModel


class VoiceMessage(BaseModel):

    message: str