from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.api.dependencies import get_current_user

from app.schemas.task_schema import (
    TaskCreate,
    TaskUpdate,
    TaskResponse
)

from app.modules.tasks.controller import TaskController

router = APIRouter()


@router.post(
    "/",
    response_model=TaskResponse
)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return TaskController.create_task(
        db,
        current_user.id,
        task.model_dump()
    )


@router.get(
    "/",
    response_model=list[TaskResponse]
)
def get_tasks(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return TaskController.get_tasks(
        db,
        current_user.id
    )


@router.put(
    "/{task_id}",
    response_model=TaskResponse
)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return TaskController.update_task(
        db,
        task_id,
        current_user.id,
        task.model_dump(exclude_unset=True)
    )


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    TaskController.delete_task(
        db,
        task_id,
        current_user.id
    )

    return {
        "message": "Task deleted successfully"
    }