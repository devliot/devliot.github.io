---
phase: 4
slug: navigation-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.59.1 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npm run test-e2e` |
| **Full suite command** | `npm run test-e2e` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test-e2e`
- **After every plan wave:** Run `npm run test-e2e`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | NAV-01, NAV-02, NAV-03, NAV-04 | — | N/A | E2E stubs | `npm run test-e2e -- --grep "NAV"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | NAV-02 | — | N/A | E2E | `npm run test-e2e -- --grep "NAV-02"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | NAV-01 | — | N/A | E2E | `npm run test-e2e -- --grep "NAV-01"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | NAV-03 | — | N/A | E2E | `npm run test-e2e -- --grep "NAV-03"` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | NAV-04 | T-4-01 | Search input auto-escaped by Lit templates — no unsafeHTML for search-derived content | E2E | `npm run test-e2e -- --grep "NAV-04"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/navigation-discovery.spec.ts` — E2E test stubs for NAV-01, NAV-02, NAV-03, NAV-04
- [ ] `public/search-data.json` — must exist before E2E tests can exercise search

*Existing Playwright infrastructure (config, npm script) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| *None* | — | — | — |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
