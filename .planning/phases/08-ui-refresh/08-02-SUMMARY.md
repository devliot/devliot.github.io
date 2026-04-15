---
phase: "08"
plan: "02"
subsystem: ui-chrome
tags: [lit, css-tokens, header, playwright, variant, scroll-shadow]
dependency_graph:
  requires: ["08-01"]
  provides: [variant-aware header, scroll-shadow, French labels, repaired test suite]
  affects:
    - src/components/devliot-header.ts
    - src/styles/header.css
    - src/devliot-app.ts
    - tests/design-system.spec.ts
    - tests/navigation-discovery.spec.ts
tech_stack:
  added: []
  patterns:
    - "@property({ reflect: true }) for CSS :host([attr]) selectors — first use in project"
    - "type-only import from @lit/reactive-element for PropertyValues"
    - "passive scroll listener in connectedCallback/disconnectedCallback (follows devliot-chart.ts pattern)"
    - "inline variant computation in render() from window.location.pathname"
key_files:
  created: []
  modified:
    - src/components/devliot-header.ts
    - src/styles/header.css
    - src/devliot-app.ts
    - tests/design-system.spec.ts
    - tests/navigation-discovery.spec.ts
decisions:
  - "PropertyValues imported as type-only from @lit/reactive-element (not from lit barrel — not re-exported in this Vite bundle)"
  - "willUpdate() used for search state reset on variant change — defensive but costs nothing"
  - "scroll threshold is window.scrollY > 0 (no buffer) — 0.2s CSS transition handles sub-pixel bounce"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
---

# Phase 8 Plan 02: Header Variant System + Test Repairs Summary

**One-liner:** Variant-aware header (home=search-only, article=logo-only) with scroll-activated shadow and French labels, wired from devliot-app pathname, with all 6 known test breakages repaired.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Refactor devliot-header.ts with variant rendering, scroll shadow, French labels | 5ae7ce7 | src/components/devliot-header.ts, src/styles/header.css |
| 2 | Wire variant from devliot-app and repair all broken tests | 8388c23 | src/devliot-app.ts, tests/design-system.spec.ts, tests/navigation-discovery.spec.ts |

---

## What Was Built

### Task 1: Header variant system + CSS

**src/components/devliot-header.ts:**
- Added `@property({ type: String, reflect: true }) variant: 'home' | 'article' = 'home'` — enables `:host([variant="..."])` CSS selectors
- Added `@property({ type: Boolean, reflect: true }) scrolled = false` — enables `:host([scrolled])` CSS selector for scroll shadow
- Added passive scroll listener in `connectedCallback`/`disconnectedCallback` (follows devliot-chart.ts pattern)
- Added `willUpdate()` to reset `_searchOpen`/`_searchValue` when leaving home variant
- Split `render()` into variant-conditional templates:
  - `home`: search affordance only (collapsible toggle, no logo, no hamburger)
  - `article`: DEVLIOT ASCII logo only (left-aligned, links to `/`, no search, no hamburger)
- Removed hamburger button entirely (D-09)
- Updated search placeholder to `Rechercher un article…` and aria-labels to French (D-05)

**src/styles/header.css:**
- Changed `background-color` from `var(--color-surface-alt)` to `var(--color-surface)` (white)
- Added `box-shadow: none; transition: box-shadow 0.2s ease` to `:host`
- Added `:host([scrolled]) { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }`
- Added `:host([variant="home"]) { justify-content: flex-end; }`
- Added `:host([variant="article"]) { justify-content: flex-start; }`
- Removed all `.menu-toggle` rules (`.menu-toggle`, `.menu-toggle:hover`, `@media min-width:1280px`)

### Task 2: Variant wiring + test repairs

**src/devliot-app.ts:**
- Added inline variant computation in `render()`: `const variant = window.location.pathname === '/' ? 'home' : 'article'`
- Passes `variant="${variant}"` to `<devliot-header>`
- ResizeObserver pipeline in `firstUpdated()` is UNCHANGED (D-10)

