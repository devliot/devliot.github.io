---
phase: 8
slug: ui-refresh
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `08-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (`@playwright/test`) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test tests/ui-refresh.spec.ts --project=chromium` |
| **Full suite command** | `npx playwright test --project=chromium` |
| **Estimated runtime** | ~5s (quick) / ~30s (full chromium) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test tests/ui-refresh.spec.ts --project=chromium`
- **After every plan wave:** Run `npx playwright test --project=chromium`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds (full suite chromium)

---

## Per-Task Verification Map

> Task IDs use the planner-assigned `{phase}-{plan}-{task}` pattern. Filled by planner; rows below capture the requirement-to-test contract that every task must trace back to.

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| UI-01a | Header background `rgb(255, 255, 255)` on home and article | E2E (computed style) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-01.*white" --project=chromium` | ❌ W0 |
| UI-01b | Scroll shadow absent when `scrollY === 0` | E2E (computed style) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-01.*shadow.*absent" --project=chromium` | ❌ W0 |
| UI-01c | Scroll shadow appears after scrolling past threshold | E2E (computed style + scroll) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-01.*shadow.*appears" --project=chromium` | ❌ W0 |
| UI-02 | Footer background `rgb(255, 255, 255)`, no top border/shadow | E2E (computed style) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-02" --project=chromium` | ❌ W0 |
| UI-03a | Home header has search affordance, no logo | E2E (element presence/absence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-03.*search.*no logo" --project=chromium` | ❌ W0 |
| UI-03b | Home header has no `.menu-toggle` element | E2E (element absence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-03.*no hamburger" --project=chromium` | ❌ W0 |
| UI-04a | Article header has DEVLIOT logo, no search | E2E (element presence/absence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-04.*logo.*no search" --project=chromium` | ❌ W0 |
| UI-04b | Article header has no `.menu-toggle` element | E2E (element absence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-04.*no hamburger" --project=chromium` | ❌ W0 |
| D-10 | ResizeObserver pipeline survives variant swap (heading lands below sticky header) | E2E (existing) | `npx playwright test tests/deep-linkable-anchors.spec.ts --project=chromium` | ✅ Exists |
| REGR | Existing tests stay green after refactor (incl. updated design-system + navigation-discovery specs) | E2E (full suite) | `npx playwright test --project=chromium` | ✅ Exists |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/ui-refresh.spec.ts` — new spec covering UI-01 through UI-04 (white bg, scroll shadow, variant content)
- [ ] Update `tests/design-system.spec.ts` — 4 tests need to navigate to article page (logo/link/font) since home variant no longer renders the logo; assert hamburger removal
- [ ] Update `tests/navigation-discovery.spec.ts` — 2 tests expecting English aria-labels switch to French (`Rechercher un article…`)
- [x] Playwright already installed and configured (no install needed)

---

## Manual-Only Verifications

*All phase behaviors have automated verification via Playwright.*

The visual aesthetic of the scroll-shadow (subtle, monochrome, smooth fade) is asserted indirectly via `boxShadow !== 'none'` plus `transition` properties — exact pixel/alpha values are author judgment and don't need a manual sign-off step.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
