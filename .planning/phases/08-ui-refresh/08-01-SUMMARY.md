---
phase: "08"
plan: "01"
subsystem: ui-chrome
tags: [playwright, css-tokens, footer, test-stubs]
dependency_graph:
  requires: []
  provides: [tests/ui-refresh.spec.ts, --color-border token, white footer background]
  affects: [src/styles/reset.css, src/styles/footer.css]
tech_stack:
  added: []
  patterns: [Playwright toHaveCSS for Lit host elements, CSS custom property token addition]
key_files:
  created:
    - tests/ui-refresh.spec.ts
  modified:
    - src/styles/reset.css
    - src/styles/footer.css
decisions:
  - "--color-border value #e5e5e5 matches plan spec (D-03 suggested value accepted)"
  - "Shadow-absent test (UI-01b) passes against current codebase — this is expected and correct since the current header has no box-shadow; it will continue passing after Plan 02 implementation"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 8 Plan 01: Test Scaffold + Token + Footer Background Summary

**One-liner:** 8 RED Playwright stubs covering UI-01..UI-04 plus `--color-border: #e5e5e5` token and footer white background via `var(--color-surface)`.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create Playwright test stubs for UI-01 through UI-04 (RED) | f107c6f | tests/ui-refresh.spec.ts (created, 85 lines, 8 tests) |
| 2 | Add --color-border token and change footer to white background | 86bcc23 | src/styles/reset.css, src/styles/footer.css |

---

## What Was Built

### Task 1: Playwright RED test stubs

Created `tests/ui-refresh.spec.ts` with 8 test stubs:

| Test | Req ID | Status after Task 2 |
|------|--------|---------------------|
| UI-01: header background is white on both pages | UI-01a | RED |
| UI-01: scroll shadow absent when page is at top | UI-01b | GREEN (current header has no shadow) |
| UI-01: scroll shadow appears after scrolling | UI-01c | RED |
| UI-02: footer background is white | UI-02 | GREEN (Task 2 fixed this) |
| UI-03: home header has search affordance and no logo | UI-03a | RED |
| UI-03: home header has no hamburger menu button | UI-03b | RED |
| UI-04: article header has logo and no search | UI-04a | RED |
| UI-04: article header has no hamburger menu button | UI-04b | RED |

Test patterns used:
- `toHaveCSS()` on Lit custom element hosts for computed style assertions
- `page.locator('devliot-header')` / `page.locator('devliot-footer')` (no raw querySelector)
- `page.waitForSelector('devliot-article-page article h1', { timeout: 10000 })` for article page load
- `page.evaluate(() => window.scrollTo(0, 100))` + `waitForTimeout(300)` for scroll shadow test

### Task 2: CSS changes

**src/styles/reset.css** — Added `--color-border: #e5e5e5` to `:root` after `--color-text-muted` (D-03).

**src/styles/footer.css** — Changed `background-color: var(--color-surface-alt)` to `background-color: var(--color-surface)` (D-02). Single line change, no separator to remove.

---

## Verification Results

| Suite | Before | After |
|-------|--------|-------|
| tests/ui-refresh.spec.ts | n/a (new file) | 2 pass, 6 fail (6 RED stubs awaiting Plan 02) |
| tests/design-system.spec.ts | 11 pass | 11 pass (no regression) |
| tests/deep-linkable-anchors.spec.ts | 6 pass | 6 pass (no regression) |
| tests/navigation-discovery.spec.ts | 10 pass, 1 pre-existing fail | 10 pass, 1 pre-existing fail (unchanged) |

---

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed with exact file changes specified.

---

## Known Stubs

None. This plan creates test stubs by design (RED phase). The stubs are intentional and tracked — Plan 02 will implement the features that turn them GREEN.

---

## Threat Flags

None. This plan adds a CSS presentation token and changes a single CSS property value. No new trust boundaries, no user-controlled data, no network surface.

---

## Deferred Items

**Pre-existing failure (out of scope):** `tests/navigation-discovery.spec.ts` — "NAV-04: search with no results shows empty state" was already failing before this plan on the base branch. Not introduced by this plan's changes. Logged for awareness but not fixed.

---

## Self-Check: PASSED

- [x] tests/ui-refresh.spec.ts exists
- [x] src/styles/reset.css exists with `--color-border: #e5e5e5`
- [x] src/styles/footer.css exists with `background-color: var(--color-surface)`
- [x] Commit f107c6f exists (Task 1)
- [x] Commit 86bcc23 exists (Task 2)
