---
phase: 6
slug: data-schema-extension
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.59.1 (E2E only — no unit test framework installed) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx tsc` (type-check only — primary validation for this phase) |
| **Full suite command** | `npm run build && npx playwright test --project=chromium` |
| **Estimated runtime** | ~3s (tsc) / ~60s (full build + e2e) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc`
- **After every plan wave:** Run `npm run build && npx playwright test --project=chromium`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds (per-commit tsc)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-01 | TBD | TBD | AUTHOR-01 | — | N/A (schema-only, no user input) | compile | `npx tsc` | N/A (type-check) | ⬜ pending |
| TBD-02 | TBD | TBD | REF-01 | — | N/A | compile | `npx tsc` | N/A | ⬜ pending |
| TBD-03 | TBD | TBD | SC-3 (demo compiles) | — | N/A | compile+build | `npm run build` | N/A | ⬜ pending |
| TBD-04 | TBD | TBD | Regression | — | N/A | e2e | `npx playwright test --project=chromium` | tests/*.spec.ts (4 files) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs populated once the planner assigns per-plan task numbers.*

---

## Wave 0 Requirements

- [ ] No new test framework install required — Playwright 1.59.1 already configured
- [ ] No new test files required — `tsc` IS the primary validator for schema-only phase
- [ ] Existing 41 Playwright tests in `tests/*.spec.ts` cover regression

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Demo article body `[id]` markers render as plain text (no linkification yet) | D-16 | Phase 6 explicitly defers rendering to Phase 10; only visual smoke test | Open `http://localhost:5173/#/article/01-demo-article` after `npm run dev` — inline `[id]` tokens appear literally in article body |

*All other phase behaviors have automated verification via `tsc` and Playwright regression.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none needed)
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s for per-commit `tsc`
- [ ] `nyquist_compliant: true` set in frontmatter once planner fills task IDs

**Approval:** pending
