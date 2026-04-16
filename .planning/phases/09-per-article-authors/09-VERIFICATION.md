---
phase: 09-per-article-authors
verified: 2026-04-16T13:10:00Z
status: passed
score: 11/11
overrides_applied: 0
---

# Phase 9: Per-article Authors — Verification Report

**Phase Goal:** Each article can credit one or more authors by name, displayed in the article header and embedded as structured data in OG pages for search engines
**Verified:** 2026-04-16T13:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

Roadmap Success Criteria (non-negotiable contract):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | An article with an `authors` array in `index.json` displays a byline with author name(s) alongside the publication date and reading time in the article header | VERIFIED | `_renderByline()` called unconditionally in render() at line 237; demo article byline "par Eliott et Sample Coauthor" confirmed by AUTHOR-02 Playwright tests (5/5 GREEN) |
| SC-2 | An article without an `authors` field renders its metadata line normally with no broken layout or placeholder text | VERIFIED | `_renderByline()` falls back to `DEFAULT_AUTHOR = { name: 'Devliot' }` when `_authors` is empty — renders "par Devliot"; no conditional guard on byline call (always rendered) |
| SC-3 | The OG page for an article with authors contains a valid `<script type="application/ld+json">` block with `@type: BlogPosting` and an `author` property listing the declared authors | VERIFIED | `dist/articles/01-demo-article/og.html` contains compact JSON-LD with `@type: BlogPosting`, `author` array with 2 Person entries matching index.json; all 5 AUTHOR-03 tests GREEN |

Plan 01 must_haves (additional):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| P-1 | Demo article displays "par Eliott et Sample Coauthor" byline below the date/reading-time line | VERIFIED | AUTHOR-02 test 1 GREEN: `await expect(byline).toContainText('par Eliott et Sample Coauthor')` |
| P-2 | Author "Eliott" is a clickable link to https://github.com/devliot opening in a new tab | VERIFIED | AUTHOR-02 test 2 GREEN: href, target=_blank, rel=noopener all confirmed |
| P-3 | Author "Sample Coauthor" renders as plain text (no link) | VERIFIED | AUTHOR-02 test 3 GREEN: `expect(links).toHaveCount(1)` confirms only 1 `<a>` in byline |
| P-4 | An article without authors displays "par Devliot" as default (render-time fallback, not in index.json) | VERIFIED | `_renderByline()` code: `const authors = this._authors.length > 0 ? this._authors : [DEFAULT_AUTHOR]`; index.json has exactly 2 declared authors (no injected default) |
| P-5 | Byline renders unconditionally — always visible, never empty | VERIFIED | Line 237 is `${this._renderByline()}` outside any conditional; default fallback ensures minimum "par Devliot" content |
| P-6 | Navigating between articles does not flash the previous article's byline | VERIFIED | `this._authors = []` in reset block (line 71) alongside `_date`, `_tags`, etc. |

