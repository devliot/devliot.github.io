---
phase: 07-deep-linkable-anchors
reviewed: 2026-04-15T14:32:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - package.json
  - public/articles/index.json
  - scripts/build-og-pages.mjs
  - src/components/devliot-header.ts
  - src/devliot-app.ts
  - src/pages/devliot-article-page.ts
  - src/pages/devliot-home-page.ts
  - src/styles/article.css
  - src/utils/path-router.ts
  - tests/article-components.spec.ts
  - tests/article-metadata.spec.ts
  - tests/deep-linkable-anchors.spec.ts
  - tests/navigation-discovery.spec.ts
  - vite.config.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-04-15T14:32:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 07 migrated from hash-based SPA routing to path-based routing (`/article/:slug`), introduced `?section=` query-param deep links for heading anchors, added a popstate listener for back/forward section navigation, and implemented a `PathRouter` reactive controller.

The key security concern -- URL-derived `?section=` values used in `querySelector` -- is handled correctly via `CSS.escape()` in both `_onPopState` and `_scrollToSectionFromUrl`. The ID derivation from heading text uses a strict allowlist regex (`/[^\w-]/g` stripping), which prevents selector injection via article content. The slug validation (`/^[a-zA-Z0-9_-]+$/`) continues to block path traversal. Popstate listener registration and cleanup are symmetric in all three sites (PathRouter, article page, home page), using arrow-function class fields for correct `this` binding.

Three warnings were identified: an empty-ID edge case in heading anchor injection, the lack of a global link-click interceptor for SPA navigation, and duplicate heading IDs being silently overwritten. None are security vulnerabilities, but all can cause user-facing bugs under realistic conditions.

## Warnings

### WR-01: Empty heading text produces empty ID and empty `?section=` param

**File:** `src/pages/devliot-article-page.ts:131-136`
**Issue:** If an `<h2>` or `<h3>` element has empty text content (or text that consists entirely of non-`\w` characters, e.g., emoji-only headings), the derived `id` will be an empty string. This assigns `heading.id = ''` (which is a no-op for DOM ID lookup) and pushes `?section=` (empty value) into the URL on click. Subsequent `_scrollToSectionFromUrl` would call `CSS.escape('')` which returns `''`, then `querySelector('#')` which is an invalid selector and throws a `DOMException`.

**Fix:** Guard against empty IDs after the sanitization step. Skip anchor injection for headings that produce an empty ID.

```typescript
const id = (heading.textContent ?? '')
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]/g, '');

if (!id) return; // Skip headings that produce an empty ID

heading.id = id;
```

### WR-02: Duplicate heading IDs silently overwrite earlier headings

**File:** `src/pages/devliot-article-page.ts:125-136`
**Issue:** If two headings have identical text content (e.g., two `<h2>Code</h2>` elements in the same article), they will receive the same derived `id`. The DOM allows duplicate IDs but `querySelector('#code')` will only match the first one. Clicking the anchor on the second heading pushes `?section=code` into the URL, but navigating to that URL via back/forward or direct link will always scroll to the first heading, not the second. This creates a confusing user experience for articles with repeated section names.

**Fix:** Track assigned IDs and append a numeric suffix for duplicates, matching the standard GitHub/GitLab heading-slug behavior.

```typescript
const usedIds = new Set<string>();
headings.forEach((heading) => {
  if (heading.querySelector('.heading-anchor')) return;

  let id = (heading.textContent ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  if (!id) return;

  // Deduplicate: append -1, -2, etc. for repeated IDs
  let candidate = id;
  let counter = 1;
  while (usedIds.has(candidate)) {
    candidate = `${id}-${counter++}`;
  }
  id = candidate;
  usedIds.add(id);

  heading.id = id;
  // ... rest of anchor injection
});
```

### WR-03: PathRouter has no link-click interceptor -- `<a href>` links cause full page reload

**File:** `src/utils/path-router.ts` (entire file) and `src/pages/devliot-home-page.ts:195`
**Issue:** The `PathRouter` exposes a `navigate(path)` method and listens for `popstate`, but does not intercept click events on `<a>` elements. The home page renders article links as `<a href="/article/${slug}">` (line 195) and the header logo links to `<a href="/">` (`devliot-header.ts:48`). Clicking these causes a full-page reload rather than SPA navigation, because no code calls `router.navigate()` on click. This means every article click reloads the entire app shell, losing any client-side state.

This is a functional correctness issue: the app has an SPA router but internal links bypass it entirely.

**Fix:** Add a document-level click interceptor in the PathRouter's `hostConnected` that catches clicks on `<a>` elements with same-origin `href` values, calls `e.preventDefault()`, and delegates to `this.navigate()`. Alternatively, convert the article links in the home page template to use `@click` handlers that call the router, though a global interceptor is more robust and idiomatic for SPA routers.

```typescript
hostConnected() {
  window.addEventListener('popstate', this._onPopState);
  document.addEventListener('click', this._onLinkClick);
  this._resolve();
}

hostDisconnected() {
  window.removeEventListener('popstate', this._onPopState);
  document.removeEventListener('click', this._onLinkClick);
}

private _onLinkClick = (e: MouseEvent) => {
  // Only intercept unmodified left-clicks on <a> elements
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const anchor = (e.target as HTMLElement).closest('a');
  if (!anchor || !anchor.href) return;

  const url = new URL(anchor.href);
  if (url.origin !== window.location.origin) return;

  e.preventDefault();
  this.navigate(url.pathname + url.search);
};
```

## Info

### IN-01: Stale comment references "hash router"

**File:** `tests/article-components.spec.ts:153`
**Issue:** The comment reads "Note: the hash router decodes the slug before passing it to the component." Phase 07 replaced the hash router with a path-based router. This comment is now misleading.

**Fix:** Update the comment to reference the path router:
```typescript
// Note: the path router decodes the slug before passing it to the component.
```

### IN-02: `_navigateToTag` uses full-page `window.location.href` assignment instead of SPA navigation

**File:** `src/pages/devliot-article-page.ts:118`
**Issue:** `_navigateToTag` assigns `window.location.href = '/?tag=...'` which triggers a full page load. This is consistent with WR-03 (no SPA link interception exists), but is worth noting as a pattern that should be updated if WR-03 is fixed.

**Fix:** Once a link interceptor exists, replace with a plain anchor or call the router's navigate method.

### IN-03: `connectedCallback` calls `_scrollToSectionFromUrl` before content is loaded

**File:** `src/pages/devliot-article-page.ts:30`
**Issue:** In `connectedCallback` (line 30), `_scrollToSectionFromUrl()` is called immediately, but at this point `_html` is still empty and no headings exist in the DOM. The scroll attempt will always be a no-op and the `?section=` param will be stripped from the URL (the "miss" path on line 193-196). The actual effective scroll happens later in `updated()` (line 49) after `_html` is set and the DOM is populated. The `connectedCallback` call is dead code that could cause a premature strip of a valid `?section=` param if timing aligns poorly (though in practice `_html` is always empty at this point, so the article querySelector returns null before reaching the `section` querySelector).

**Fix:** Remove the `_scrollToSectionFromUrl()` call from `connectedCallback`. The `updated()` lifecycle hook already handles this correctly after content is loaded.

```typescript
connectedCallback() {
  super.connectedCallback();
  window.addEventListener('popstate', this._onPopState);
  // Scroll is handled in updated() after content loads
}
```

---

_Reviewed: 2026-04-15T14:32:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
