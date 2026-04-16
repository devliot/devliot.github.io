---
phase: 09-per-article-authors
reviewed: 2026-04-16T14:32:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - scripts/build-og-pages.mjs
  - src/pages/devliot-article-page.ts
  - src/styles/article.css
  - tests/per-article-authors.spec.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-04-16T14:32:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 9 adds per-article author support: a byline component in the article page, JSON-LD structured data in OG pages, default-author fallback, and Playwright E2E tests. The implementation is well-structured with proper slug validation, HTML escaping in OG templates, and stale-slug guards during async fetches.

One critical security gap exists in the JSON-LD generation: `JSON.stringify()` does not escape `</script>` sequences, allowing script tag breakout if article metadata contains that string. Two warnings address an unescaped URL in an HTML attribute and a byline that renders before article data is available. One info item notes test code duplication.

## Critical Issues

### CR-01: JSON-LD injection via unescaped `</script>` in article data

**File:** `scripts/build-og-pages.mjs:55`
**Issue:** `JSON.stringify()` does not escape the sequence `</script>` (or `</SCRIPT>`, case-insensitive). If any article field (title, description, author name) contains `</script>`, the generated string will prematurely close the `<script>` tag, allowing arbitrary HTML/JS injection into the OG page. This is a well-documented XSS vector for inline JSON-LD (see OWASP guidelines on safe JSON embedding in HTML).

While the slug is validated, fields like `title`, `description`, and `author.name` are free-text from `index.json` and are not sanitized against this pattern before JSON-LD serialization.

**Fix:** Escape the forward slash in `</` sequences after `JSON.stringify`, or replace `<` and `>` inside the serialized JSON string:
```javascript
function buildJsonLd(article, siteUrl) {
  // ... existing schema construction ...

  // Escape </script> sequences to prevent script tag breakout
  const jsonStr = JSON.stringify(schema).replace(/</g, '\\u003c');
  return `  <script type="application/ld+json">${jsonStr}</script>`;
}
```

## Warnings

### WR-01: `articleUrl` not HTML-escaped before injection into meta tag

**File:** `scripts/build-og-pages.mjs:107,133`
**Issue:** `articleUrl` is constructed on line 107 without `escapeHtml()` and injected directly into an HTML attribute on line 133 (`content="${articleUrl}"`). Every other interpolated value in this template (`title`, `description`, `imageUrl`) is properly escaped. Although the current risk is low because `articleUrl` is built from constants (`SITE_URL`, `BASE_URL`) plus a slug-validated value, this inconsistency breaks the escaping discipline and could become exploitable if the URL construction changes.

**Fix:**
```javascript
const articleUrl = escapeHtml(`${SITE_URL}${BASE_URL}article/${article.slug}`);
```

### WR-02: Byline renders default author before article data loads

**File:** `src/pages/devliot-article-page.ts:237`
**Issue:** `_renderByline()` is called unconditionally in `render()`, even when no article has loaded yet (`_html` is empty, `_authors` is `[]`). This causes "par Devliot" (the default author) to flash briefly on every page load before the actual article metadata arrives. The `_date`/`_readingTime` section on line 232 is properly guarded by a conditional, but the byline is not.

**Fix:** Guard the byline the same way the metadata line is guarded -- only render when article content is present:
```typescript
${this._html ? this._renderByline() : ''}
```

## Info

### IN-01: Repeated file-read boilerplate in AUTHOR-03 test cases

**File:** `tests/per-article-authors.spec.ts:61-122`
**Issue:** All five AUTHOR-03 tests independently import `fs` and `path`, construct the same `ogPath`, and read the same file. This duplicates 4 lines across each test (20 lines total). While not a bug, it increases maintenance cost -- if the path changes, all five tests need updating.

**Fix:** Extract the file reading into a `test.describe` level fixture or a `beforeAll` block:
```typescript
test.describe('Article Authors -- AUTHOR-03 (JSON-LD, production build)', () => {
  let html: string;
  let schema: any;

  test.beforeAll(async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    html = fs.readFileSync(ogPath, 'utf8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    schema = match ? JSON.parse(match[1]) : null;
  });

  // Then each test just asserts against `html` and `schema`
});
```

---

_Reviewed: 2026-04-16T14:32:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
