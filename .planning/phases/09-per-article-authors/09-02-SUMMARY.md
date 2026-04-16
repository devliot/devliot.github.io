---
phase: "09-per-article-authors"
plan: "02"
subsystem: "og-pages"
tags: ["json-ld", "structured-data", "schema.org", "seo", "build-time"]
dependency_graph:
  requires: ["09-01"]
  provides: ["json-ld-blogposting-in-og-html"]
  affects: ["scripts/build-og-pages.mjs", "dist/articles/*/og.html"]
tech_stack:
  added: []
  patterns: ["schema.org/BlogPosting JSON-LD", "build-time structured data injection", "compact JSON.stringify for test-compatible output"]
key_files:
  created: []
  modified:
    - scripts/build-og-pages.mjs
decisions:
  - "Used compact JSON.stringify(schema) (no indent) so test string match '@type\":\"BlogPosting\"' (no space) works against raw HTML"
  - "buildJsonLd() returns self-contained script tag string injected inline before redirect script"
  - "Default author fallback { name: 'Devliot', url: 'https://github.com/devliot' } applied only when article.authors is absent or empty"
  - "article.image prefixed with siteUrl + '/' to produce absolute URL for JSON-LD image field"
metrics:
  duration: "90s"
  completed_date: "2026-04-16"
  tasks_completed: 1
  files_changed: 1
---

# Phase 09 Plan 02: JSON-LD BlogPosting Structured Data in OG Pages Summary

Build-time JSON-LD schema.org/BlogPosting injection into each article's og.html via new `buildJsonLd()` function in `scripts/build-og-pages.mjs`, turning all 5 AUTHOR-03 Playwright tests GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add buildJsonLd function and inject JSON-LD into OG page template | 6fc1446 | scripts/build-og-pages.mjs |

## What Was Built

**Task 1 — JSON-LD injection (`scripts/build-og-pages.mjs`):**

- New `buildJsonLd(article, siteUrl)` function added between `escapeHtml` and `enrichIndexJson`
- Builds `schema.org/BlogPosting` object with:
  - `headline`: article.title
  - `datePublished`: article.date
  - `author`: array of `@type: Person` nodes (name always, url optional)
  - `publisher`: `@type: Organization` with `name: 'DEVLIOT'` and `url: siteUrl`
  - `description`: included when present on article
  - `image`: absolute URL (`siteUrl + '/' + article.image`) when present
- Fallback: when `article.authors` is absent or empty, defaults to `{ name: 'Devliot', url: 'https://github.com/devliot' }`
- Returns compact `<script type="application/ld+json">...</script>` block (compact JSON, no indent)
- `generateOgPages()` computes `const jsonLd = buildJsonLd(article, SITE_URL)` per article
- `${jsonLd}` injected in HTML template before the redirect script tag

## Verification Results

- 5/5 AUTHOR-03 Playwright tests GREEN (all were RED before this plan)
- 5/5 AUTHOR-02 tests remain GREEN (no regressions)
- Full 64-test suite passes: 64/64 GREEN
- `npm run build` exits 0
- `dist/articles/01-demo-article/og.html` contains valid JSON-LD BlogPosting with 2 authors, DEVLIOT publisher, correct headline, datePublished, description, and absolute image URL

## Deviations from Plan

**1. [Rule 1 - Bug] Used compact JSON.stringify instead of pretty-printed**
- **Found during:** Task 1 verification planning
- **Issue:** The plan template used `JSON.stringify(schema, null, 2)` (pretty-printed), but AUTHOR-03 test at line 67 performs a raw HTML string match for `'"@type":"BlogPosting"'` (compact, no space after colon). Pretty-printed JSON produces `"@type": "BlogPosting"` (with space), which would fail the test.
- **Fix:** Used `JSON.stringify(schema)` (compact, no indent). The regex-based tests at lines 75-117 use `JSON.parse()` so they work with either format.
- **Files modified:** scripts/build-og-pages.mjs
- **Commit:** 6fc1446

## Known Stubs

None. All JSON-LD fields are wired from real article data in `public/articles/index.json`.

## Threat Flags

No new threat surface introduced. T-09-04, T-09-05, T-09-06 accepted per plan threat model:
- JSON.stringify handles all encoding — no escapeHtml inside JSON payload
- All data from controlled build-time index.json (no runtime user input)
- Only public fields exposed in JSON-LD

## Self-Check: PASSED

Files created/modified:
- FOUND: scripts/build-og-pages.mjs (modified)

Commits:
- FOUND: 6fc1446 (feat(09-02): add buildJsonLd to inject JSON-LD BlogPosting into og.html)
