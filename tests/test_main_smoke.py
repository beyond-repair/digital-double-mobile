"""Smoke: python main.py demo exits 0."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_main_demo():
    result = subprocess.run(
        [sys.executable, str(ROOT / "main.py"), "demo"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Claim-0" in result.stdout
    assert "health" in result.stdout
