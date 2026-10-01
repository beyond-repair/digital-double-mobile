<div align="center">

[![Lifecycle](https://img.shields.io/badge/●_SUPERSEDED-f59e0b?style=for-the-badge&labelColor=0f0f23)](https://github.com/beyond-repair/ADL-Governance)
[![Claim](https://img.shields.io/badge/Claim_0-22c55e?style=for-the-badge&labelColor=0f0f23)](https://github.com/beyond-repair/ADL-Governance/blob/main/docs/CLAIM_VALIDATION.md)
[![Governance](https://img.shields.io/badge/ADL--Governance-7c3aed?style=for-the-badge&labelColor=0f0f23)](https://github.com/beyond-repair/ADL-Governance)

```
LIFECYCLE   SUPERSEDED
CLAIM       0
SUCCESSOR   Digital_Double_virtual_workforce
```

</div>

> **SUPERSEDED.** Canonical successor: [Digital_Double_virtual_workforce](https://github.com/beyond-repair/Digital_Double_virtual_workforce). No new feature work.

---

> **SUPERSEDED (Sweep-184 re-audit)**
>
> Classification: **SUPERSEDED**.
> Canonical successor: [Digital_Double_virtual_workforce](https://github.com/beyond-repair/Digital_Double_virtual_workforce).
> Claim ledger: [CLAIM_STATUS.md](CLAIM_STATUS.md).
> Guard: `python scripts/superseded_guard.py` (banner + metrics echo only).
> Do not treat the historical feature list or `backend/api/tests/test_business_routes.py` as VERIFIED. That test imports `v1_1_api`, which is not in this tree.
> GitHub `archived` flag remains operator-only.
>
> **Security residual:** `.env` is still committed on `main` (blob present at Sweep-184 tree). Operator must rotate any credentials that ever lived in that file. Purge is operator-only. No history rewrite in this sweep.

# Digital Double Mobile (historical tree)

Historical mobile-adjacent sketch. Product authority is the public canonical Digital Double repository.

## Status table (Sweep-184)

| Item | State |
|------|--------|
| Classification | SUPERSEDED (reconfirmed) |
| Claim | 0 |
| CI | `superseded-guard` workflow added this sweep; post-push run not yet observed at commit time |
| Historical business-route test | Not a product gate (missing `v1_1_api`) |
| Committed `.env` | OPEN security finding |
| `node_modules` in tree | Residual hygiene issue |
| Tags / releases | Not created |

---

<div align="center">

**REWRITE · BUILD · TRANSCEND**

Governing source: [ADL-Governance](https://github.com/beyond-repair/ADL-Governance) · [Claim levels 0–5](https://github.com/beyond-repair/ADL-Governance/blob/main/docs/CLAIM_VALIDATION.md)

</div>
