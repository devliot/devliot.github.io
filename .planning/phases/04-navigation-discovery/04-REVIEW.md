---
phase: 04-navigation-discovery
reviewed: 2026-04-14T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - .gitignore
  - package.json
  - scripts/build-search-index.mjs
  - src/components/devliot-header.ts
  - src/pages/devliot-article-page.ts
  - src/pages/devliot-home-page.ts
  - src/styles/article.css
  - src/styles/header.css
  - src/styles/home.css
  - src/utils/hash-router.ts
  - tests/navigation-discovery.spec.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-14
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This phase introduces hash-based client-side routing, a tag/category filter system, in-article heading anchors with section deep-linking, and a FlexSearch-powered search bar. The overall architecture is sound — slug validation prevents path traversal, the router correctly handles empty segments, and search debouncing is in place.

Two bugs require attention before merge: section scroll-to always reads from `window.location.search` instead of the hash query string (so it never fires), and `decodeURIComponent` in the router can throw an uncaught `URIError` that crashes navigation. Two additional logic issues concern a timing race in initial-load search and a premature `_scrollToSectionFromUrl` call during `connectedCallback`. No critical security issues were found.

---

## Warnings

### WR-01: Section deep-link reads wrong URL property — always a no-op

**File:** `src/pages/devliot-article-page.ts:136`

**Issue:** `_scrollToSectionFromUrl` reads `window.location.search` to find the `?section=` parameter. Because the app uses hash routing, the query string is embedded inside `window.location.hash` (e.g., `/#/article/my-slug?section=intro`). `window.location.search` is always empty in this setup, so `params.get('section')` always returns `null` and section scrolling never executes.

**Fix:**
```typescript
private _scrollToSectionFromUrl(): void {
  // Query params live inside the hash, not window.location.search
  const hash = window.location.hash; // e.g. "#/article/my-slug?section=intro"
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return;
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  const section = params.get('section');
  if (!section) return;

  const article = this.shadowRoot?.querySelector('article');
  if (!article) return;

  const target = article.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}
```

---

### WR-02: `_scrollToSectionFromUrl` called in `connectedCallback` before content exists

**File:** `src/pages/devliot-article-page.ts:25-27`

**Issue:** `connectedCallback` calls `_scrollToSectionFromUrl()` synchronously. At that point `_html` is still `''`, the `<article>` element has not been rendered, and `this.shadowRoot?.querySelector('article')` returns `null`. The method exits early without scrolling. The actual scroll needs to happen after `_html` is set and the DOM has updated, which is already handled in the `updated()` lifecycle (line 36-42) via `this.updateComplete.then(...)`. The `connectedCallback` call is therefore dead code.

**Fix:** Remove the `_scrollToSectionFromUrl()` call from `connectedCallback`:
```typescript
connectedCallback() {
  super.connectedCallback();
  // No scroll attempt here — scroll is triggered by updated() after _html loads
}
```

---

### WR-03: `decodeURIComponent` in router can throw uncaught `URIError`

**File:** `src/utils/hash-router.ts:67`

**Issue:** `decodeURIComponent(value)` throws a `URIError` if the path segment contains a malformed percent-encoded sequence (e.g., navigating to `/#/article/%GG`). This error is not caught anywhere in `_onHashChange`, which means the entire reactive update cycle crashes with an unhandled exception, leaving the app in a broken state with no visible feedback to the user.

**Fix:**
```typescript
// Replace the direct call with a safe wrapper
const decoded = (() => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null; // malformed URI — reject this route match
  }
})();
if (decoded === null) return null;
params[patternParts[i].slice(1)] = decoded;
```

---

### WR-04: Initial URL search query relies on a fixed 100 ms timeout — race condition

**File:** `src/pages/devliot-home-page.ts:63-70`

**Issue:** When the page loads with `?q=someterm` in the hash, the code uses `setTimeout(..., 100)` before calling `_initSearch()`. This 100 ms window is a best-guess delay to let the component render first. On a slow connection or slow device, `_fetchArticles` may not have completed, and even if it has, the `if (this._searchIndex)` guard on line 67 will silently discard the initial query if `_initSearch()` has not yet resolved. The result: the URL query parameter is ignored on first load.

