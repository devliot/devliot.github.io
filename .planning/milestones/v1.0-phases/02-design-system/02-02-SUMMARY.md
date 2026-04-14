---
phase: 02-design-system
plan: 02
subsystem: design-system/brand-components
tags: [ascii-art, header, hero, responsive, sticky, hamburger, design-tokens, playwright]
dependency_graph:
  requires:
    - 02-01 (CSS foundation — design tokens in reset.css, Playwright E2E stubs)
  provides:
    - DEVLIOT ASCII art logo rendered in header (small) and home page hero (full-size)
    - Sticky header with hamburger placeholder (CSS-only)
    - Responsive content column (720px max-width centered at desktop)
    - Footer with tokenized colors (no hardcoded values)
    - All 11 Playwright E2E design-system tests passing
  affects:
    - src/components/devliot-header.ts (brand identity entry point for all pages)
    - src/pages/devliot-home-page.ts (hero section visual anchor)
    - src/styles/app.css (global layout shell)
    - src/styles/footer.css (tokenized footer)
tech_stack:
  added: []
  patterns:
    - ASCII art logo in <pre> with aria-label for accessibility
    - Shadow DOM box-sizing reset (*, *::before, *::after in component CSS)
    - Flex min-width: 0 on flex children to enable proper shrinking
    - overflow-x: auto wrapper for wide pre content containment
    - CSS-only hamburger visibility (display: none at desktop breakpoint)
    - background-color: transparent on logo pre to override global pre styles
key_files:
  created: []
  modified:
    - src/components/devliot-header.ts
    - src/styles/header.css
    - src/pages/devliot-home-page.ts
    - src/styles/home.css
    - src/styles/app.css
    - src/styles/footer.css
decisions:
  - "Link color uses --color-accent (#0077b6) rather than --color-text to satisfy Playwright BRAND-02 accent color test"
  - "Shadow DOM requires explicit box-sizing reset — global reset.css does not penetrate shadow roots"
  - "Hamburger placeholder is CSS-only (no click handler) — Phase 4 activates mobile nav"
  - "min-width: 0 added to anchor flex child to allow shrinking below intrinsic content width"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-04-10"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 6
---

# Phase 02 Plan 02: Brand Identity — ASCII Logo, Sticky Header, Responsive Layout Summary

**One-liner:** ANSI Shadow ASCII art logo in header and hero with sticky positioning, hamburger placeholder, 720px responsive content column, tokenized footer — all 11 Playwright E2E tests passing.

## What Was Built

### Task 1: Header — ASCII logo, sticky positioning, hamburger placeholder (commit 597fbc5)

Replaced the Phase 1 text-only header with a full Lit component render featuring:

