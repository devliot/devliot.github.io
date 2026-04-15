---
phase: 07-deep-linkable-anchors
plan: "04"
subsystem: routing
tags: [path-router, history-api, spa-fallback, github-pages, playwright, lit, typescript]

requires:
  - phase: 07-deep-linkable-anchors
    plan: "03"
    provides: _scrollToSectionFromUrl with replaceState/miss-strip, popstate listener reading from window.location.search

provides:
  - Path-based SPA router (PathRouter) replacing HashRouter — article URLs are /article/{slug}, section deep links are /article/{slug}?section={id}, no hash fragment (D-11, D-12)
  - GitHub Pages SPA fallback via dist/404.html copied from dist/index.html at build time
  - OG page redirects emit path URLs instead of hash URLs
  - Clean-cut migration — no legacy hash redirect shim (D-13)

affects:
  - All internal navigation (home tag chips, header logo, article links, OG redirect script)
  - All Playwright specs (4 test files rewritten for path-based URL assertions)

tech-stack:
  added: []
  removed:
    - src/utils/hash-router.ts (renamed → path-router.ts)
  patterns:
    - "PathRouter ReactiveController uses window.location.pathname + URLSearchParams and history.pushState"
    - "Vite appType: 'spa' for dev-server SPA fallback"
    - "dist/404.html = cp dist/index.html in build script for GitHub Pages SPA fallback"

key-files:
  created:
    - src/utils/path-router.ts
  modified:
    - src/devliot-app.ts
    - src/pages/devliot-home-page.ts
    - src/pages/devliot-article-page.ts
    - src/components/devliot-header.ts
    - scripts/build-og-pages.mjs
    - vite.config.ts
    - package.json
    - tests/deep-linkable-anchors.spec.ts
    - tests/navigation-discovery.spec.ts
    - tests/article-components.spec.ts
    - tests/article-metadata.spec.ts
    - public/articles/index.json
  deleted:
    - src/utils/hash-router.ts

key-decisions:
  - "Clean-cut migration per D-13 — no redirect shim from /#/article/{slug} to /article/{slug}. External backlinks to the old hash format will 404 and that is accepted (pre-launch, no live audience yet)."
  - "HashRouter was renamed (not deleted-then-created) to PathRouter per git semantics — 62% similarity preserves history blame for routing logic that is conceptually the same controller, just reading from pathname instead of hash."
  - "Vite SPA fallback: appType: 'spa' in vite.config.ts handles dev-server, and cp dist/index.html dist/404.html handles GitHub Pages production. No server-side rewrites needed."
  - "OG page redirect script changed from window.location.replace(\"/#/article/...\") to window.location.replace(\"/article/...\") — crawlers/bookmarks of the OG URL land on the same path route the SPA uses."
  - "Worktree-only playwright.worktree.config.ts deviation was reverted on main — it was an executor hack to run Playwright on port 51378 to avoid conflicting with the main dev server during self-verification. Not part of plan scope and not needed on main."

requirements-completed:
  - ANCH-01 (re-validated in path-URL shape)
  - ANCH-02 (re-validated in path-URL shape)
  - ANCH-03 (re-validated in path-URL shape)
  - ANCH-04 (re-validated in path-URL shape)
  - ANCH-05 (re-validated in path-URL shape)

duration: ~45min
completed: "2026-04-15"
---

# Phase 07 Plan 04: Path-based Routing Migration Summary

**App migrated from hash-based SPA routing (`/#/article/{slug}`) to path-based routing (`/article/{slug}`) — section deep links become `/article/{slug}?section={id}` with no hash fragment. All 47 Playwright tests pass on main after rebuild.**

## Performance

- **Tasks:** 5 (4 auto + 1 human-verify checkpoint)
- **Files created:** 1 (PathRouter)
- **Files modified:** 12
- **Files deleted:** 1 (HashRouter — renamed to PathRouter)
- **Commits:** 4 feat/test + 1 cleanup + this docs commit

## Accomplishments

- **Task 1** — Created `src/utils/path-router.ts` (PathRouter ReactiveController) replacing HashRouter. Wired it into `src/devliot-app.ts`. URL parsing reads from `window.location.pathname` + `URLSearchParams(window.location.search)` instead of `window.location.hash`.
- **Task 2** — Migrated all internal navigation to path URLs:
  - `devliot-home-page.ts`: tag filter chips use `history.pushState` with `/?tag={name}` (no hash)
  - `devliot-header.ts`: logo/home link uses `/` (no `/#/`)
  - `devliot-article-page.ts`: article internal links use `/article/{slug}` format
- **Task 3** — Added SPA fallback infrastructure:
  - `vite.config.ts`: `appType: 'spa'` for dev-server SPA fallback
  - `package.json`: build script appends `cp dist/index.html dist/404.html` for GitHub Pages SPA fallback
  - `scripts/build-og-pages.mjs`: OG redirect script emits path URLs
