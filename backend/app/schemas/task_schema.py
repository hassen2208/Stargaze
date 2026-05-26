from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):

    title: str = Field(
        min_length=3,
        max_length=100
    )

    description: str | None = None

    priority: str = "medium"

    due_date: datetime | None = None


class TaskUpdate(BaseModel):

    title: str | None = None

    description: str | None = None

    priority: str | None = None

    status: str | None = None

    due_date: datetime | None = None


class TaskResponse(BaseModel):

    id: int

    title: str

    description: str | None

    priority: str

    status: str

    due_date: datetime | None

    class Config:
        from_attributes = True