**tests/design-system.spec.ts (4 tests repaired):**
- "header logo": changed navigation from `/` to `/article/01-demo-article` + waitForSelector
- "code font": changed navigation from `/` to `/article/01-demo-article` + waitForSelector
- "accent color": changed navigation from `/` to `/article/01-demo-article` + waitForSelector
- "hamburger button": deleted entire test block (D-09, hamburger removed from both variants)

**tests/navigation-discovery.spec.ts (2 assertions repaired):**
- Line 133: `'Search articles'` → `'Rechercher des articles'`
- Line 143: `'Search articles'` → `'Rechercher un article'`

---

## Verification Results

| Suite | Pass | Fail | Notes |
|-------|------|------|-------|
| tests/ui-refresh.spec.ts | 8 | 0 | All 8 RED stubs now GREEN |
| tests/design-system.spec.ts | 9 | 0 | 3 updated (article nav), 1 deleted (hamburger) |
| tests/navigation-discovery.spec.ts | 9 | 1 | 1 pre-existing failure (NAV-04 empty state) |
| tests/deep-linkable-anchors.spec.ts | 6 | 0 | D-10 ResizeObserver pipeline intact |
| tests/article-components.spec.ts | 8 | 0 | No regression |
| tests/article-metadata.spec.ts | 3 | 6 | 6 pre-existing failures (OG production-build tests) |
| **Total** | **47** | **7** | 7 pre-existing failures, 0 new failures |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `PropertyValues` not exported from `lit` barrel in this Vite bundle**
- **Found during:** Task 2 (first full test run)
- **Issue:** `import { PropertyValues } from 'lit'` caused a runtime SyntaxError: "The requested module '/node_modules/.vite/deps/lit.js?v=cd7ae829' does not provide an export named 'PropertyValues'". All tests failed with this error.
- **Root cause:** `PropertyValues` is a TypeScript type exported from `@lit/reactive-element`, re-exported in Lit's type declarations (`.d.ts`) but not present in the compiled JS barrel `lit/index.js` for this Vite pre-bundled version.
- **Fix:** Changed to `import type { PropertyValues } from '@lit/reactive-element'` — type-only import, erased at compile time, no runtime impact.
- **Files modified:** `src/components/devliot-header.ts` (line 3)
- **Commit:** 8388c23

---

## Known Stubs

None. All 8 RED test stubs from Plan 01 are now GREEN. No placeholder values or stub patterns introduced.

---

## Pre-existing Failures (out of scope)

| Test | File | Reason |
|------|------|--------|
| NAV-04: search with no results shows empty state | tests/navigation-discovery.spec.ts:172 | Pre-existing failure on base branch (documented in 08-01 SUMMARY). Requires FlexSearch empty-state implementation not yet built. |
| META-01: OG HTML page exists for demo article (+ 5 more) | tests/article-metadata.spec.ts:55-100 | Pre-existing failures — these tests require `npm run build` (production build) and a static file server. Dev server cannot serve pre-built OG HTML pages. |

These 7 failures existed on the base branch before this plan and are not regressions.

---

## Threat Flags

None. This plan modifies presentation logic only — no new network endpoints, no new auth paths, no new user input handlers, no schema changes. The `variant` attribute is set by `devliot-app` based on `window.location.pathname` (no user-controlled data flows through this path). The scroll listener reads `window.scrollY` only.

---

## Self-Check: PASSED

- [x] src/components/devliot-header.ts exists with variant property
- [x] src/styles/header.css exists with `:host([scrolled])` and variant rules
- [x] src/devliot-app.ts exists with variant computation
- [x] tests/design-system.spec.ts exists — hamburger test removed, 3 tests navigate to article page
- [x] tests/navigation-discovery.spec.ts exists — French aria-labels
- [x] Commit 5ae7ce7 exists (Task 1)
- [x] Commit 8388c23 exists (Task 2)
- [x] 47 tests pass, 7 pre-existing failures, 0 new failures
- [x] All 8 ui-refresh stubs GREEN
- [x] All 6 deep-linkable-anchor tests GREEN (D-10 preserved)