**Fix:** Remove the fixed timeout. Await `_initSearch()` and then apply the search directly inside the same async flow as `_fetchArticles`:
```typescript
const q = params.get('q');
if (q) {
  await this._initSearch();
  if (this._searchIndex) {
    const raw = this._searchIndex.search(q, { limit: 50 });
    this._searchMatchSlugs = new Set(
      raw.flatMap((r: { field: string; result: string[] }) => r.result)
    );
  }
}
```
This executes after `_fetchArticles` completes and ensures the search index is fully initialised before querying.

---

## Info

### IN-01: `build-search-index.mjs` — unhandled file read errors crash build silently

**File:** `scripts/build-search-index.mjs:5`

**Issue:** `readFileSync(\`public/articles/${article.slug}/index.html\`, 'utf8')` throws with a Node.js `ENOENT` stack trace if any article listed in `index.json` does not have a corresponding `index.html` file. The error message does not identify which slug caused the problem, making debugging slow.

**Fix:** Wrap per-article reads in a try/catch that logs the offending slug and skips it:
```javascript
const searchData = registry.articles.flatMap(article => {
  try {
    const html = readFileSync(`public/articles/${article.slug}/index.html`, 'utf8');
    const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return [{ slug: article.slug, title: article.title, date: article.date,
              category: article.category, tags: article.tags, body }];
  } catch (err) {
    console.warn(`Warning: skipping article "${article.slug}" — ${err.message}`);
    return [];
  }
});
```

---

### IN-02: `role="search"` is invalid on an `<input>` element

**File:** `src/components/devliot-header.ts:65`

**Issue:** The search input has `role="search"` applied directly to an `<input>` element. The `search` ARIA role is a landmark role intended for a container element (e.g., `<form>` or `<div>`), not for interactive form controls. Screen readers may ignore or misinterpret this. The correct approach is either to wrap the input in a `<form role="search">` or to use the `searchbox` role, though for a plain text input `searchbox` is also typically implicit.

**Fix:** Remove `role="search"` from the `<input>` and apply it to a wrapper element, or simply remove it — the `aria-label="Search articles"` on the input already provides sufficient context:
```html
<input
  class="search-input"
  type="text"
  placeholder="Search articles…"
  aria-label="Search articles"
  .value=${this._searchValue}
  @input=${this._onSearchInput}
  @keydown=${this._onSearchKeydown}
/>
```

---

### IN-03: Hamburger menu button has no event handler

**File:** `src/components/devliot-header.ts:83`

**Issue:** The `.menu-toggle` button renders with `aria-label="Ouvrir le menu"` but has no `@click` handler. It is a non-functional placeholder. If it will remain non-functional, it should use `aria-hidden="true"` and `tabindex="-1"` to prevent screen readers and keyboard users from reaching a dead control.

**Fix:** Either wire up the menu functionality or mark it inert until it is implemented:
```html
<button
  class="menu-toggle"
  aria-label="Ouvrir le menu"
  aria-hidden="true"
  tabindex="-1"
>
  <span class="hamburger-icon">&#9776;</span>
</button>
```

---

### IN-04: E2E tests use fixed `waitForTimeout` for debounce — flaky pattern

**File:** `tests/navigation-discovery.spec.ts:163, 219`

**Issue:** Several tests use `page.waitForTimeout(500)` to wait for the 200 ms search debounce and FlexSearch initialisation to complete. Fixed time delays are a common source of test flakiness — they are either too short on slow CI machines or wastefully long on fast ones.

**Fix:** Replace fixed delays with condition-based waits. For search results appearing, wait for the DOM condition rather than a timer:
```typescript
// Instead of: await page.waitForTimeout(500);
// Wait for the article list to update:
await page.waitForFunction(() => {
  const rows = document.querySelector('devliot-home-page')
    ?.shadowRoot?.querySelectorAll('.article-row');
  return rows !== undefined; // or check for empty-state
});
```
Note: for shadow DOM, `waitForSelector` with Playwright's pierce selector (`>>`) may be needed depending on the test environment configuration.

---

_Reviewed: 2026-04-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
