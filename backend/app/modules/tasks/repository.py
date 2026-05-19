from sqlalchemy.orm import Session

from app.models.task_model import Task


class TaskRepository:

    @staticmethod
    def create_task(
        db: Session,
        task_data: dict
    ):

        task = Task(**task_data)

        db.add(task)

        db.commit()

        db.refresh(task)

        return task

    @staticmethod
    def get_tasks_by_user(
        db: Session,
        user_id: int
    ):

        return db.query(Task).filter(
            Task.user_id == user_id,
            Task.is_deleted == False
        ).all()

    @staticmethod
    def get_task_by_id(
        db: Session,
        task_id: int,
        user_id: int
    ):

        return db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id,
            Task.is_deleted == False
        ).first()

    @staticmethod
    def update_task(
        db: Session,
        task: Task,
        update_data: dict
    ):

        for key, value in update_data.items():
            setattr(task, key, value)

        db.commit()

        db.refresh(task)

        return task

    @staticmethod
    def soft_delete_task(
        db: Session,
        task: Task
    ):

        task.is_deleted = True

        db.commit()

        return task