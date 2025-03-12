from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
import sys
import os
from security.jwt_auth import validate_token

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TaskSchema(BaseModel):
    description: str
    due_date: Optional[datetime] = None
    priority: int = 1


class TaskManager:
    @staticmethod
    async def create(task_data: TaskSchema) -> Dict[str, Any]:
        task_id = "task_" + datetime.now().strftime("%Y%m%d%H%M%S%f")
        return {"id": task_id, **task_data.dict()}


class WebSocketBroker:
    @classmethod
    async def broadcast(cls, event_type: str, payload: dict):
        # Implementation placeholder
        pass


router = APIRouter()


@router.post("/tasks")
async def create_task(
    task_data: TaskSchema,
    token_data=Depends(validate_token)
):
    try:
        task = await TaskManager.create(task_data)
        await WebSocketBroker.broadcast("TASK_CREATED", task)
        return {"id": task["id"], "status": "queued"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
