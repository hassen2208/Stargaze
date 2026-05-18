from datetime import datetime

from sqlalchemy.orm import Session

from app.modules.tasks.service import (
    TaskService
)


class AIOrchestrator:

    @staticmethod
    async def execute_intent(
        db: Session,
        user_id: int,
        llm_response: dict
    ):

        intent = llm_response.get("intent")

        task_data = llm_response.get("task")

        task_id = llm_response.get("task_id")

        if intent == "create_task":

            return await AIOrchestrator.create_task(
                db,
                user_id,
                task_data,
                llm_response
            )

        if intent == "list_tasks":

            return await AIOrchestrator.list_tasks(
                db,
                user_id
            )

        if intent == "complete_task":

            return await AIOrchestrator.complete_task(
                db,
                user_id,
                task_id,
                task_data,
                llm_response
            )
        
        if intent == "update_task":

            return await AIOrchestrator.update_task(
                db,
                user_id,
                task_id,
                task_data,
                llm_response
            )

        if intent == "delete_task":

            return await AIOrchestrator.delete_task(
                db,
                user_id,
                task_id,
                task_data,
                llm_response
            )
        
        if intent == "unknown":

            return {
                "success": True,
                "intent": "unknown",
                "message": llm_response.get(
                    "response",
                    "I couldn't understand your request."
                )
            }

        return {
            "success": False,
            "message": llm_response.get(
                "response",
                "I couldn't process your request."
            )
        }

    @staticmethod
    async def create_task(
        db: Session,
        user_id: int,
        task_data: dict,
        llm_response: dict
    ):

        due_date = None

        if (
            task_data.get("date")
            and task_data.get("time")
        ):

            due_date = datetime.fromisoformat(
                f"{task_data['date']}T{task_data['time']}"
            )

        created_task = TaskService.create_task(
            db=db,
            user_id=user_id,
            task_data={
                "title": task_data.get("title"),
                "description": task_data.get(
                    "description"
                ),
                "priority": task_data.get(
                    "priority",
                    "medium"
                ),
                "due_date": due_date
            }
        )

        return {
            "success": True,
            "intent": "create_task",
            "task_id": created_task.id,
            "message": llm_response.get(
                "response"
            )
        }

    @staticmethod
    async def list_tasks(
        db: Session,
        user_id: int
    ):

        tasks = TaskService.get_tasks(
            db,
            user_id
        )

        formatted_tasks = []

        for task in tasks:

            formatted_tasks.append({
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority
            })

        return {
            "success": True,
            "intent": "list_tasks",
            "tasks": formatted_tasks,
            "message": f"You have {len(tasks)} tasks."
        }

    @staticmethod
    async def complete_task(
        db: Session,
        user_id: int,
        task_id: int,
        task_data: dict,
        llm_response: dict
    ):

        task_id = llm_response.get("task_id")

        if not task_id:

            return {
                "success": False,
                "message": "Task not found."
            }

        updated_task = TaskService.update_task(
            db=db,
            task_id=task_id,
            user_id=user_id,
            update_data={
                "status": "completed"
            }
        )

        if not updated_task:

            return {
                "success": False,
                "message": "Task not found."
            }

        return {
            "success": True,
            "intent": "complete_task",
            "task_id": updated_task.id,
            "message": llm_response.get(
                "response"
            )
        }
    
    @staticmethod
    async def update_task(
        db: Session,
        user_id: int,
        task_id: int,
        task_data: dict,
        llm_response: dict
    ):

        task_id = llm_response.get("task_id")

        if not task_id:

            return {
                "success": False,
                "message": "Task not found."
            }

        due_date = None

        if (
            task_data.get("date")
            and task_data.get("time")
        ):

            due_date = datetime.fromisoformat(
                f"{task_data['date']}T{task_data['time']}"
            )

        update_data = {}

        if task_data.get("title") is not None:
            update_data["title"] = task_data["title"]

        if task_data.get("description") is not None:
            update_data["description"] = task_data["description"]

        if task_data.get("priority") is not None:
            update_data["priority"] = task_data["priority"]

        if task_data.get("status") is not None:
            update_data["status"] = task_data["status"]

        if due_date is not None:
            update_data["due_date"] = due_date

        updated_task = TaskService.update_task(
            db=db,
            task_id=task_id,
            user_id=user_id,
            update_data=update_data
        )

        if not updated_task:

            return {
                "success": False,
                "message": "Task not found."
            }

        return {
            "success": True,
            "intent": "update_task",
            "task_id": updated_task.id,
            "message": llm_response.get(
                "response"
            )
        }
    
    @staticmethod
    async def delete_task(
        db: Session,
        user_id: int,
        task_id: int,
        task_data: dict,
        llm_response: dict
    ):

        task_id = llm_response.get("task_id")

        if not task_id:

            return {
                "success": False,
                "message": "Task not found."
            }

        deleted_task = TaskService.update_task(
            db=db,
            task_id=task_id,
            user_id=user_id,
            update_data={
                "is_deleted": True
            }
        )

        if not deleted_task:

            return {
                "success": False,
                "message": "Task not found."
            }

        return {
            "success": True,
            "intent": "delete_task",
            "task_id": task_id,
            "message": llm_response.get(
                "response"
            )
        }