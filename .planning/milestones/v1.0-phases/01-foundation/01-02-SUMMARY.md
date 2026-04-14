---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [lit, web-components, hash-router, spa-routing, shadow-dom]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: "Vite + Lit project scaffold, entry point, CSS reset with design tokens"
provides:
  - "Custom HashRouter reactive controller for hash-based SPA routing"
  - "App shell with header/footer/router-outlet layout"
  - "Home page placeholder with hero section"
  - "Article page stub with slug display"
  - "404 fallback for unmatched routes"
affects: [content-rendering, article-system, search, navigation]

# Tech tracking
tech-stack:
  added: []
  patterns: [hash-based-spa-routing, reactive-controller, external-css-inline-import, shadow-dom-components]

key-files:
  created:
    - src/utils/hash-router.ts
    - src/components/devliot-header.ts
    - src/components/devliot-footer.ts
    - src/pages/devliot-home-page.ts
    - src/pages/devliot-article-page.ts
    - src/styles/app.css
    - src/styles/header.css
    - src/styles/footer.css
    - src/styles/home.css
    - src/styles/article.css
  modified:
    - src/devliot-app.ts
    - src/vite-env.d.ts

key-decisions:
  - "D-05 deviation: custom HashRouter controller instead of @lit-labs/router due to hash routing bug (#3517)"
  - "External CSS via ?inline + unsafeCSS() pattern for all components (D-03)"
  - "Shadow DOM for all components (D-04, Lit default)"

patterns-established:
  - "HashRouter reactive controller: listen to hashchange, strip #, match route patterns with :param support"
  - "Component CSS pattern: external .css file imported via ?inline, applied with unsafeCSS()"
  - "Component structure: LitElement + @customElement decorator + static styles + render()"
  - "Design tokens: all CSS uses var(--token) custom properties from reset.css"

requirements-completed: [INFRA-01, INFRA-04]

# Metrics
duration: N/A
completed: 2026-04-10
---

# Plan 02: App Shell & Hash Router Summary

**Custom HashRouter reactive controller with app shell layout, header/footer components, home page hero, and article page stub — full hash-based SPA routing with 404 fallback**

## Performance

- **Duration:** Across multiple sessions
- **Completed:** 2026-04-10
- **Tasks:** 4 (1 decision checkpoint, 2 auto tasks, 1 human verification)
- **Files created:** 10
- **Files modified:** 2

## Accomplishments
- Custom HashRouter reactive controller (~50 lines) replacing @lit-labs/router due to hash routing bug #3517
- App shell with flex column layout: header + router outlet + footer
- Two routes: `/` (home) and `/article/:slug` (article stub) with 404 fallback
- All components use external CSS via `?inline` + `unsafeCSS()` pattern with design token custom properties
- Browser back/forward navigation works via hashchange event listener

## Task Commits

Each task was committed atomically:

1. **Task 0: Confirm D-05 routing deviation** - Decision checkpoint (custom-controller selected)
2. **Task 1: Implement HashRouter and replace app shell** - `f6c325c` (feat)
3. **Task 2: Create header, footer, home page, article page** - `528d76e` (feat)
4. **Task 3: Verify routing in browser** - Human verification (approved)

## Files Created/Modified
- `src/utils/hash-router.ts` - Custom HashRouter reactive controller with hashchange listener, route matching, 404 fallback
- `src/devliot-app.ts` - App shell with header, router outlet, footer; routes for / and /article/:slug
- `src/components/devliot-header.ts` - Site header with DEVLIOT title linking to /#/
- `src/components/devliot-footer.ts` - Site footer with copyright
- `src/pages/devliot-home-page.ts` - Home page with hero section
- `src/pages/devliot-article-page.ts` - Article page stub displaying slug from route
- `src/styles/app.css` - App shell flex column layout
- `src/styles/header.css` - Header styling with design tokens
- `src/styles/footer.css` - Footer styling with design tokens
- `src/styles/home.css` - Home page hero styling
- `src/styles/article.css` - Article page styling
- `src/vite-env.d.ts` - Added *.css?inline module declaration

## Decisions Made
- Used custom HashRouter controller instead of @lit-labs/router (D-05 deviation) due to confirmed hash routing bug (#3517). Implements D-05's functional intent identically.
- All components use Shadow DOM (Lit default) per D-04
- External CSS imported via `?inline` query + `unsafeCSS()` per D-03

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell and routing complete, ready for content rendering (Phase 2+)
- Article page stub ready to be replaced with full article renderer
- Home page ready for article listing integration

---
*Phase: 01-foundation*
*Completed: 2026-04-10*
