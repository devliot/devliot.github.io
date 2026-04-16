---
phase: "09-per-article-authors"
plan: "01"
subsystem: "article-page"
tags: ["byline", "authors", "playwright", "lit", "css"]
dependency_graph:
  requires: []
  provides: ["author-byline-rendering", "per-article-authors-test-scaffold"]
  affects: ["src/pages/devliot-article-page.ts", "src/styles/article.css"]
tech_stack:
  added: []
  patterns: ["Lit @state reactive property", "private render helper method", "CSS custom properties token reuse"]
key_files:
  created:
    - tests/per-article-authors.spec.ts
  modified:
    - src/pages/devliot-article-page.ts
    - src/styles/article.css
decisions:
  - "Byline rendered unconditionally (no conditional wrapper) — always shows at least 'par Devliot' default"
  - "Default author is render-time fallback only, not injected into index.json (D-05)"
  - "_authors reset to [] in slug-change block to prevent previous article byline flash (RESEARCH Pitfall 1)"
metrics:
  duration: "108s"
  completed_date: "2026-04-16"
  tasks_completed: 2
  files_changed: 3
---

# Phase 09 Plan 01: Playwright Test Scaffold + Author Byline Rendering Summary

Author byline feature delivering French-format `par X et Y` display in `devliot-article-page.ts`, with Playwright E2E test scaffold covering both AUTHOR-02 (byline, dev server) and AUTHOR-03 (JSON-LD, RED for Plan 02).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Playwright test scaffold for AUTHOR-02 and AUTHOR-03 | a1a3dbc | tests/per-article-authors.spec.ts (123 lines, 10 tests) |
| 2 | Implement author byline rendering in article page component | b028dff | src/pages/devliot-article-page.ts, src/styles/article.css |

## What Was Built

**Task 1 — Test scaffold (`tests/per-article-authors.spec.ts`):**
- 5 AUTHOR-02 tests (dev server): byline text `par Eliott et Sample Coauthor`, author link href/target/rel attrs, plain-text coauthor (exactly 1 `<a>` in byline), DOM order (meta → byline → article), muted styling (rgb(102,102,102), 14px)
- 5 AUTHOR-03 tests (production build, dist/): JSON-LD script block presence, author array matching index.json, publisher Organization, headline/datePublished, description/image — all RED until Plan 02

**Task 2 — Byline implementation:**
- Import: `ArticleRegistry, Author` from `src/types/article.js`
- State: `@state() private _authors: Author[] = []`
- Reset block: `this._authors = []` on slug change (prevents flash of previous article's byline)
- Metadata extraction: `this._authors = meta.authors || []` after readingTime
- `_renderByline()` private method: French format (`par X`, `par X et Y`, `par X, Y et Z`), `<a>` links for authors with `url` (target=_blank, rel=noopener), plain text for authors without `url`, fallback to `{ name: 'Devliot', url: 'https://github.com/devliot' }` when `_authors` is empty
- Render: `${this._renderByline()}` inserted unconditionally between `.article-meta` conditional and `<article>` tag
- CSS: `.article-byline` rule added to `article.css` — mirrors `.article-meta` exactly (14px, `--color-text-muted`, 1.5 line-height, `--space-md` margins, `--space-lg` padding)

## Verification Results

- 5/5 AUTHOR-02 Playwright tests GREEN
- 5 AUTHOR-03 tests RED (expected — JSON-LD not yet generated, Plan 02 scope)
- 5/5 META-02/META-03 dev-server tests GREEN (no regressions)
- META-01 tests: pre-existing failures requiring `dist/` build — unrelated to this plan

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The byline renders real data from `index.json` authors array. The AUTHOR-03 tests are intentionally RED (not stubs — they test functionality scoped to Plan 02).

## Threat Flags

No new threat surface introduced. All threats T-09-01 through T-09-03 accepted per plan threat model:
- Author names rendered as Lit text nodes (auto-escaped)
- Author URLs in `href` attributes (Lit sanitizes `javascript:` URIs)
- No PII beyond public name/url from controlled `index.json`

## Self-Check: PASSED

Files created/modified:
- FOUND: tests/per-article-authors.spec.ts
- FOUND: src/pages/devliot-article-page.ts (modified)
- FOUND: src/styles/article.css (modified)

Commits:
- FOUND: a1a3dbc (test(09-01): add Playwright test scaffold)
- FOUND: b028dff (feat(09-01): implement author byline rendering)
