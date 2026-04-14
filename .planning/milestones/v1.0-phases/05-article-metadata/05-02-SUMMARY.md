---
phase: 05-article-metadata
plan: "02"
subsystem: article-page
tags: [metadata-display, reading-time, publication-date, playwright-e2e, accessibility]
dependency_graph:
  requires: [05-01]
  provides: [article-metadata-line, playwright-meta-tests]
  affects: [src/pages/devliot-article-page.ts, src/styles/article.css, tests/article-metadata.spec.ts]
tech_stack:
  added: []
  patterns: [Intl.DateTimeFormat, UTC-pitfall-prevention, Lit-conditional-render, shadow-DOM-Playwright-piercing]
key_files:
  created:
    - tests/article-metadata.spec.ts
  modified:
    - src/pages/devliot-article-page.ts
    - src/styles/article.css
decisions:
  - "Metadata line rendered as <p class='article-meta'> outside <article> but before it — aligns with article padding via matching padding-left/padding-right"
  - "Date formatted using Intl.DateTimeFormat('en-US') with T12:00:00 suffix to prevent UTC midnight timezone shift (RESEARCH.md Pitfall 2)"
  - "META-01 tests read dist/articles/01-demo-article/og.html via fs.readFileSync to avoid redirect script interference"
  - "Conditional render: metadata line suppressed when both _date and _readingTime are absent/zero"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-04-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
requirements: [META-01, META-02, META-03]
---

# Phase 05 Plan 02: Article Metadata Display and E2E Tests Summary

Article page extended with a metadata line showing formatted publication date and reading time via `Intl.DateTimeFormat`, styled per UI-SPEC with `.article-meta` CSS, plus 11 Playwright E2E tests covering all three META requirements.

## What Was Built

### Task 1: Metadata line in devliot-article-page.ts and article.css

`DevliotArticlePage` extended with:

- `@state() private _date = ''` and `@state() private _readingTime = 0` — new reactive state properties
- `_formatDate(iso: string): string` — converts ISO date string to long format ("April 11, 2026") using `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })` with `T12:00:00` appended to prevent UTC midnight timezone shift
- `_loadArticle()` extended to read `meta.date` and `meta.readingTime` from `index.json` alongside existing `meta.tags` and `meta.category`
- `render()` updated to conditionally render `<p class="article-meta">` with `<time datetime="{iso}">` wrapper for accessibility, middle dot separator (`\u00a0\u00b7\u00a0`), and reading time text — suppressed entirely when neither is available

`.article-meta` CSS added to `src/styles/article.css`:
- `font-size: var(--font-size-label)` (14px)
- `color: var(--color-text-muted)` (#666666)
- `font-weight: var(--font-weight-regular)` (400)
- `padding-left/right: var(--space-lg)` to align with article body content

For the demo article: renders "April 11, 2026 · 2 min read".

### Task 2: Playwright E2E tests (tests/article-metadata.spec.ts)

11 tests in two describe blocks:

**META-02 & META-03 (dev server, 5 tests):**
- Asserts `.article-meta` visible with "April 11, 2026" text
- Asserts `<time datetime="2026-04-11">` element with correct text
- Asserts `/\d+ min read/` pattern in `.article-meta`
- Asserts full "April 11, 2026 · N min read" format via regex
- Asserts metadata line positioned above article body via `boundingBox()` comparison

**META-01 (production build, 6 tests):**
- Asserts `dist/articles/01-demo-article/og.html` file exists
- Asserts `og:title` contains "Article Components Demo"
- Asserts `og:description` non-empty
- Asserts `og:image` absolute URL `https://devliot.github.io/devliot/articles/01-demo-article/og-image.png`
- Asserts `twitter:card` and `summary_large_image` present
- Asserts redirect script `window.location.replace('/devliot/#/article/01-demo-article')`

All 11 tests pass. All 8 existing `article-components.spec.ts` tests still pass (no regression).

## Verification Results

1. `npx tsc --noEmit` — PASS (zero errors)
2. Article page renders "April 11, 2026 · 2 min read" for demo article — PASS
3. Metadata line positioned above `<article>` element — PASS (boundingBox test confirms)
4. `npm run build` — PASS (existing build pipeline unchanged)
5. `dist/articles/01-demo-article/og.html` contains correct OG tags — PASS
6. All 11 Playwright tests pass green — PASS
7. Existing 8 article-components tests unaffected — PASS

## Deviations from Plan

None — plan executed exactly as written.

### Notes

- Dev server was stale (reusing old build) when Playwright tests initially ran — killed old server process to force restart. This is a Playwright `reuseExistingServer` behavior, not a code issue.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 640a10a | feat(05-02): add metadata line (date + reading time) to article page |
| Task 2 | 4fda7cf | feat(05-02): add Playwright E2E tests for META-01, META-02, META-03 |

## Known Stubs

None — metadata line is fully wired to live `index.json` data. Reading time computed at build time via `build-og-pages.mjs --enrich`. No placeholder values.

## Threat Flags

No new security surface introduced. Metadata values (`date`, `readingTime`) rendered via Lit `html` tagged template literal (auto-escaped). `<time datetime="${this._date}">` attribute binding is escaped by Lit. No `unsafeHTML` used for metadata values.

## Self-Check: PASSED

- `src/pages/devliot-article-page.ts` modified: FOUND
- `src/styles/article.css` modified: FOUND
- `tests/article-metadata.spec.ts` created: FOUND
- Commit 640a10a exists: FOUND
- Commit 4fda7cf exists: FOUND