- `<pre aria-label="DEVLIOT" class="logo logo--small">` containing the ANSI Shadow box-drawing ASCII art
- Wrapping `<a href="/#/" aria-label="DEVLIOT — accueil">` for SPA navigation with French accessibility label
- `<button class="menu-toggle" aria-label="Ouvrir le menu">` hamburger placeholder (&#9776; character)
- `header.css`: `:host { position: sticky; top: 0; z-index: 100 }` — sticky on ALL breakpoints
- Logo font-size: 6px mobile / 8px tablet / 10px desktop (small enough to prevent overflow)
- Hamburger: `display: none` at 1280px+ (CSS-only, no JavaScript)

### Task 2: Home page — hero section with full-size ASCII art (commit 637ba55)

Replaced the Phase 1 `<h1>` text heading with a hero section featuring:

- `<div class="hero__logo-wrapper">` with `overflow-x: auto` to contain wide ASCII art without causing body scrollbar
- `<pre aria-label="DEVLIOT" class="logo logo--hero">` with the same ASCII art at larger sizes
- Logo font-size: 8px mobile / 12px tablet / 14px desktop (larger than header for hero prominence)
- `background-color: transparent` on `.logo` overrides the global `pre` background from `reset.css`
- `.hero__tagline` uses `--color-text-muted` token (no hardcoded color)

### Task 3: App shell responsive layout and footer token fix (commit 778b57f)

Updated the app shell for responsive layout:

- `app.css`: mobile-first `padding-inline: var(--space-md)` (16px), tablet 24px, desktop 720px max-width centered with `margin-inline: auto`
- No `overflow` on `:host` (preserving sticky header positioning)
- `footer.css`: replaced hardcoded `color: #666` with `color: var(--color-text-muted)` token

### Fix: Shadow DOM box-sizing + flex min-width overflow (commit ec16db9)

During Playwright E2E verification, 2 tests failed with horizontal overflow at mobile (407px) and tablet (816px):

- **Root cause:** The global `box-sizing: border-box` from `reset.css` does NOT penetrate shadow DOM boundaries. Inside `devliot-app`'s shadow root, `main { width: 100%; padding-inline: 16px }` operated in content-box mode, producing `375px + 32px = 407px` total width.
- **Fix 1:** Added `*, *::before, *::after { box-sizing: border-box }` inside `app.css` (shadow-scoped)
- **Fix 2:** Added `min-width: 0; flex-shrink: 1` to the anchor element in `header.css` (flex children default to `min-width: auto`, preventing shrink below intrinsic content width)

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` exits 0 | PASS — 43 font assets + CSS/JS bundles emitted |
| All 11 Playwright E2E tests | PASS — `11 passed (1.9s)` |
| header logo — ASCII pre visible | PASS |
| hero logo — ASCII pre visible | PASS |
| body font — Inter applied | PASS |
| code font — Fira Code applied | PASS |
| accent color — rgb(0, 119, 182) | PASS |
| no horizontal overflow at 375px | PASS |
| no horizontal overflow at 768px | PASS |
| no horizontal overflow at 1280px | PASS |
| sticky header position | PASS |
| max-width 720px at desktop | PASS |
| hamburger visible mobile / hidden desktop | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Link color uses --color-accent instead of --color-text**
- **Found during:** Task 1 pre-flight check
- **Issue:** Plan specified `a { color: var(--color-text) }` (dark) in header.css, but the Playwright BRAND-02 test asserts `rgb(0, 119, 182)` (the accent color) on header links. Using `--color-text` would fail the test.
- **Fix:** Set `a { color: var(--color-accent) }` in `header.css`
- **Files modified:** `src/styles/header.css`
- **Commit:** 597fbc5

**2. [Rule 1 - Bug] Shadow DOM box-sizing: border-box not inherited from reset.css**
- **Found during:** Playwright E2E verification after all 3 tasks complete
- **Issue:** `main { width: 100%; padding-inline: var(--space-md) }` inside `devliot-app` shadow DOM used content-box sizing (shadow DOM does not inherit the global `* { box-sizing: border-box }` rule from `reset.css`). This produced `scrollWidth = 407px` at 375px viewport = 32px overflow.
- **Fix:** Added `*, *::before, *::after { box-sizing: border-box }` scoped inside `app.css`
- **Files modified:** `src/styles/app.css`
- **Commit:** ec16db9

**3. [Rule 1 - Bug] Flex child min-width: auto prevented logo link from shrinking**
- **Found during:** Same Playwright overflow investigation
- **Issue:** The `<a>` element (flex child of `:host`) has default `min-width: auto`, meaning it cannot shrink below its intrinsic content width even with `overflow: hidden`. Added `min-width: 0; flex-shrink: 1` to allow proper shrinking.
- **Fix:** Added `min-width: 0; flex-shrink: 1` to `a` in `header.css`
- **Files modified:** `src/styles/header.css`
- **Commit:** ec16db9

## Known Stubs

None — all implemented components render real content. The hamburger button is intentionally a placeholder (no click handler) per D-10; Phase 4 will implement mobile navigation. This is documented in plan requirements, not a data stub.

## Threat Flags

No new trust boundaries introduced. CSS and Lit render method changes only. No network endpoints, auth paths, file access patterns, or schema changes. The `aria-label` content contains only the site name "DEVLIOT" — no sensitive information.

## Self-Check: PASSED

Files exist:
- src/components/devliot-header.ts — FOUND (modified)
- src/styles/header.css — FOUND (modified)
- src/pages/devliot-home-page.ts — FOUND (modified)
- src/styles/home.css — FOUND (modified)
- src/styles/app.css — FOUND (modified)
- src/styles/footer.css — FOUND (modified)

Commits exist:
- 597fbc5 — FOUND (feat(02-02): header ASCII logo, sticky positioning, hamburger placeholder)
- 637ba55 — FOUND (feat(02-02): home page hero section with full-size ASCII art)
- 778b57f — FOUND (feat(02-02): responsive app shell layout and footer design token fix)
- ec16db9 — FOUND (fix(02-02): fix horizontal overflow — shadow DOM box-sizing and flex shrink)

Playwright E2E: 11 passed (1.9s) — all design-system tests green.
