from fastapi import HTTPException


class LLMException(HTTPException):

    def __init__(
        self,
        detail="LLM processing error"
    ):

        super().__init__(
            status_code=500,
            detail=detail
        )