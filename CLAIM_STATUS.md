# Claim status

| Field | Value |
|-------|--------|
| Repository | digital-double-mobile |
| Classification | SUPERSEDED |
| Claim level | 0 |
| Successor | Digital_Double_virtual_workforce |
| Sweep | Sweep-208 re-audit (2026-10-03). Prior Claim-0 repair 2026-10-02. |
| Product runtime | Not claimed. Offline sketch only. |
| Tests | `pytest` (tests/) + `scripts/superseded_guard.py`. CI workflow now runs both. `npm run build` is documented, not a CI gate this sweep. |
| Secrets | Working tree has no `.env` (Sweep-208 clone). History still may. Rotate any keys that ever lived there. |
| Empty stubs | Zero-byte `ar-view.html`, `dashboard.html`, `workspace.html`, `settings.html`, `favicon.ico`, `icons.png`, `distressed-metal-bg.png` are historical placeholders, not Claim-0 gates. |

No promotion. No archive flag change. No lockfile bump (open critical Dependabot #30 protobufjs, #8 form-data).
