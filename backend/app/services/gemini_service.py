import google.generativeai as genai

from app.core.config import settings

genai.configure(
    api_key=settings.GEMINI_API_KEY
)

model = genai.GenerativeModel(
    "gemini-2.5-flash-lite"
)


class GeminiService:

    @staticmethod
    async def generate_response(
        prompt: str
    ):

        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "top_p": 0.8,
                "top_k": 20,
                "max_output_tokens": 300
            }
        )

        return response.text