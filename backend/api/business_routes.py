from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Response,
    BackgroundTasks
)
from .database import create_pool
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import sys
import os
from security.jwt_auth import validate_token
import uuid
import asyncio
from functools import lru_cache
from asyncio import Semaphore
from contextlib import asynccontextmanager


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM" 
    HIGH = "HIGH"


class TaskSchema(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    due_date: Optional[datetime] = None
    priority: PriorityLevel = Field(default=PriorityLevel.LOW)

    class Config:
        json_schema_extra = {
            "example": {
                "description": "Implement new feature",
                "due_date": "2024-01-01T00:00:00Z",
                "priority": "LOW"
            }
        }


class TaskManager:
    _sem = Semaphore(100)  # Concurrency limit
    _pool = None

    @classmethod
    @asynccontextmanager
    async def get_connection(cls):
        async with cls._sem:
            if not cls._pool:
                cls._pool = await create_pool()  # Your DB pool creation
            try:
                async with cls._pool.acquire() as conn:
                    yield conn
            except Exception as e:
                print(f"Connection error: {e}")
                raise

    @staticmethod
    async def create(task_data: TaskSchema) -> Dict[str, Any]:
        async with TaskManager.get_connection():
            task_id = str(uuid.uuid4())
            # Use connection pool for DB operations
            return {"id": task_id, **task_data.dict()}


class WebSocketBroker:
    @classmethod
    async def broadcast(cls, event_type: str, payload: dict):
        # await redis.publish('task_events', json.dumps(payload))
        # Implement actual messaging system
        pass


class TaskBatch:
    def __init__(self, max_size: int = 100):
        self.tasks = []
        self.max_size = max_size
        self._lock = asyncio.Lock()
        self.priority_queues = {
            PriorityLevel.HIGH: [],
            PriorityLevel.MEDIUM: [],
            PriorityLevel.LOW: []
        }
        self.retry_delays = {
            PriorityLevel.HIGH: 1,
            PriorityLevel.MEDIUM: 5,
            PriorityLevel.LOW: 10
        }

    async def add(self, task: Dict[str, Any], retry_count: int = 0):
        async with self._lock:
            priority = PriorityLevel(task.get('priority', PriorityLevel.LOW))
            task['retry_count'] = retry_count
            self.priority_queues[priority].append(task)
            
            if sum(len(q) for q in self.priority_queues.values()) >= self.max_size:
                await self.process()

    async def process(self):
        for priority in PriorityLevel:
            queue = self.priority_queues[priority]
            if queue:
                try:
                    await self._process_batch(queue, priority)
                except Exception as e:
                    await self._handle_batch_error(queue, priority, e)
                queue.clear()

    async def _handle_batch_error(self, batch: list, priority: PriorityLevel, error: Exception):
        delay = self.retry_delays[priority]
        for task in batch:
            if task['retry_count'] < 3:
                await asyncio.sleep(delay * (task['retry_count'] + 1))
                await self.add(task, task['retry_count'] + 1)
            else:
                print(f"Task {task['id']} failed after 3 retries: {error}")

    async def _process_batch(self, batch):
        try:
            await asyncio.gather(*[
                WebSocketBroker.broadcast("TASK_CREATED", task) 
                for task in batch
            ])
        except Exception as e:
            print(f"Batch processing error: {e}")


task_batch = TaskBatch()


router = APIRouter()


@lru_cache(maxsize=100)
def get_cached_config() -> Dict[str, Any]:
    # Cache configuration settings
    return {"max_tasks": 100, "timeout": 30}


@router.post("/tasks", response_model=Dict[str, str])
async def create_task(
    task_data: TaskSchema,
    response: Response,
    background_tasks: BackgroundTasks,
    token_data: Dict = Depends(validate_token)
):
    try:
        task = await TaskManager.create(task_data)
        await task_batch.add(task)
        
        response.headers.update({
            "Cache-Control": "private, max-age=3600",
            "X-Task-ID": task["id"]
        })
        
        background_tasks.add_task(update_metrics, task)
        return {"id": task["id"], "status": "created"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) from e


def update_metrics(task):
    pass  # Implement metric tracking logic here
