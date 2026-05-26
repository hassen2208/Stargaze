import time
import os
import json

from datetime import datetime

from sqlalchemy.orm import Session

from app.services.gemini_service import GeminiService

from app.modules.conversation.prompts import (
    load_task_prompt
)

from app.utils.json_parser import parse_llm_json

from app.models.conversation_model import (
    Conversation
)

from app.modules.conversation.orchestrator import (
    AIOrchestrator
)

from app.modules.tasks.service import (
    TaskService
)
from app.core.evaluation_metrics import (
    api_cost_usd_total,
    llm_tokens_total,
)

from app.core.metrics import (
    LLM_REQUEST_COUNT
)

class ConversationService:
    @staticmethod
    def _get_response_text(raw_response):
        if hasattr(raw_response, "text"):
            return raw_response.text

        if isinstance(raw_response, dict):
            return (
                raw_response.get("text")
                or raw_response.get("message")
                or str(raw_response)
            )

        return str(raw_response)

    @staticmethod
    def _extract_usage(raw_response):
        usage_metadata = getattr(raw_response, "usage_metadata", None)

        if usage_metadata is None and isinstance(raw_response, dict):
            usage_metadata = (
                raw_response.get("usage_metadata")
                or raw_response.get("usage")
                or {}
            )

        if usage_metadata is None:
            usage_metadata = {}

        def get_usage_value(*names):
            for name in names:
                if isinstance(usage_metadata, dict):
                    value = usage_metadata.get(name)
                else:
                    value = getattr(usage_metadata, name, None)

                if value is not None:
                    return int(value)

            return 0

        prompt_tokens = get_usage_value(
            "prompt_token_count",
            "prompt_tokens",
            "input_tokens"
        )

        completion_tokens = get_usage_value(
            "candidates_token_count",
            "completion_tokens",
            "output_tokens"
        )

        total_tokens = get_usage_value(
            "total_token_count",
            "total_tokens"
        )

        if total_tokens == 0:
            total_tokens = prompt_tokens + completion_tokens

        return {
            "prompt_token_count": prompt_tokens,
            "candidates_token_count": completion_tokens,
            "total_token_count": total_tokens,
        }

    @staticmethod
    def _estimate_gemini_cost(usage):
        input_price_per_1m = float(
            os.getenv("GEMINI_INPUT_COST_PER_1M_TOKENS_USD", "0.075")
        )

        output_price_per_1m = float(
            os.getenv("GEMINI_OUTPUT_COST_PER_1M_TOKENS_USD", "0.30")
        )

        prompt_tokens = usage.get("prompt_token_count", 0)
        completion_tokens = usage.get("candidates_token_count", 0)

        input_cost = (prompt_tokens / 1_000_000) * input_price_per_1m
        output_cost = (completion_tokens / 1_000_000) * output_price_per_1m

        return input_cost + output_cost

    @staticmethod
    async def process_message(
        db: Session,
        user_id: int,
        message: str
    ):
        
        today = datetime.now().strftime("%Y-%m-%d")

        system_prompt = load_task_prompt()

        tasks = TaskService.get_tasks(
            db,
            user_id
        )

        formatted_tasks = []

        for task in tasks:

            formatted_tasks.append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": str(task.due_date)
            })
        
        tasks_json = json.dumps(
        formatted_tasks,
        ensure_ascii=False,
        indent=2
        )

        full_prompt = f"""
        {system_prompt}

        User message:
        {message}

        Today date is: 
        {today}

        Current user tasks:
        {tasks_json}
        """

        LLM_REQUEST_COUNT.inc()

        start_time = time.time()

        print("ESTE ES EL PROMPT:")
        print(full_prompt)

        raw_response = await GeminiService.generate_response(
            full_prompt
        )
        llm_text = ConversationService._get_response_text(raw_response)

        usage = ConversationService._extract_usage(raw_response)

        print("========== DEBUG USAGE ==========")
        print(usage)
        print("=================================")

        prompt_tokens = usage.get("prompt_token_count", 0)
        completion_tokens = usage.get("candidates_token_count", 0)
        total_tokens = usage.get("total_token_count", 0)

        if prompt_tokens:
            llm_tokens_total.labels(type="prompt").inc(prompt_tokens)

        if completion_tokens:
            llm_tokens_total.labels(type="completion").inc(completion_tokens)

        if total_tokens:
            llm_tokens_total.labels(type="total").inc(total_tokens)

        estimated_cost = ConversationService._estimate_gemini_cost(usage)

        if estimated_cost:
            api_cost_usd_total.labels(provider="gemini").inc(estimated_cost)

        print("PROMPT TOKENS:", prompt_tokens)
        print("COMPLETION TOKENS:", completion_tokens)
        print("TOTAL TOKENS:", total_tokens)
        print("ESTIMATED COST:", estimated_cost)
        print("MÉTRICAS LLM INCREMENTADAS")
            

        # 1. ¿Qué tipo de objeto es? (Te dirá la clase exacta)
        print("TIPO DE OBJETO:", type(raw_response))

        # 2. ¿Qué herramientas/atributos tiene dentro?
        print("ATRIBUTOS DISPONIBLES:", dir(raw_response))

        print("RESPUESTA DEL LLM:")
        print(llm_text)

        latency = time.time() - start_time

        parsed_response = parse_llm_json(
            llm_text
        )

        execution_result = await AIOrchestrator.execute_intent(
            db,
            user_id,
            parsed_response
        )
        if isinstance(execution_result, dict):
            execution_result["usage"] = usage
            execution_result["estimated_cost_usd"] = estimated_cost

        conversation = Conversation(
            user_id=user_id,
            prompt=message,
            response=str(execution_result),
            latency=latency,
            tokens_used=total_tokens
        )

        db.add(conversation)

        db.commit()

        return execution_result