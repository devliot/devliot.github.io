---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | — | N/A | build | `npm run build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | INFRA-01 | — | N/A | dev-server | `npm run dev` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INFRA-02 | — | N/A | build | `npm run build && ls dist/` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | INFRA-03 | — | N/A | integration | `cat .github/workflows/*.yml` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | INFRA-04 | — | N/A | e2e | manual navigation test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` — install as dev dependency
- [ ] `vitest.config.ts` — configure for Lit component testing
- [ ] `tests/setup.ts` — shared test setup

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub Pages deploys on push | INFRA-03 | Requires actual GitHub Actions run | Push to main, verify live URL updates |
| Hash-based routing resolves | INFRA-04 | Requires browser navigation | Navigate to `/#/article/hello` in browser, verify no 404 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
