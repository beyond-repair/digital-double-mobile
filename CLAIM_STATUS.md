# Claim status

| Field | Value |
|-------|--------|
| Repository | digital-double-mobile |
| Classification | SUPERSEDED |
| Claim level | 0 |
| Successor | Digital_Double_virtual_workforce |
| Sweep | Sweep-217 re-audit (2026-10-04). Prior Sweep-208 CI on `d081c0c1`. |
| Product runtime | Not claimed. Offline sketch only. |
| Tests | `pytest` 10 passed locally on pre-head `d081c0c1`. Guard now fails if a working-tree `.env` exists. `npm run build` is documented, not a CI gate. |
| Secrets | Working tree has no `.env`. Secret scanning alert #1 remains open (historical `.env`, OpenRouter type, publicly leaked, validity unknown). Rotate and revoke. Do not treat absence from the tree as rotation. |
| Dependabot | Open critical #30 `protobufjs` GHSA-xq3m-2v4x-88gg (runtime) and #8 `form-data` GHSA-fjxv-7rqg-78g4 (runtime). Lockfile not bumped. |
| Empty stubs | Zero-byte `ar-view.html`, `dashboard.html`, `favicon.ico`, `icons.png`, `distressed-metal-bg.png` are historical placeholders, not Claim-0 gates. |

No promotion. No archive flag. No history rewrite. No lockfile bump.
