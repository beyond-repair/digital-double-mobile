#!/usr/bin/env python3
"""Claim-capped SUPERSEDED guard for digital-double-mobile.

Does not import FastAPI, does not read .env, does not claim product runtime.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "SUPERSEDED",
    "Digital_Double_virtual_workforce",
    "CLAIM",
)


def main() -> int:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    banner = (ROOT / "SUPERSEDED.md").read_text(encoding="utf-8")
    claim = (ROOT / "CLAIM_STATUS.md").read_text(encoding="utf-8")
    missing = [token for token in REQUIRED if token not in readme or token not in banner]
    if "0" not in claim or "SUPERSEDED" not in claim:
        missing.append("CLAIM_STATUS")
    if (ROOT / ".env").exists():
        missing.append("working-tree .env")
    if missing:
        print("FAIL", missing)
        return 1
    sys.path.insert(0, str(ROOT / "backend" / "api"))
    from metrics import update_metrics  # noqa: E402

    sample = {"id": "guard"}
    out = update_metrics(sample)
    if out != {"status": "success", "data": sample}:
        print("FAIL metrics echo", out)
        return 1
    print("PASS superseded guard")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
