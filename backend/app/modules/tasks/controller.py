from sqlalchemy.orm import Session

from app.modules.tasks.service import TaskService


class TaskController:

    @staticmethod
    def create_task(
        db: Session,
        user_id: int,
        task_data: dict
    ):

        return TaskService.create_task(
            db,
            user_id,
            task_data
        )

    @staticmethod
    def get_tasks(
        db: Session,
        user_id: int
    ):

        return TaskService.get_tasks(
            db,
            user_id
        )

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        user_id: int,
        update_data: dict
    ):

        return TaskService.update_task(
            db,
            task_id,
            user_id,
            update_data
        )

    @staticmethod
    def delete_task(
        db: Session,
        task_id: int,
        user_id: int
    ):

        return TaskService.delete_task(
            db,
            task_id,
            user_id
        )