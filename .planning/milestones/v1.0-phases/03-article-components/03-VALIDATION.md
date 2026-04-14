---
phase: 3
slug: article-components
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + Vitest (unit) |
| **Config file** | `playwright.config.ts` / `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx playwright test && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx playwright test && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ART-01 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ART-02 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ART-03 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ART-04 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ART-05 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ART-06 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ART-07 | — | N/A | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Playwright test stubs for ART-01 through ART-07
- [ ] Vitest config if not already present
- [ ] `npm install shiki katex mermaid chart.js @observablehq/plot` — all content libraries

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual rendering quality of syntax highlighting | ART-01 | Color/theme accuracy requires visual inspection | Open demo article, verify code blocks have GitHub Light theme colors |
| KaTeX formula visual correctness | ART-03 | Math rendering accuracy requires visual check | Open demo article, verify inline and block formulas render without errors |
| Mermaid diagram visual correctness | ART-06 | Diagram layout requires visual inspection | Open demo article, verify diagram renders with correct layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
