import time

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

from app.core.metrics import (
    LLM_REQUEST_COUNT
)

class ConversationService:

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

        # 1. ¿Qué tipo de objeto es? (Te dirá la clase exacta)
        print("TIPO DE OBJETO:", type(raw_response))

        # 2. ¿Qué herramientas/atributos tiene dentro?
        print("ATRIBUTOS DISPONIBLES:", dir(raw_response))

        print("RESPUESTA DEL LLM:")
        print(raw_response)

        latency = time.time() - start_time

        parsed_response = parse_llm_json(
            raw_response
        )

        execution_result = await AIOrchestrator.execute_intent(
            db,
            user_id,
            parsed_response
        )

        conversation = Conversation(
            user_id=user_id,
            prompt=message,
            response=str(execution_result),
            latency=latency,
            tokens_used=0
        )

        db.add(conversation)

        db.commit()

        return execution_result