---
phase: 07-deep-linkable-anchors
plan: "02"
subsystem: ui
tags: [pushState, url-api, anchor-injection, playwright, lit, typescript]

requires:
  - phase: 07-deep-linkable-anchors
    plan: "01"
    provides: RED Playwright stubs, ResizeObserver pipeline, scroll-margin-top on h2/h3, hover-reveal scoped to h2/h3

provides:
  - Anchor injection restricted to h2/h3 only (ANCH-05 complete)
  - Click handler using history.pushState + URL API (ANCH-01 complete)

affects:
  - 07-03-PLAN (scroll-to-section on load + popstate handler — ANCH-02/ANCH-04 remain RED)

tech-stack:
  added: []
  patterns:
    - "new URL(window.location.href) + url.searchParams.set('section', id) places ?section= in top-level search before hash"
    - "history.pushState({ section: id }, '', url.toString()) — creates history entry per anchor click"

key-files:
  created: []
  modified:
    - src/pages/devliot-article-page.ts

key-decisions:
  - "history.pushState (not replaceState) — each click creates a history entry so back button steps through sections (D-02)"
  - "new URL(window.location.href) + searchParams.set pattern places ?section= before the hash — avoids HashRouter remount (RESEARCH.md Pitfall 1)"
  - "Clipboard write removed entirely (D-01) — no toast, no visual feedback, URL update + scroll is the complete action"
  - "querySelectorAll scoped to h2, h3 — h4/h5/h6 receive no anchor element (D-05, ANCH-05)"

requirements-completed:
  - ANCH-01
  - ANCH-05

duration: 7min
completed: "2026-04-15"
---

# Phase 07 Plan 02: Deep-linkable Anchors — Selector Tightening and pushState Click Handler Summary

**Anchor injection restricted to h2/h3; clipboard write replaced with history.pushState + URL API construction placing ?section= in top-level search before hash**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-15T13:38:00Z
- **Completed:** 2026-04-15T13:45:08Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Changed `querySelectorAll` selector from `h2, h3, h4, h5, h6` to `h2, h3` — h4/h5/h6 receive no anchor element (ANCH-05)
- Replaced clipboard write + string-concat URL with `history.pushState` + `new URL(window.location.href)` + `url.searchParams.set('section', id)` — ANCH-01
- Removed entire `navigator.clipboard` block (D-01: no clipboard write on anchor click)
- ANCH-01 and ANCH-05 Playwright tests pass; no regressions in 45 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Tighten anchor selector to h2, h3 only** - `cc8d8ba` (feat)
2. **Task 2: Rewrite click handler to use pushState, remove clipboard** - `ddbc19c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/pages/devliot-article-page.ts` — `querySelectorAll` narrowed to `h2, h3`; click handler uses `history.pushState` + URL API; clipboard block removed

## Decisions Made

- `history.pushState` (not `replaceState`) per D-02: each anchor click creates a new history entry so the browser back button steps through the section navigation history.
- `new URL(window.location.href) + searchParams.set('section', id)` per RESEARCH.md Pitfall 1: this places `?section=` in the top-level search string before the hash fragment. String concatenation onto `window.location.hash` would incorrectly embed `?section=` inside the hash, triggering a HashRouter remount.
- Clipboard write removed entirely per D-01: the spec decision was to update the URL only, with no toast or visual feedback. The `scrollIntoView` call is the sole user-visible effect beyond the URL change.
- `querySelectorAll('h2, h3')` only per D-05: the CSS hover-reveal rule was already scoped to h2/h3 in Plan 01; this makes the JavaScript injection consistent with the CSS scope.

## Deviations from Plan

None — plan executed exactly as written.

## Pre-existing Failures (not regressions)

Two tests were already failing before this plan's changes:

- **`ANCH-02: missing section is silently stripped`** — RED stub from Plan 01. Requires `_scrollToSectionFromUrl()` to call `history.replaceState` to strip `?section=` when the target element is not found. Scoped to Plan 03.
- **`META-01: OG page contains redirect script to hash URL`** — Quote style mismatch (single vs double quotes in expected string). Pre-existing, unrelated to this plan.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- ANCH-01 and ANCH-05 are now GREEN
- ANCH-02 (scroll on load + strip missing section), ANCH-03 (header-aware scroll), and ANCH-04 (back button) remain as Plan 03 scope
- The `?section=` parameter is now correctly placed in top-level search before the hash — Plan 03's `_scrollToSectionFromUrl()` reads from `window.location.search` which is already wired correctly

---
*Phase: 07-deep-linkable-anchors*
*Completed: 2026-04-15*
