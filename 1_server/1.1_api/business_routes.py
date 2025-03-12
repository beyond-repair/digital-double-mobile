from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import sys
import os
from security.jwt_auth import validate_token
import uuid  # New import for UUID generation


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TaskSchema(BaseModel):
    description: str
    due_date: Optional[datetime] = None

    class PriorityLevel(Enum):
        LOW = 1
        MEDIUM = 2
        HIGH = 3

    priority: PriorityLevel = PriorityLevel.LOW  # Default to LOW priority


class TaskManager:
    @staticmethod
    async def create(task_data: TaskSchema) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())  # Use UUID
        return {"id": task_id, **task_data.dict()}


class WebSocketBroker:
    @classmethod
    async def broadcast(cls, event_type: str, payload: dict):
        # await redis.publish('task_events', json.dumps(payload))
        # Implement actual messaging system
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
        return {"id": task["id"], "status": "created"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) from e
