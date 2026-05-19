from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.modules.tasks.repository import TaskRepository

from app.utils.validators import (
    VALID_PRIORITIES,
    VALID_STATUS
)


class TaskService:

    @staticmethod
    def create_task(
        db: Session,
        user_id: int,
        task_data: dict
    ):

        task_data["user_id"] = user_id

        if task_data["priority"] not in VALID_PRIORITIES:

            raise HTTPException(
                status_code=400,
                detail="Invalid priority"
            )

        return TaskRepository.create_task(
            db,
            task_data
        )

    @staticmethod
    def get_tasks(
        db: Session,
        user_id: int
    ):

        return TaskRepository.get_tasks_by_user(
            db,
            user_id
        )

    @staticmethod
    def get_task(
        db: Session,
        task_id: int,
        user_id: int
    ):

        task = TaskRepository.get_task_by_id(
            db,
            task_id,
            user_id
        )

        if not task:

            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        return task

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        user_id: int,
        update_data: dict
    ):

        task = TaskService.get_task(
            db,
            task_id,
            user_id
        )

        if (
            "priority" in update_data
            and update_data["priority"] not in VALID_PRIORITIES
        ):

            raise HTTPException(
                status_code=400,
                detail="Invalid priority"
            )

        if (
            "status" in update_data
            and update_data["status"] not in VALID_STATUS
        ):

            raise HTTPException(
                status_code=400,
                detail="Invalid status"
            )

        return TaskRepository.update_task(
            db,
            task,
            update_data
        )

    @staticmethod
    def delete_task(
        db: Session,
        task_id: int,
        user_id: int
    ):

        task = TaskService.get_task(
            db,
            task_id,
            user_id
        )

        return TaskRepository.soft_delete_task(
            db,
            task
        )