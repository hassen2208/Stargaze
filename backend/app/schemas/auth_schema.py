from pydantic import BaseModel


class UserResponse(BaseModel):
    uid: str
    email: str | None = None
    name: str | None = None