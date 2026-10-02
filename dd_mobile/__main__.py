"""python -m dd_mobile — demo + optional serve."""

from __future__ import annotations

import argparse
import json
import sys

from fastapi.testclient import TestClient

from dd_mobile.app import app, reset_store


def run_demo() -> int:
    reset_store()
    client = TestClient(app)
    health = client.get("/health").json()
    created = client.post(
        "/tasks",
        json={"description": "Claim-0 offline demo task", "priority": "HIGH"},
    ).json()
    listed = client.get("/tasks").json()
    metrics = client.get("/metrics").json()
    print("=== Digital Double Mobile — Claim-0 demo ===")
    print("health:", json.dumps(health, indent=2))
    print("created:", json.dumps(created, indent=2))
    print("tasks:", json.dumps(listed, indent=2))
    print("metrics:", json.dumps(metrics, indent=2))
    print("SUPERSEDED → Digital_Double_virtual_workforce")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Digital Double Mobile Claim-0")
    parser.add_argument(
        "command",
        nargs="?",
        default="demo",
        choices=("demo", "serve"),
        help="demo (default) or serve FastAPI via uvicorn",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args(argv)
    if args.command == "serve":
        import uvicorn

        uvicorn.run("dd_mobile.app:app", host=args.host, port=args.port, reload=False)
        return 0
    return run_demo()


if __name__ == "__main__":
    raise SystemExit(main())
