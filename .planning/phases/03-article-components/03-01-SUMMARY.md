---
phase: 03-article-components
plan: "01"
subsystem: article-rendering
tags: [lit, fetch, unsafeHTML, katex, shiki, mermaid, chart.js, css-counters, heading-anchors]
dependency_graph:
  requires: []
  provides: [article-renderer, article-css, code-css, phase3-deps]
  affects: [devliot-article-page, src/styles/article.css, src/styles/code.css]
tech_stack:
  added: [shiki@4.0.2, katex@0.16.45, mermaid@11.14.0, chart.js@4.5.1, "@observablehq/plot@0.6.17"]
  patterns: [fetch-then-unsafeHTML, CSS-counters-figure-numbering, DOM-walk-heading-anchors, slug-validation-path-traversal]
key_files:
  created:
    - src/styles/code.css
    - public/articles/.gitkeep
  modified:
    - src/pages/devliot-article-page.ts
    - src/styles/article.css
    - src/main.ts
    - package.json
    - package-lock.json
decisions:
  - "Slug validated with /^[a-zA-Z0-9_-]+$/ regex before fetch URL construction (T-03-02 path traversal mitigation)"
  - "PropertyValues used without generic parameter to accommodate @state private properties in willUpdate/updated"
  - "KaTeX CSS imported in main.ts before app import so it is available globally when components render"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 7
---

# Phase 03 Plan 01: Article Renderer Foundation Summary

**One-liner:** Fetch-based HTML article renderer with unsafeHTML injection, CSS counter figure numbering, hover-reveal heading anchors with clipboard copy, and all five Phase 3 content library dependencies installed.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install Phase 3 dependencies and configure KaTeX CSS | 5893334 | package.json, src/main.ts, public/articles/.gitkeep |
| 2 | Evolve devliot-article-page into fetch-based HTML renderer | b1f5007 | src/pages/devliot-article-page.ts, src/styles/article.css, src/styles/code.css |

---

## What Was Built

### devliot-article-page (src/pages/devliot-article-page.ts)

Replaced the placeholder stub with a complete generic HTML renderer:

- **Fetch pipeline:** `willUpdate` detects slug changes, calls `_loadArticle()` which fetches `${BASE_URL}articles/${slug}.html`. Sets `_html` on 200 OK, sets `_error = 'Article not found.'` on 404, sets `_error = 'Could not load article. Check your connection and try again.'` on network error.
- **Slug validation:** `/^[a-zA-Z0-9_-]+$/` guard before URL construction — rejects path traversal (`..`, `/`, special chars).
- **Heading anchors:** `_injectHeadingAnchors()` runs after `updateComplete` resolves on first `_html` population. Queries `h2–h6`, generates kebab-case IDs, prepends a `.heading-anchor` `<a>` element that copies `?section={id}` URL to clipboard on click.
- **Deep link restore:** `_scrollToSectionFromUrl()` reads `?section=` param from `window.location.search` and scrolls to matching heading ID.
- **Error render:** `<article class="error-state"><p>{message}</p></article>` — centered muted text per UI-SPEC.
- **Styles:** Combined `[unsafeCSS(articleStyles), unsafeCSS(codeStyles)]` array.

### src/styles/article.css

Expanded from a 20-line stub to a full article typography stylesheet:

- `counter-reset: figures` on `article`, `counter-increment: figures` on `figure`
- `figcaption::before` produces `"Figure N: "` prefix via CSS counters (`--color-accent`, weight 600)
- `.heading-anchor` positioned absolute at `left: -1.5em`, `opacity: 0` default, `opacity: 1` on heading hover or anchor focus
- Major content blocks (`figure`, `pre`, `devliot-*`) get `margin-top/bottom: var(--space-xl)` (32px)
- Paragraph spacing: `margin-bottom: var(--space-md)` (16px)
- Sub-headings: h2/h3 at 20px semibold with `margin-top: var(--space-2xl)` (48px)

### src/styles/code.css (new)

Base `pre` block styles — `font-family: var(--font-family-mono)`, `font-size: var(--font-size-label)`, `background-color: var(--color-surface-alt)`, `overflow-x: auto` — shared by `devliot-code` in Plan 02.

### src/main.ts

Added `import 'katex/dist/katex.min.css'` before app import so KaTeX renders correctly when `devliot-math` components are used inside article HTML.

### public/articles/.gitkeep

Directory created for static article HTML files served by Vite/GitHub Pages.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript verbatimModuleSyntax type import error**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** `PropertyValues` imported as a value import but tsconfig has `verbatimModuleSyntax` enabled — requires `import type` for type-only imports.
- **Fix:** Split import into `import { LitElement, html, unsafeCSS } from 'lit'` and `import type { PropertyValues } from 'lit'`.
- **Files modified:** src/pages/devliot-article-page.ts
- **Commit:** b1f5007

**2. [Rule 1 - Bug] Fixed PropertyValues generic parameter causing type error on private @state property**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** `PropertyValues<this>` generic resolves to public interface keys only; `'_html'` is a private `@state` property not in the public interface, causing TS2345.
- **Fix:** Changed `PropertyValues<this>` to unparameterized `PropertyValues` in both `willUpdate` and `updated` signatures.
- **Files modified:** src/pages/devliot-article-page.ts
- **Commit:** b1f5007

**3. [Rule 2 - Security] Added slug validation for path traversal prevention (T-03-02)**
- **Found during:** Task 2 threat model review
- **Issue:** Threat register T-03-02 has `disposition: mitigate` — slug must be validated before constructing fetch URL.
- **Fix:** Added `SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/` constant; `_loadArticle()` returns `'Article not found.'` immediately if slug fails validation.
- **Files modified:** src/pages/devliot-article-page.ts
- **Commit:** b1f5007

---

## Known Stubs

None — article renderer is fully wired. Content loads from `public/articles/{slug}.html` via fetch. The `public/articles/.gitkeep` placeholder is intentional infrastructure (directory marker), not a data stub — article HTML files are authored content added per-article, not auto-generated.

---

## Threat Flags

None — all surfaces introduced in this plan are covered by the plan's threat model (T-03-01 through T-03-03). No new unmodeled attack surface introduced.

---

## Self-Check: PASSED

Files exist:
- src/pages/devliot-article-page.ts: FOUND
- src/styles/article.css: FOUND
- src/styles/code.css: FOUND
- public/articles/.gitkeep: FOUND

Commits exist:
- 5893334: FOUND (feat(03-01): install Phase 3 dependencies and configure KaTeX CSS)
- b1f5007: FOUND (feat(03-01): evolve devliot-article-page into fetch-based HTML renderer)
