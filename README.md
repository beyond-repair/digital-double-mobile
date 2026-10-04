<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║   ATOMIC DREAM LABS  ·  BEYOND-REPAIR                        ║
╚══════════════════════════════════════════════════════════════╝
```

# Digital Double Mobile

### SUPERSEDED Claim-0 offline sketch — not the canonical product

[![Lifecycle](https://img.shields.io/badge/●_SUPERSEDED-f59e0b?style=for-the-badge&labelColor=0f0f23)](https://github.com/beyond-repair/ADL-Governance)
[![Claim](https://img.shields.io/badge/Claim_0-22c55e?style=for-the-badge&labelColor=0f0f23)](https://github.com/beyond-repair/ADL-Governance/blob/main/docs/CLAIM_VALIDATION.md)
[![Governance](https://img.shields.io/badge/ADL--Governance-7c3aed?style=for-the-badge&labelColor=0f0f23)](https://github.com/beyond-repair/ADL-Governance)

```
LIFECYCLE   SUPERSEDED (Claim-0 runnable sketch)
CLAIM       0
SUCCESSOR   Digital_Double_virtual_workforce
NOT CLAIMED mobile product · live cloud models · production DB
```

</div>

---

> **SUPERSEDED.** Canonical successor: [Digital_Double_virtual_workforce](https://github.com/beyond-repair/Digital_Double_virtual_workforce). No new feature work beyond Claim-0 repair.

## Status

**RUNNABLE SKETCH — NOT A COMPLETE PRODUCT.**

Historical TS/React + Python tree repaired so a stranger can clone, install, run an offline FastAPI demo, pass pytest, and `npm run build` the Vite React `src/`. Product authority remains the successor repo.

| Item | State |
|------|--------|
| Classification | SUPERSEDED |
| Claim | 0 |
| Offline FastAPI | `/health`, `/metrics`, in-memory `/tasks` |
| Vite React `src/` | builds (offline menu shell; no model download) |
| Committed `.env` | removed from tree; secret scanning alert #1 still open — rotate/revoke; guard fails if `.env` returns |
| `node_modules` in git | untracked / removed from index |
| Dependabot PR #2 | ignored (vite bump); not merged by this repair |

## What works (Claim-0)

| Surface | Behavior |
| --- | --- |
| `python main.py` / `python -m dd_mobile` | Offline demo via TestClient (create/list tasks + metrics) |
| `python -m dd_mobile serve` | `uvicorn` on `127.0.0.1:8000` |
| `pytest` | health, tasks CRUD, metrics echo, superseded guard, main smoke |
| `npm install && npm run build` | Vite React pixel-workspace shell |
| `scripts/superseded_guard.py` | Banner + metrics echo + working-tree `.env` absence |

Broken historical paths (`v1_1_api`, DB pool `create_pool`, cloud model Worker download) are **not** product gates. Historical business-route file remains under `backend/api/` for identity; Claim-0 API is `dd_mobile.app`.

## Quick start

```bash
git clone https://github.com/beyond-repair/digital-double-mobile.git
cd digital-double-mobile
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
pytest -q
npm install
npm run build
```

Optional API server:

```bash
python -m dd_mobile serve
# curl http://127.0.0.1:8000/health
# curl -X POST http://127.0.0.1:8000/tasks \
#   -H 'content-type: application/json' \
#   -d '{"description":"hello","priority":"LOW"}'
```

Copy `.env.example` only if you experiment locally — never commit `.env`.

## Layout

```
├── dd_mobile/           ← Claim-0 FastAPI (in-memory tasks)
├── backend/api/         ← historical metrics + business_routes sketch
├── src/                 ← Vite React pixel workspace
├── frontend/            ← historical Flutter/Dart leftovers (not Claim-0 gate)
├── main.py
├── requirements.txt
├── package.json
├── SUPERSEDED.md
└── CLAIM_STATUS.md
```

## Security note

A `.env` blob previously lived on `main`. It is deleted from the working tree in this Claim-0 repair (no history rewrite). Secret scanning alert #1 remains open. **Rotate and revoke** any credentials that may have been present (including OpenRouter-style keys). Use `.env.example` placeholders only. The superseded guard fails if `.env` is present in the working tree.

## What this repository is not

- Not the canonical Digital Double product (see successor).
- Not a mobile app store release or Flutter build gate.
- Not live model download / HuggingFace / OpenRouter inference.
- Not a PostgreSQL-backed business API.

Governance: [ADL-Governance](https://github.com/beyond-repair/ADL-Governance) · Claim ledger: [CLAIM_STATUS.md](CLAIM_STATUS.md).

---

<div align="center">

**REWRITE · BUILD · TRANSCEND**

</div>
