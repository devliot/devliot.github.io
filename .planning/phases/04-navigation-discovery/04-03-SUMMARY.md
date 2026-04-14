---
phase: 04-navigation-discovery
plan: "03"
subsystem: search
tags: [search, flexsearch, e2e-tests, header, shadow-dom]
dependency_graph:
  requires: ["04-01", "04-02"]
  provides: ["NAV-01", "NAV-02", "NAV-03", "NAV-04"]
  affects: ["src/components/devliot-header.ts", "src/pages/devliot-home-page.ts", "tests/navigation-discovery.spec.ts"]
tech_stack:
  added: ["flexsearch (dynamic import, lazy-loaded)"]
  patterns: ["custom event (bubbles+composed) for cross-shadow communication", "debounced search with setTimeout 200ms", "AND filter logic (tag + search)", "Shadow DOM auto-piercing in Playwright"]
key_files:
  created:
    - tests/navigation-discovery.spec.ts
  modified:
    - src/components/devliot-header.ts
    - src/styles/header.css
    - src/pages/devliot-home-page.ts
decisions:
  - "Removed _searchQuery reactive state — the search value is fully owned by the header; home page only needs the match slugs"
  - "Tag chip toggle: clicking active chip calls _setActiveTag(null) to deactivate, not re-activate"
  - "search-data.json is gitignored (generated at build time); worktree needs local generation before tests"
metrics:
  duration: "~16 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  files_changed: 4
---

# Phase 4 Plan 03: Search + E2E Tests Summary

**One-liner:** FlexSearch lazy-loaded in header with expandable input, devliot-search custom event crosses shadow boundaries, AND-logic tag+search filtering, 30 E2E tests covering NAV-01 through NAV-04 all green.

## What Was Built

### Task 1: Search Input in Header + FlexSearch Integration

**`src/components/devliot-header.ts`** — Added expandable search UI:
- `@state() _searchOpen` toggles the input visibility
- SVG magnifier icon button with `aria-expanded`, `aria-label="Search articles"`, min 44×44px touch target
- Input with `role="search"`, `aria-label`, focus-on-open, Escape-to-close
- `_dispatchSearch(query)` fires `devliot-search` custom event with `bubbles: true, composed: true`

**`src/styles/header.css`** — Added search container styles:
- `.header-actions` flexbox group for search + hamburger
- `.search-btn` with `min-width: 44px; min-height: 44px` (touch target)
- `.search-input` transitions `width 0.2s ease` from 0 to 180px (240px on desktop)
- `.search-container--open .search-input` activates the expanded state

**`src/pages/devliot-home-page.ts`** — Added FlexSearch integration:
- `@state() _searchMatchSlugs: Set<string> | null` — null means no active search
- `_initSearch()` lazy-loads FlexSearch `Document` and `search-data.json` on first query
- Index covers `title` (forward tokenize), `body` (strict), `tags` (strict)
- `_onSearch` handler listens on `document` for `devliot-search` event with 200ms debounce
- `_filteredArticles` getter applies tag filter then search filter (AND logic)
- URL `/#/?q=term` triggers search on page load via `_initSearch()` after 100ms delay

### Task 2: E2E Tests for All Phase 4 Requirements

**`tests/navigation-discovery.spec.ts`** — 11 tests covering NAV-01 through NAV-04:
- NAV-01: filter chip click shows matching articles, aria-pressed state, accessibility attributes
- NAV-01: clicking active chip deactivates filter (toggle behavior)
- NAV-02: articles in reverse chronological order
- NAV-03: tag click on article page navigates home with filter, direct URL activation
- NAV-04: search icon expand/collapse, aria-expanded attribute
- NAV-04: typing filters articles in real time (after 500ms debounce wait)
- NAV-04: nonsense query shows empty state "No articles found."
- NAV-04: Escape key collapses and clears search
- D-10: nonexistent tag filter shows empty state

**Final result: 30 tests pass (19 pre-existing + 11 new), 0 failures.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error: `_searchQuery` declared but never read**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** Plan specified `@state() private _searchQuery = ''` but the value was only set, never read in the template. TypeScript TS6133 error.
- **Fix:** Removed the `@state()` declaration entirely; search value is owned by the header component, not the home page. Removed the corresponding assignments in `_onSearch` and `_fetchArticles`.
- **Files modified:** `src/pages/devliot-home-page.ts`
- **Commit:** `4130b24`

**2. [Rule 1 - Bug] Fixed TypeScript error: EventListener cast ambiguity**
- **Found during:** Task 1 verification
- **Issue:** `this._onSearch as EventListener` gave TS2352 because `CustomEvent<{query}>` and `Event` don't overlap sufficiently.
- **Fix:** Cast via `unknown` first: `this._onSearch as unknown as EventListener`
- **Files modified:** `src/pages/devliot-home-page.ts`
- **Commit:** `4c9a217`

**3. [Rule 1 - Bug] Fixed tag chip toggle behavior**
- **Found during:** Task 2 E2E test run (NAV-01 deactivate test failed)
- **Issue:** Clicking an already-active chip called `_setActiveTag(tag)` which re-set the same tag instead of deactivating it. `aria-pressed` stayed `"true"`.
- **Fix:** Added toggle logic: `const next = (tag !== null && this._activeTag === tag) ? null : tag`
- **Files modified:** `src/pages/devliot-home-page.ts`
- **Commit:** `2f85100`

**4. [Rule 3 - Blocking] Dev server port reuse served stale code**
- **Found during:** Task 2 test run — search button not found (timeout)
- **Issue:** An existing dev server from the main repo (`/Users/eliott/dev/devliot`) was running on port 5173. `reuseExistingServer: true` caused Playwright to connect to the old server serving unmodified `devliot-header.ts` without the search button.
- **Fix:** Killed the stale dev server process; worktree tests started their own server from the worktree directory, serving the updated code.
- **Commit:** No commit (runtime environment fix)

**5. [Rule 3 - Blocking] `search-data.json` missing from worktree public directory**
- **Found during:** Task 2 test run — "NAV-04: search with no results" empty state not appearing
- **Issue:** `scripts/build-search-index.mjs` had been run in the main repo, writing to `/Users/eliott/dev/devliot/public/search-data.json`. The worktree's `public/` is separate, so `search-data.json` was absent. FlexSearch init silently failed, `_searchMatchSlugs` was never set, empty state never rendered.
- **Fix:** Ran `node scripts/build-search-index.mjs` from the worktree directory to generate the file locally. The file is gitignored (generated at build time).
- **Commit:** No commit (gitignored generated file)

## Known Stubs

None — FlexSearch is fully wired to live `search-data.json`, the search event pipeline is complete end-to-end, and article filtering is working.

## Threat Flags

No new security surface beyond what was planned in the threat model. All search input flows through `FlexSearch.search()` (plain text query, no execution). Template rendering uses Lit's auto-escaping `${}` interpolation — no `unsafeHTML` on search-derived data.

## Self-Check: PASSED

All key files present. All commits verified:
- `4c9a217` feat(04-03): add search icon + FlexSearch integration
- `2f85100` feat(04-03): E2E tests for NAV-01 through NAV-04 + toggle fix
- `4130b24` fix(04-03): remove stray _searchQuery reference after state refactor
