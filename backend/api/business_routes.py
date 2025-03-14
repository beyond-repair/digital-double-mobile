from fastapi import APIRouter, Depends, HTTPException, status, Response, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import sys
import os
from security.jwt_auth import validate_token
import uuid  # New import for UUID generation
import asyncio
from functools import lru_cache
from asyncio import Semaphore
from contextlib import asynccontextmanager


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
        async with TaskManager.get_connection() as conn:
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
            TaskSchema.PriorityLevel.HIGH: [],
            TaskSchema.PriorityLevel.MEDIUM: [],
            TaskSchema.PriorityLevel.LOW: []
        }

    async def add(self, task: Dict[str, Any]):
        async with self._lock:
            priority = task.get('priority', TaskSchema.PriorityLevel.LOW)
            self.priority_queues[priority].append(task)
            if sum(len(q) for q in self.priority_queues.values()) >= self.max_size:
                await self.process()

    async def process(self):
        # Process high priority first
        for priority in TaskSchema.PriorityLevel:
            queue = self.priority_queues[priority]
            if queue:
                await self._process_batch(queue)
                queue.clear()

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

@router.post("/tasks")
async def create_task(
    task_data: TaskSchema,
    response: Response,
    token_data=Depends(validate_token),
    background_tasks: BackgroundTasks
):
    try:
        config = get_cached_config()
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
