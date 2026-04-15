---
phase: 07-deep-linkable-anchors
plan: "01"
subsystem: ui
tags: [playwright, resize-observer, css, scroll-margin-top, web-components, lit]

requires:
  - phase: 06-data-schema-extension
    provides: Article/Author/BibliographyEntry types in src/types/article.ts

provides:
  - Playwright E2E test stubs (RED) for ANCH-01 through ANCH-05 in tests/deep-linkable-anchors.spec.ts
  - ResizeObserver pipeline publishing --header-height CSS custom property on document root
  - scroll-margin-top on h2/h3 consuming --header-height + 0.75rem breathing room
  - CSS hover-reveal rule scoped to h2/h3 only (h4-h6 removed)

affects:
  - 07-02-PLAN (anchor injection tightening + pushState click handler)
  - 07-03-PLAN (scroll-to-section on load + popstate handler)
  - 08-ui-refresh (Phase 8 header height changes absorbed automatically by ResizeObserver)

tech-stack:
  added: []
  patterns:
    - "ResizeObserver in devliot-app.ts firstUpdated() observes devliot-header and publishes CSS custom property to :root"
    - "scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem) pattern for sticky-header-aware scroll"

key-files:
  created:
    - tests/deep-linkable-anchors.spec.ts
  modified:
    - src/devliot-app.ts
    - src/styles/article.css

key-decisions:
  - "ResizeObserver placed in devliot-app.ts (never unmounts, renders header, publishes globally) rather than in devliot-header.ts or a separate util"
  - "borderBoxSize[0].blockSize with offsetHeight fallback matches RESEARCH.md Pitfall 5"
  - "0px fallback in scroll-margin-top calc() handles brief window before ResizeObserver fires on first paint"
  - "No scroll-behavior CSS added (avoids Safari 15.4+ programmatic scroll bug, RESEARCH.md Pitfall 4)"

patterns-established:
  - "ResizeObserver lifecycle pattern: observe in firstUpdated(), disconnect in disconnectedCallback()"
  - "Playwright tests follow existing article-components.spec.ts pattern: goto + waitForSelector(h1) before assertions"

requirements-completed:
  - ANCH-03
  - ANCH-05

duration: 15min
completed: "2026-04-15"
---

# Phase 07 Plan 01: Deep-linkable Anchors — Foundation Summary

**ResizeObserver pipeline publishing --header-height to :root, scroll-margin-top on h2/h3, and 6 RED Playwright stubs covering all ANCH criteria**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-15T13:38:35Z
- **Completed:** 2026-04-15T13:53:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created `tests/deep-linkable-anchors.spec.ts` with 6 RED test stubs covering ANCH-01 through ANCH-05 plus the missing-section edge case
- Added `ResizeObserver` in `devliot-app.ts` `firstUpdated()` that observes `devliot-header` and publishes live height as `--header-height` on `document.documentElement`
- Added `scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)` to `h2, h3` in `article.css`
- Scoped hover-reveal CSS rule from h2-h6 down to h2/h3 only (D-06), preserving keyboard focus rule

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Playwright test stubs for ANCH-01 through ANCH-05 (RED)** - `be49126` (test)
2. **Task 2: Add ResizeObserver to devliot-app.ts publishing --header-height** - `4064a43` (feat)
3. **Task 3: Add scroll-margin-top to h2/h3 and scope hover-reveal to h2/h3 in article.css** - `93c7d62` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `tests/deep-linkable-anchors.spec.ts` - 6 RED Playwright E2E stubs for ANCH-01 through ANCH-05 + missing-section edge case
- `src/devliot-app.ts` - ResizeObserver in firstUpdated() publishing --header-height; disconnectedCallback() cleanup
- `src/styles/article.css` - scroll-margin-top on h2/h3; hover-reveal scoped to h2/h3 only

## Decisions Made

- `ResizeObserver` placed in `devliot-app.ts` (not `devliot-header.ts`) because `devliot-app` lives for the full SPA session, renders the header, and publishes globally to `:root`. Phase 8 header content changes will be absorbed automatically since ResizeObserver fires on dimension changes.
- Used `borderBoxSize?.[0]?.blockSize ?? offsetHeight` pattern per RESEARCH.md Pitfall 5 (borderBoxSize is an array, not a direct property).
- `0px` fallback in `scroll-margin-top` calc expression prevents layout jitter during the brief window before the ResizeObserver fires on first paint.
- No `scroll-behavior: smooth` added anywhere in CSS — avoids the Safari 15.4+ bug that blocks programmatic scroll (RESEARCH.md Pitfall 4).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ResizeObserver pipeline established: Plans 02 and 03 can rely on `--header-height` being available on `:root`
- RED test stubs in place: as Plans 02 and 03 implement anchor injection, pushState, scroll-on-load, and popstate, tests will turn green one by one
- CSS scope change (h2/h3 hover-reveal) is live: Plan 02 anchor injection tightening will complete the ANCH-05 contract

---
*Phase: 07-deep-linkable-anchors*
*Completed: 2026-04-15*
