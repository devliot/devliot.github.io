---
phase: 07-deep-linkable-anchors
plan: "03"
subsystem: ui
tags: [replaceState, popstate, history-api, playwright, lit, typescript]

requires:
  - phase: 07-deep-linkable-anchors
    plan: "02"
    provides: h2/h3-scoped anchor injection, history.pushState click handler writing ?section= to top-level search

provides:
  - Initial-load section scroll with replaceState on hit and silent strip on miss (ANCH-02, D-03, D-08)
  - popstate listener for back/forward navigation between section anchors (ANCH-04, D-04)
  - End-to-end verification of sticky-header offset via ResizeObserver + scroll-margin-top pipeline (ANCH-03)

affects:
  - 07-04-PLAN (path-routing migration — _scrollToSectionFromUrl and _onPopState keep reading from window.location.search, so the ?section= contract survives the route shape change)

tech-stack:
  added: []
  patterns:
    - "history.replaceState on initial-load hit — no extra history entry so back button leaves cleanly"
    - "url.searchParams.delete('section') + replaceState on miss — silently strips invalid ?section= without error UI"
    - "Class-level arrow method for popstate handler — stable this-binding and stable reference for add/removeEventListener pair"

key-files:
  created: []
  modified:
    - src/pages/devliot-article-page.ts

key-decisions:
  - "replaceState on initial-load hit (D-03) — loading a deep-link URL does not push a redundant history entry, so pressing Back leaves the article in one step"
  - "Silent miss handling (D-08) — invalid ?section= values are stripped from the URL via replaceState with no toast, no console warning; page stays at article top"
  - "popstate handler is a class-level arrow function (_onPopState) — preserves this-binding without bind() and gives a stable function reference so removeEventListener in disconnectedCallback matches the add in connectedCallback"
  - "popstate handler only scrolls (D-04) — never triggers router navigation; same article, same DOM, different scroll position"
  - "CSS.escape preserved on both _scrollToSectionFromUrl and _onPopState querySelector calls (T-07-01 mitigation)"

requirements-completed:
  - ANCH-02
  - ANCH-03
  - ANCH-04

duration: ~15min
completed: "2026-04-15"
---

# Phase 07 Plan 03: Scroll-to-section on Load + popstate Handler Summary

**Enhanced initial-load scroll with replaceState/miss-strip, wired popstate listener for back/forward section navigation — ANCH-02/03/04 complete**

## Performance

- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 1
- **Commits:** 2 feat commits + this docs commit

## Accomplishments

- Rewrote `_scrollToSectionFromUrl()` to call `history.replaceState` on hit (no redundant history entry) and to delete `?section=` on miss (silent strip)
- Added `_onPopState` class-level arrow method that re-scrolls to the heading identified by `?section=` when the user navigates Back/Forward
- Registered the popstate listener in `connectedCallback` and cleaned it up in `disconnectedCallback`
- Preserved `CSS.escape(section)` on both the initial-load and popstate querySelector paths (T-07-01 mitigation)
- Human verification passed: hover-reveal scope (h2/h3 only, no h4), click-to-URL, sticky-header offset (~12px gap), back/forward navigation, deep-link load, missing-target silent strip

## Task Commits

Each auto task was committed atomically:

1. **Task 1: Enhance _scrollToSectionFromUrl with replaceState and miss handling** — `e2e6f3d` (feat)
2. **Task 2: Wire popstate listener for back/forward section navigation** — `c1ff3d4` (feat)
3. **Task 3: Human visual verification** — approved by user (no code commit; SUMMARY documents the outcome)

## Files Created/Modified

- `src/pages/devliot-article-page.ts` — enhanced `_scrollToSectionFromUrl`, new `_onPopState` arrow method, popstate listener registered/cleaned up in connectedCallback/disconnectedCallback

## Decisions Made

- `history.replaceState` on initial-load hit per D-03: opening a deep-link URL must not create a second history entry; the Back button should leave the article in a single step, not bounce between the same URL twice.
- Silent miss handling per D-08: invalid `?section=` targets are stripped via `url.searchParams.delete('section')` + `replaceState`. No error toast, no console warning — the URL simply no longer contains the bad section and the page stays at article top.
- `_onPopState` implemented as a class-level arrow function, not a `.bind(this)` in constructor: keeps this-binding stable, gives a stable function reference for the add/removeEventListener pair, and reads cleanly in the class body.
- popstate handler only scrolls per D-04: it never invokes the router or remounts the article. The null-check chain (`shadowRoot?.querySelector('article')?.querySelector(...)`) naturally short-circuits if the component has been unmounted (RESEARCH.md Pitfall 3).
- `CSS.escape(section)` preserved on both `_scrollToSectionFromUrl` and `_onPopState` per T-07-01: URL-derived selector values are always escaped before use in querySelector.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Human Verification Outcome

All 7 visual checks from the checkpoint task passed on the dev server (http://localhost:5173):

1. Hover-reveal scope — `#` icon appears on h2/h3 only, no h4 — PASS
2. Click-to-URL — address bar updates with `?section=`, no reload, smooth scroll — PASS
3. Sticky-header offset — heading visible below header with ~12px gap — PASS
4. Back/forward — URL returns, smooth-scroll back, no reload/flicker — PASS
5. Deep-link load — `?section=code-highlighting` scrolls to heading under header — PASS
6. Missing target — invalid `?section=` stays at top, param silently stripped — PASS
7. Safari (optional) — not re-tested, Chromium Playwright pass is authoritative

## Next Phase Readiness

- All five ANCH requirements (ANCH-01..05) are now GREEN on the current hash-based routing
- Plan 04 (path-routing migration) is next — since `_scrollToSectionFromUrl` and `_onPopState` read from `window.location.search`, the `?section=` contract survives the move from `/#/article/{slug}?section=x` to `/article/{slug}?section=x` without modification. Only the route match shape changes.
- The popstate handler will continue to work because it already ignores events without a `?section=` — path-routing navigation (different article) still leaves the handler as a no-op for that article instance.

---
*Phase: 07-deep-linkable-anchors*
*Completed: 2026-04-15*
