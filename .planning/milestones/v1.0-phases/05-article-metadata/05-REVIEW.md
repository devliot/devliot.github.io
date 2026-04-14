---
phase: 05-article-metadata
reviewed: 2026-04-14T12:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - scripts/build-og-pages.mjs
  - public/articles/index.json
  - package.json
  - index.html
  - tests/article-metadata.spec.ts
  - src/pages/devliot-article-page.ts
  - src/styles/article.css
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-14T12:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 5 adds article metadata: OG HTML page generation for social sharing, reading time computation at build time, and a date + reading time metadata line rendered in the article page component. The implementation is well-structured with good security practices (slug validation via allowlist, HTML escaping of user-provided strings, CSS.escape for section anchors, SPA fallback guard). However, there is a context mismatch in the escaping strategy for the OG page redirect script, and the `article.image` field bypasses escaping entirely.

The test coverage is solid -- both dev-server tests (Playwright E2E) and production-build tests (file system assertions) are present and verify the full metadata pipeline. The CSS is clean and follows the project's design system variables.

## Critical Issues

### CR-01: Redirect URL injected into JavaScript string context without JS-appropriate escaping

**File:** `scripts/build-og-pages.mjs:97`
**Issue:** The `redirectUrl` variable is interpolated directly into a JavaScript `window.location.replace('...')` call inside a `<script>` tag. The `escapeHtml` function only escapes HTML entities (`& < > "`), but this is a JavaScript single-quoted string context. While the slug is currently validated by `SLUG_PATTERN` (alphanumeric, hyphens, underscores only), and `BASE_URL` is a hardcoded constant, the escaping does not match the output context. If `SLUG_PATTERN` is ever loosened to allow `'` characters, or if a future change constructs `redirectUrl` from unvalidated input, this becomes a direct JavaScript injection vector. Defense-in-depth requires escaping to match the output context.

**Fix:** Apply JavaScript string escaping to `redirectUrl` before injection, or use `JSON.stringify` which properly escapes all special characters for JS string contexts:
```javascript
// Option A: Use JSON.stringify (handles all JS special chars including ' \ newlines)
const safeRedirectUrl = JSON.stringify(redirectUrl);
// Then in template: window.location.replace(${safeRedirectUrl});

// Option B: Dedicated JS string escaper
function escapeJsString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
// Then in template: window.location.replace('${escapeJsString(redirectUrl)}');
```

## Warnings

### WR-01: article.image field not validated or escaped before use in HTML attributes

**File:** `scripts/build-og-pages.mjs:67-68`
**Issue:** The `article.image` value from `index.json` is concatenated into `imageUrl` and placed into `content="..."` meta tag attributes (lines 78, 84) without any escaping. Unlike `title` and `description` which are passed through `escapeHtml`, `image` is used raw. If an article's `image` field contains a `"` character (e.g., from a typo or malformed JSON edit), it would break out of the HTML attribute, potentially enabling content injection in the generated OG page.

**Fix:** Pass the constructed `imageUrl` through `escapeHtml` before embedding in attributes:
```javascript
const imageUrl = article.image
  ? escapeHtml(`${SITE_URL}${BASE_URL}${article.image}`)
  : '';
```

### WR-02: escapeHtml omits single-quote escaping

**File:** `scripts/build-og-pages.mjs:13-18`
**Issue:** The `escapeHtml` function escapes `& < > "` but not `'` (single quote). While all current HTML attribute values in the template use double quotes, the `<title>` tag content and any future attribute using single-quote delimiters would be vulnerable. OWASP recommends escaping all five HTML special characters for robust output encoding.

**Fix:** Add single-quote escaping:
```javascript
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

## Info

### IN-01: Repeated file read boilerplate in META-01 production build tests

**File:** `tests/article-metadata.spec.ts:55-106`
**Issue:** All six META-01 tests independently import `fs` and `path`, construct the same `ogPath`, and read the same file. This duplicated setup makes the tests harder to maintain and adds unnecessary noise.

**Fix:** Extract into a shared `test.beforeAll` or helper:
```typescript
test.describe('Article Metadata - META-01 (OG pages, production build)', () => {
  let ogHtml: string;
  let ogPath: string;

  test.beforeAll(async () => {
    const fs = await import('fs');
    const path = await import('path');
    ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    ogHtml = fs.readFileSync(ogPath, 'utf8');
  });

  test('META-01: OG HTML page exists for demo article', () => {
    expect(ogHtml).toBeTruthy();
  });

  // ... other tests use ogHtml directly
});
```

### IN-02: WPM constant lacks source citation

**File:** `scripts/build-og-pages.mjs:6`
**Issue:** `const WPM = 238;` is used for reading time calculation but has no comment explaining the source of this value. While 238 WPM is a commonly cited average adult reading speed (from Brysbaert 2019), a brief citation aids future maintainers who might question or need to adjust it.

**Fix:** Add a source comment:
```javascript
/** Average adult reading speed in words per minute (Brysbaert, 2019). */
const WPM = 238;
```

---

_Reviewed: 2026-04-14T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
