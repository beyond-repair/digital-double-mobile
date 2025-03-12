from fastapi import APIRouter, FastAPI, WebSocket
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Optional
from starlette.exceptions import WebSocketDisconnect  # Added missing import


app = FastAPI()


class TaskSchema(BaseModel):
    id: Optional[str] = None
    description: str
    due_date: Optional[datetime]
    priority: int = 1


class TaskManager:
    @classmethod
    async def create(cls, task_data: TaskSchema) -> dict:
        task_data_dict = task_data.dict()
        task_data_dict['id'] = str(uuid.uuid4())
        return task_data_dict


class WebSocketBroker:
    active_connections = set()  # Moved to top for clarity

    @classmethod
    async def connect(cls, websocket: WebSocket):
        await websocket.accept()
        cls.active_connections.add(websocket)

    @classmethod
    async def disconnect(cls, websocket: WebSocket):
        cls.active_connections.remove(websocket)

    @classmethod
    async def broadcast(cls, event_type: str, payload: dict):
        for connection in cls.active_connections:
            await connection.send_json({
                "event": event_type,
                "data": payload
            })


router = APIRouter()


@router.post("/tasks")
async def create_task(task_data: TaskSchema):
    task = await TaskManager.create(task_data)
    await WebSocketBroker.broadcast("TASK_CREATED", task)
    return {"id": task["id"], "status": "queued"}


@router.websocket("/ws/tasks")
async def task_websocket(websocket: WebSocket):
    await WebSocketBroker.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await WebSocketBroker.disconnect(websocket)


app.include_router(router)
