---
phase: 7
slug: deep-linkable-anchors
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (already installed — see `playwright.config.ts`) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test tests/deep-linkable-anchors.spec.ts --project=chromium` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds for the dedicated spec file in chromium; ~45 seconds for the full suite across projects |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/deep-linkable-anchors.spec.ts --project=chromium`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green (all specs, all projects)
- **Max feedback latency:** ~15 seconds (single-spec chromium run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | ANCH-01..05 | — | Playwright spec stubs created for all 5 ANCH criteria (RED tests before impl) | E2E stubs | `npx playwright test tests/deep-linkable-anchors.spec.ts --list` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | ANCH-03 | — | ResizeObserver publishes `--header-height` to document root | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-03" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | ANCH-03 | — | `h2, h3 { scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem) }` applied | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-03" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | ANCH-05 | — | Anchor injection selector tightened to `h2, h3`; h4-h6 skipped | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-05" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | ANCH-05 | — | CSS hover-reveal rule scoped to `h2:hover, h3:hover, .heading-anchor:focus`; h4-h6 hover removed | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-05" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | ANCH-01 | — | Anchor click uses `new URL(window.location.href).searchParams.set(...)` + `history.pushState` (no clipboard write) | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-01" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 3 | ANCH-02 | — | `_scrollToSectionFromUrl()` reads `?section=` and smooth-scrolls via `scrollIntoView({behavior: 'smooth'})` | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-02" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 3 | ANCH-02 | — | Initial load uses `history.replaceState` (not pushState) to avoid dead history entry | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-02" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-03-03 | 03 | 3 | ANCH-02 | — | Missing target: `?section=` silently stripped via replaceState, page stays at article top | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "missing target" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-04-01 | 04 | 4 | ANCH-04 | — | `popstate` listener re-runs scroll-to-section when `?section=` changes; article DOM not remounted | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-04" --project=chromium` | ❌ W0 | ⬜ pending |
| 07-04-02 | 04 | 4 | ANCH-01..05 | — | No regression in existing specs (article-components, article-metadata, navigation-discovery, design-system) | E2E full suite | `npx playwright test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are illustrative — the planner's final wave/task layout supersedes this table, but every ANCH-N criterion MUST map to at least one task row once plans are finalized.*

---

## Wave 0 Requirements

- [ ] `tests/deep-linkable-anchors.spec.ts` — RED stubs for ANCH-01 through ANCH-05 (five grouped tests: "ANCH-01: ...", "ANCH-02: ...", etc.). Tests will fail until Waves 1-4 land, which is the point (proves failure-detection before proving success).
- [ ] No new framework install — Playwright and `playwright.config.ts` already exist from v1.0.
- [ ] No new fixtures required — reuse the demo article (`/public/articles/01-demo-article/`) for all assertions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Smooth-scroll animation quality (feels "brief" per D-07, not jarring) | ANCH-02 | Subjective motion-feel; Playwright can assert position but not perceived smoothness | In Chrome + Safari: open `http://localhost:5173/?section=code-highlighting#/article/01-demo-article`, confirm scroll animates (not instant snap) and lands with breathing room above heading |
| Hover-reveal `#` opacity transition (D-12 from Phase 3) still reads as "hover-reveal" post-scope-tightening | ANCH-05 | Visual polish — automation can assert CSS rules exist but not that the transition reads correctly to a human | In Chrome: hover over each h2 and h3 in demo article, confirm `#` fades in at `left: -1.5em`; hover over h4+, confirm nothing appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`tests/deep-linkable-anchors.spec.ts`)
- [ ] No watch-mode flags (Playwright runs in one-shot mode per `playwright.config.ts`)
- [ ] Feedback latency < 20s (chromium-only quick run)
- [ ] `nyquist_compliant: true` set in frontmatter after planner assigns final task IDs

**Approval:** pending
