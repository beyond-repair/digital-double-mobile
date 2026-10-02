"""Historical metrics echo + superseded guard smoke."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_update_metrics_echo():
    sys.path.insert(0, str(ROOT / "backend" / "api"))
    from metrics import update_metrics

    sample = {"id": "unit"}
    assert update_metrics(sample) == {"status": "success", "data": sample}


def test_superseded_guard_script():
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "superseded_guard.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "PASS" in result.stdout