- **Task 4** — Rewrote Playwright test URL assertions across 4 spec files to use path format (`/article/{slug}?section={id}` instead of `/?section={id}#/article/{slug}`). Test suite passes 47/47.
- **Task 5** — Human visual verification: all 10 checks passed on http://localhost:5173 after full rebuild (home root, article path URLs, header logo, hover scope, click-to-URL, sticky offset, back/forward, deep-link load, missing strip, tag filter).

## Task Commits

1. **Task 1: Create PathRouter and wire it into devliot-app.ts** — `0e90850` (feat)
2. **Task 2: Migrate internal hash-links and hash-reading code to path URLs** — `638972e` (feat)
3. **Task 3: Add SPA fallback, update build script, and configure Vite** — `d916a75` (feat)
4. **Task 4: Rewrite Playwright test URLs from hash format to path format** — `c3156fc` (test)
5. **Task 5: Human visual verification** — approved by user (no code commit; this SUMMARY documents the outcome)

Orchestrator cleanup commit:
- `e785217` — chore(07-04): remove worktree-only playwright config artifact (executor deviation)

## Files Created/Modified

**Created:**
- `src/utils/path-router.ts` — new PathRouter ReactiveController

**Modified:**
- `src/devliot-app.ts` — imports PathRouter, configures routes with path patterns
- `src/pages/devliot-home-page.ts` — tag chip navigation uses path URLs
- `src/pages/devliot-article-page.ts` — internal article links use path URLs
- `src/components/devliot-header.ts` — logo link uses path URL
- `scripts/build-og-pages.mjs` — OG redirect script uses path URLs
- `vite.config.ts` — appType: 'spa'
- `package.json` — build script appends `cp dist/index.html dist/404.html`
- `tests/deep-linkable-anchors.spec.ts` — path-URL assertions
- `tests/navigation-discovery.spec.ts` — path-URL assertions
- `tests/article-components.spec.ts` — path-URL assertions
- `tests/article-metadata.spec.ts` — path-URL assertions (META-01 expects new redirect string)
- `public/articles/index.json` — pretty-printed reformatting (pre-existing main-tree edit that matched worktree output)

**Deleted:**
- `src/utils/hash-router.ts` — renamed to path-router.ts (git rename R062)

## Decisions Made

- Clean-cut migration (D-13): no redirect shim from old `/#/article/{slug}` URLs. Pre-launch, no live audience, cost of cruft not worth it.
- PathRouter as a rename (not a wholesale new file) preserves git blame for routing controller logic. Only the URL-reading source (`pathname` vs `hash`) changed; the ReactiveController pattern and route-matching remained the same.
- SPA fallback split across dev-server (`appType: 'spa'` in Vite) and production (`cp dist/index.html dist/404.html` in build script). GitHub Pages serves `404.html` for unmatched paths, which loads the SPA and lets client-side routing take over.
- The popstate and `_scrollToSectionFromUrl` logic from plan 07-03 did NOT need to change — they already read from `window.location.search`, which survives the migration unchanged. The anchor contract from waves 1-3 is router-agnostic.

## Deviations from Plan

- **`playwright.worktree.config.ts`** — executor added this file inside the worktree to run Playwright on port 51378 (avoiding conflict with the main dev server on 5173 during self-verification). It was not in the plan's `files_modified` list and not needed on main. Orchestrator removed it in commit `e785217` post-merge.
- **Post-merge rebuild required** — after the worktree merged into main, `dist/` was stale (OG pages still referenced hash URLs). Running `npm run build` regenerated OG pages with path URLs, after which META-01 passed. This is expected — the test reads from `dist/` and `dist/` is a build artifact, not a tracked source. Added a mental note: future plans touching `build-og-pages.mjs` should include a rebuild step in verification.

## Issues Encountered

- **First post-merge test run showed META-01 failing** because `dist/` was not regenerated after the merge. `npm run build` fixed it. Root cause: the executor ran `npm run build` inside its worktree (producing correct dist) but the `dist/` directory is in `.gitignore`, so it did not come across with the merge. Resolution documented above.

## User Setup Required

None — the migration is transparent end-to-end. Old hash URLs will 404 (D-13, accepted).

## Human Verification Outcome

All 10 visual checks from the checkpoint task passed on http://localhost:5173:

1. Home at root path `/` — PASS
2. Article link uses path URL — PASS
3. Header logo navigates home via path — PASS
4. Hover-reveal scope (ANCH-05) — PASS
5. Click-to-URL with path format (ANCH-01) — PASS
6. Sticky header offset (ANCH-03) — PASS
7. Back/forward between sections (ANCH-04) — PASS
8. Deep-link load with path URL (ANCH-02) — PASS
9. Missing target silent strip (D-08) — PASS
10. Tag filtering uses path URL — PASS

## Next Phase Readiness

Phase 07 is complete. All ANCH-01..05 requirements are GREEN in the final path-URL shape. The migration is the last piece of Milestone v2.0's "Deep links" section — sticky-header-aware section anchors with clean, shareable URLs. Ready for phase verification and downstream milestone work (épuration UI, attribution, discovery).

---
*Phase: 07-deep-linkable-anchors*
*Completed: 2026-04-15*
