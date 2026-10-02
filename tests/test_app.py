"""FastAPI TestClient tests for Claim-0 offline task API."""

from fastapi.testclient import TestClient

from dd_mobile.app import app, reset_store

client = TestClient(app)


def setup_function():
    reset_store()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["mode"] == "offline-memory"
    assert body["claim"] == "0"


def test_create_and_list_tasks():
    r = client.post("/tasks", json={"description": "write tests", "priority": "MEDIUM"})
    assert r.status_code == 201
    task = r.json()
    assert task["description"] == "write tests"
    assert task["priority"] == "MEDIUM"
    assert "id" in task

    listed = client.get("/tasks")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == task["id"]


def test_get_task():
    created = client.post("/tasks", json={"description": "fetch me"}).json()
    r = client.get(f"/tasks/{created['id']}")
    assert r.status_code == 200
    assert r.json()["description"] == "fetch me"


def test_get_missing_task():
    r = client.get("/tasks/does-not-exist")
    assert r.status_code == 404


def test_delete_task():
    created = client.post("/tasks", json={"description": "temp"}).json()
    r = client.delete(f"/tasks/{created['id']}")
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"
    assert client.get(f"/tasks/{created['id']}").status_code == 404


def test_metrics_echo():
    client.post("/tasks", json={"description": "metric task", "priority": "LOW"})
    r = client.get("/metrics")
    assert r.status_code == 200
    body = r.json()
    assert body["store_size"] == 1
    assert body["counters"]["tasks_created"] == 1
    assert body["echo"]["status"] == "success"


def test_create_task_validation():
    r = client.post("/tasks", json={"description": ""})
    assert r.status_code == 422