Plan 02 must_haves:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| Q-1 | `npm run build` produces og.html files with JSON-LD `@type: BlogPosting` | VERIFIED | Build exits 0; `dist/articles/01-demo-article/og.html` line 16 confirmed |
| Q-2 | JSON-LD author array for demo article contains Eliott (with url) and Sample Coauthor (without url) | VERIFIED | Parsed from og.html: `author[0].name=Eliott, author[0].url=https://github.com/devliot, author[1].name=Sample Coauthor, author[1].url=undefined` |
| Q-3 | Articles without declared authors get default Devliot author in JSON-LD | VERIFIED | `buildJsonLd()` has identical fallback logic: `const DEFAULT_AUTHOR = { name: 'Devliot', url: 'https://github.com/devliot' }` applied when `article.authors` absent or empty |
| Q-4 | JSON-LD contains publisher Organization with name DEVLIOT and url https://devliot.github.io | VERIFIED | Confirmed: `{"@type":"Organization","name":"DEVLIOT","url":"https://devliot.github.io"}` |
| Q-5 | JSON-LD contains headline, datePublished, and optional description/image fields | VERIFIED | headline="Article Components Demo", datePublished="2026-04-11", description present, image="https://devliot.github.io/articles/01-demo-article/og-image.png" |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/per-article-authors.spec.ts` | Playwright E2E tests for AUTHOR-02 byline and AUTHOR-03 JSON-LD | VERIFIED | 124 lines, 10 tests (5 AUTHOR-02 + 5 AUTHOR-03), all GREEN |
| `src/pages/devliot-article-page.ts` | `_authors` state, `_renderByline()` helper, Author import | VERIFIED | All required patterns confirmed: import, @state, reset block, metadata extraction, render method call |
| `src/styles/article.css` | `.article-byline` CSS rule | VERIFIED | Rule at lines 31-40, mirrors `.article-meta` with `--font-size-label`, `--color-text-muted`, `--space-lg` padding |
| `scripts/build-og-pages.mjs` | `buildJsonLd()` function generating schema.org/BlogPosting JSON-LD | VERIFIED | Function at lines 27-56, all required fields present |
| `dist/articles/01-demo-article/og.html` | Generated OG page with JSON-LD structured data | VERIFIED | Compact JSON-LD at line 16 with all required fields |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/devliot-article-page.ts` | `src/types/article.ts` | `import type { Author }` | WIRED | Line 8: `import type { ArticleRegistry, Author } from '../types/article.js'` |
| `src/pages/devliot-article-page.ts` | `src/styles/article.css` | `unsafeCSS inline import` | WIRED | Line 5: `import articleStyles from '../styles/article.css?inline'` |
| `src/pages/devliot-article-page.ts` | `public/articles/index.json` | `fetch in _loadArticle`, `meta.authors` | WIRED | Lines 101-112: fetch `/articles/index.json`, extract `meta.authors || []` |
| `scripts/build-og-pages.mjs` | `public/articles/index.json` | `JSON.parse(readFileSync(...))` | WIRED | Line 93: `readFileSync('public/articles/index.json', 'utf8')`, accesses `article.authors` |
| `scripts/build-og-pages.mjs` | `dist/articles/{slug}/og.html` | `writeFileSync with JSON-LD injected` | WIRED | `buildJsonLd()` called at line 123, `${jsonLd}` in template at line 136, `writeFileSync` at line 145 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `devliot-article-page.ts` render | `_authors` | `meta.authors` from `index.json` fetch | Yes — populated from real JSON fetch, `index.json` has 2 declared authors | FLOWING |
| `scripts/build-og-pages.mjs` | `article.authors` | `public/articles/index.json` via `readFileSync` | Yes — same registry, 2 real authors | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command / Check | Result | Status |
|----------|----------------|--------|--------|
| `npm run build` exits 0 | `npm run build 2>&1 \| tail -5` | "Generated OG pages: 1 articles in dist/" | PASS |
| og.html contains valid JSON-LD | `node -e "JSON.parse(...)` on extracted block | Parses cleanly, all fields correct | PASS |
| All 10 AUTHOR tests GREEN | `npx playwright test tests/per-article-authors.spec.ts --project=chromium` | 10 passed (2.3s) | PASS |
| article-metadata.spec.ts regression | `npx playwright test tests/article-metadata.spec.ts --project=chromium` | 11 passed (2.3s) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTHOR-01 | 09-01 (claimed) | Article can declare `authors[]` with `name` + optional `url` in `index.json` | SATISFIED | `Author` interface in `src/types/article.ts`, `authors?: Author[]` on `Article`, demo article in `index.json` has 2 authors — completed in Phase 6; Phase 9 consumes it |
| AUTHOR-02 | 09-01 | Author byline displays in article header alongside date and reading time | SATISFIED | 5/5 AUTHOR-02 Playwright tests GREEN; byline renders "par Eliott et Sample Coauthor" with correct link/plain-text behavior |
| AUTHOR-03 | 09-02 | Each article emits JSON-LD `schema.org/BlogPosting` with `author: Person[]` in its OG page | SATISFIED | 5/5 AUTHOR-03 Playwright tests GREEN; valid JSON-LD in `dist/articles/01-demo-article/og.html` |

**Note on AUTHOR-01:** REQUIREMENTS.md traceability table maps AUTHOR-01 to Phase 6 (not Phase 9). Plan 09-01 claims it in its `requirements` field. This is not a gap — AUTHOR-01 is demonstrably satisfied and Phase 9 depends on it correctly. The traceability table is a planning artifact discrepancy only; the requirement is fulfilled.

---

### Anti-Patterns Found

None. Scan of all four phase files (`tests/per-article-authors.spec.ts`, `src/pages/devliot-article-page.ts`, `src/styles/article.css`, `scripts/build-og-pages.mjs`) returned no TODO/FIXME/PLACEHOLDER comments and no empty implementations.

The `.article-byline` renders real data from `index.json` (not hardcoded). The `buildJsonLd()` function reads real article data (not static empty returns). All state flows are real.

---

### Human Verification Required

One item requires human visual confirmation:

**1. Byline visual appearance in article header**

**Test:** Open `/article/01-demo-article` in a browser. Scroll to the article header area.
**Expected:** The byline "par Eliott et Sample Coauthor" appears on a dedicated line below the date/reading-time metadata line. "Eliott" is underlined and styled as a link (monochrome #333333 per project palette). "Sample Coauthor" is plain muted text. Byline uses 14px font, muted color (#666666), same horizontal padding as the metadata line.
**Why human:** Computed style assertions in Playwright confirm color and font-size programmatically (these passed), but visual integration — spacing, alignment with header, that the byline doesn't visually collide with adjacent elements — requires human eyes. The Lit dev-mode warning about `devliot-math` scheduling extra updates is pre-existing and unrelated.

---

### Gaps Summary

No gaps. All 11 must-haves (3 roadmap success criteria + 6 Plan-01 truths + 5 mapped to Plan-02 truths, with some overlap) are verified. Phase goal achieved.

---

_Verified: 2026-04-16T13:10:00Z_
_Verifier: Claude (gsd-verifier)_
