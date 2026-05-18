from pydantic import BaseModel


class LLMTaskData(BaseModel):

    title: str | None = None

    description: str | None = None

    priority: str | None = None

    date: str | None = None

    time: str | None = None


class LLMResponse(BaseModel):

    intent: str

    task: LLMTaskData | None = None

    response: str