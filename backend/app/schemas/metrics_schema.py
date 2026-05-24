from typing import Optional
from pydantic import BaseModel


class MetricCreate(BaseModel):
    endpoint: str
    operation: str

    transcription_time_ms: Optional[float] = None
    total_latency_ms: Optional[float] = None
    voice_generation_time_ms: Optional[float] = None

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    transcription_cost_usd: float = 0
    llm_cost_usd: float = 0
    voice_generation_cost_usd: float = 0
    total_cost_usd: float = 0

    recognition_success: Optional[bool] = None
    perceived_recognition_accuracy: Optional[float] = None

    error_type: Optional[str] = None
    error_message: Optional[str] = None


class MetricResponse(MetricCreate):
    id: str
    created_at: str


class MetricsSummaryResponse(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int

    average_transcription_time_ms: Optional[float]
    average_total_latency_ms: Optional[float]
    average_voice_generation_time_ms: Optional[float]

    average_perceived_recognition_accuracy: Optional[float]

    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int

    total_cost_usd: float
    average_cost_per_request_usd: float
    projected_daily_cost_usd: float
    projected_monthly_cost_usd: float