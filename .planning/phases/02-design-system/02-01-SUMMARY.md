---
phase: 02-design-system
plan: 01
subsystem: design-system/css-foundation
tags: [fonts, design-tokens, css, playwright, e2e-tests]
dependency_graph:
  requires: []
  provides:
    - Self-hosted Inter and Fira Code fonts via Fontsource
    - DEVLIOT brand CSS custom properties on :root
    - Playwright E2E test infrastructure with Chromium
    - Design-system test stubs (11 tests) for Plan 02 to satisfy
  affects:
    - All Lit components that consume --font-family, --font-family-mono, --color-accent
    - Plan 02-02 (component updates) depends on these tokens being in place
tech_stack:
  added:
    - "@fontsource/inter@5.2.8 — self-hosted Inter webfont (400, 600)"
    - "@fontsource/fira-code@5.2.7 — self-hosted Fira Code webfont (400)"
    - "@playwright/test@1.59.1 — E2E test framework with Chromium"
  patterns:
    - Fontsource @import in CSS (Option B: direct CSS import, no JS)
    - CSS custom properties on :root for global design tokens
    - Playwright webServer integration with Vite dev server
key_files:
  created:
    - src/styles/fonts.css
    - playwright.config.ts
    - tests/design-system.spec.ts
  modified:
    - package.json (added fontsource deps, @playwright/test, test-e2e script)
    - package-lock.json
    - src/styles/reset.css (brand tokens, pre/code global styles)
    - index.html (added fonts.css link)
decisions:
  - "Fontsource CSS @import (Option B) chosen over JS import — simpler, no Vite plugin needed, resolves at build time"
  - "Global pre/code styles placed in reset.css (not fonts.css) to separate concerns: reset owns layout/color tokens, fonts.css owns @font-face declarations"
  - "Playwright baseURL set to http://localhost:5173/devliot/ matching Vite base: '/devliot/' — required for SPA routing to resolve correctly"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-04-10"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 4
---

# Phase 02 Plan 01: CSS Foundation — Fonts, Design Tokens, and Playwright Summary

**One-liner:** Self-hosted Inter/Fira Code via Fontsource + DEVLIOT brand tokens (#0077b6, #f8f9fa, #1a1a1a) + 11 Playwright E2E test stubs wired to Vite dev server.

## What Was Built

### Task 1: Fontsource packages and fonts.css (commit 3c4253b)

Installed `@fontsource/inter` and `@fontsource/fira-code` from npm. Created `src/styles/fonts.css` with three `@import` declarations (Inter 400, Inter 600, Fira Code 400). Linked `fonts.css` after `reset.css` in `index.html`. Vite resolves the CSS imports at build time and emits all font asset files (`woff2`, `woff`) into `dist/assets/`. No CDN or external font requests.

### Task 2: Reset.css brand tokens (commit 7ca8af3)

Replaced Phase 1 skeleton values in `src/styles/reset.css` with the full DEVLIOT brand token set:

| Token | Old | New |
|-------|-----|-----|
| `--color-accent` | `#0000ee` | `#0077b6` |
| `--color-surface-alt` | `#f5f5f5` | `#f8f9fa` |
| `--color-text` | (absent) | `#1a1a1a` |
| `--color-text-muted` | (absent) | `#666666` |
| `--font-family` | `system-ui, ...` | `'Inter', system-ui, ...` |
| `--font-family-mono` | (absent) | `'Fira Code', 'Courier New', monospace` |
| `--breakpoint-tablet` | (absent) | `768px` |
| `--breakpoint-desktop` | (absent) | `1280px` |

Added global `pre, code` rules with monospace font family, light gray background (`var(--color-surface-alt)`), and horizontal scroll (`overflow-x: auto`) for code blocks. Body `color` tokenized to `var(--color-text)`.

### Task 3: Playwright infrastructure and test stubs (commit 3b8e71d)

Installed `@playwright/test` and downloaded Chromium browser. Created `playwright.config.ts` pointing to Vite dev server at `http://localhost:5173/devliot/`. Created `tests/design-system.spec.ts` with 11 test stubs across three describe blocks:

- **BRAND-01** (2 tests): ASCII logo `pre[aria-label="DEVLIOT"]` visible in header and home page
- **BRAND-02** (3 tests): Inter body font, Fira Code code font, `rgb(0, 119, 182)` accent color on links
- **INFRA-05** (6 tests): no horizontal overflow at mobile/tablet/desktop, sticky header, 720px max-width, hamburger visibility toggle

All 11 tests listed via `npx playwright test --list`. Tests intentionally fail until Plan 02 implements the components.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` exits 0 | PASS — 43 font assets + CSS/JS bundles emitted |
| `npx playwright test --list` shows all stubs | PASS — 11 tests in 1 file |
| `--color-accent: #0077b6` in reset.css | PASS |
| No CDN font references in any file | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The 11 E2E tests in `tests/design-system.spec.ts` are intentional stubs that will fail when run against the current site. This is by design — Plan 02-02 implements the components that make them pass. The stubs are not data-rendering stubs; they are test assertions waiting for implementation.

## Threat Flags

No new trust boundaries introduced. CSS files and npm packages from the public registry. No network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

Files exist:
- src/styles/fonts.css — FOUND
- src/styles/reset.css — FOUND (modified)
- playwright.config.ts — FOUND
- tests/design-system.spec.ts — FOUND
- index.html — FOUND (modified)

Commits exist:
- 3c4253b — FOUND (feat(02-01): install Fontsource packages and create fonts.css)
- 7ca8af3 — FOUND (feat(02-01): update reset.css with DEVLIOT brand design tokens)
- 3b8e71d — FOUND (feat(02-01): set up Playwright E2E infrastructure and design-system test stubs)
