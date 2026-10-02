"""Offline FastAPI app: in-memory tasks + health + metrics.

Replaces the historical broken DB pool / v1_1_api import path with a
Claim-0 runnable surface. Not a product; SUPERSEDED by
Digital_Double_virtual_workforce.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from backend.api.metrics import update_metrics

app = FastAPI(
    title="Digital Double Mobile (Claim-0)",
    description=(
        "Historical SUPERSEDED sketch: offline in-memory task API. "
        "Successor: Digital_Double_virtual_workforce."
    ),
    version="0.1.0",
)

# In-memory store (no DB)
_TASKS: dict[str, dict[str, Any]] = {}
_METRICS: dict[str, Any] = {
    "tasks_created": 0,
    "tasks_listed": 0,
    "started_at": datetime.now(timezone.utc).isoformat(),
}


class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    due_date: Optional[datetime] = None
    priority: PriorityLevel = Field(default=PriorityLevel.LOW)


class TaskOut(BaseModel):
    id: str
    description: str
    due_date: Optional[datetime] = None
    priority: PriorityLevel
    status: str = "created"
    created_at: str


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "mode": "offline-memory",
        "claim": "0",
        "lifecycle": "SUPERSEDED",
    }


@app.get("/metrics")
def metrics() -> dict[str, Any]:
    echo = update_metrics({"tasks": len(_TASKS), **_METRICS})
    return {
        "store_size": len(_TASKS),
        "counters": dict(_METRICS),
        "echo": echo,
    }


@app.get("/tasks", response_model=list[TaskOut])
def list_tasks() -> list[dict[str, Any]]:
    _METRICS["tasks_listed"] = int(_METRICS.get("tasks_listed", 0)) + 1
    return list(_TASKS.values())


@app.post("/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate) -> dict[str, Any]:
    task_id = str(uuid4())
    task: dict[str, Any] = {
        "id": task_id,
        "description": body.description,
        "due_date": body.due_date,
        "priority": body.priority.value if isinstance(body.priority, PriorityLevel) else body.priority,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _TASKS[task_id] = task
    _METRICS["tasks_created"] = int(_METRICS.get("tasks_created", 0)) + 1
    update_metrics({"event": "TASK_CREATED", "id": task_id})
    return task


@app.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: str) -> dict[str, Any]:
    task = _TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: str) -> dict[str, str]:
    if task_id not in _TASKS:
        raise HTTPException(status_code=404, detail="task not found")
    del _TASKS[task_id]
    return {"status": "deleted", "id": task_id}


def reset_store() -> None:
    """Test helper: clear in-memory state."""
    _TASKS.clear()
    _METRICS.clear()
    _METRICS.update(
        {
            "tasks_created": 0,
            "tasks_listed": 0,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def create_app() -> FastAPI:
    return app
