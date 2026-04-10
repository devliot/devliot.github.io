---
phase: 2
slug: design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.59.1 |
| **Config file** | `playwright.config.ts` (Wave 0 creates) |
| **Quick run command** | `npx playwright test --project=chromium tests/design-system.spec.ts` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --project=chromium tests/design-system.spec.ts`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | INFRA-05 | — | N/A | setup | `npx playwright test --list` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | BRAND-02 | — | N/A | E2E | `npx playwright test --grep "body font"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | BRAND-02 | — | N/A | E2E | `npx playwright test --grep "accent color"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | BRAND-01 | — | N/A | E2E | `npx playwright test --grep "header logo"` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | BRAND-01 | — | N/A | E2E | `npx playwright test --grep "hero logo"` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | INFRA-05 | — | N/A | E2E | `npx playwright test --grep "overflow.*mobile"` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | INFRA-05 | — | N/A | E2E | `npx playwright test --grep "sticky header"` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 2 | INFRA-05 | — | N/A | E2E | `npx playwright test --grep "max-width"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — root config, webServer setup pointing to Vite dev server at `http://localhost:5173/devliot/`
- [ ] `tests/design-system.spec.ts` — test stubs for all responsive + brand assertions
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Typography is "readable at arm's length" | BRAND-02 | Subjective visual assessment | Open site at 1280px, read body text from ~60cm distance |
| ASCII art preserves OPENCODE aesthetic | BRAND-01 | Subjective design judgment | Compare rendered logo to OPENCODE reference style |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
