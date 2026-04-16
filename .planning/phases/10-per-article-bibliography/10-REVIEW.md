---
phase: 10-per-article-bibliography
reviewed: 2026-04-16T14:30:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/pages/devliot-article-page.ts
  - src/styles/article.css
  - tests/per-article-bibliography.spec.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-16T14:30:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 10 adds per-article bibliography support: a references section rendered below article content, inline citation link injection via DOM tree walking, and bidirectional scroll navigation between citations and reference entries. The implementation is well-structured with good defensive patterns (slug validation, double-injection guards, race-condition handling for async fetches, code/pre element skipping during tree walk). CSS additions are clean and follow existing conventions.

One warning relates to test reliability (flaky timeout patterns). Two info items note minor code quality observations.

No security issues. The existing `SLUG_PATTERN` validation and `CSS.escape()` usage in query selectors properly mitigate injection vectors. The `unsafeHTML` usage for article content is pre-existing and out of scope for this diff.

## Warnings

### WR-01: Flaky `waitForTimeout` in scroll tests

**File:** `tests/per-article-bibliography.spec.ts:147`, `tests/per-article-bibliography.spec.ts:174`
**Issue:** Two tests use `await page.waitForTimeout(1500)` to wait for scroll completion. This is a known Playwright anti-pattern that causes flaky tests -- on slow CI runners the scroll may not complete in 1500ms, and on fast machines it wastes test time. The `scrollIntoView({ behavior: 'instant' })` call in the component should complete synchronously (no animation), making the 1500ms wait both unnecessary and unreliable.
**Fix:** Replace `waitForTimeout` with a deterministic assertion. Since scroll behavior is `'instant'` (not `'smooth'`), you can poll for the element to be in viewport:
```typescript
// Instead of: await page.waitForTimeout(1500);
// Use a viewport check that auto-retries:
await expect(async () => {
  const box = await page.locator('devliot-article-page').locator('#ref-3').boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThan(0);
  expect(box!.y).toBeLessThan(viewport!.height);
}).toPass({ timeout: 5000 });
```

## Info

### IN-01: Citation ID regex is lowercase-only while slug pattern allows uppercase

**File:** `src/pages/devliot-article-page.ts:206`
**Issue:** The citation marker regex `/\[([a-z0-9][a-z0-9-]*)\]/g` only matches lowercase IDs, while `SLUG_PATTERN` at line 11 allows uppercase `[a-zA-Z0-9_-]+`. The `BibliographyEntry.id` JSDoc specifies lowercase (`/^[a-z0-9-]+$/`), so the regex is correct per the type contract. However, if an article author accidentally writes `[Vaswani-2017]` instead of `[vaswani-2017]`, it would silently remain as plain text with no feedback. This is by design (D-15) but worth noting for future documentation or authoring tooling.
**Fix:** No code change needed. Consider adding a note in article authoring documentation that bibliography markers are case-sensitive and must be lowercase.

### IN-02: Semantic mismatch between `<ol>` and manual `[N]` numbering

**File:** `src/pages/devliot-article-page.ts:330`
**Issue:** The references section uses `<ol class="ref-list">` (ordered list) but CSS sets `list-style: none` and each `<li>` manually prefixes `[${n}]`. The `<ol>` element implies browser-managed numbering which is then hidden. This is not a bug -- screen readers still announce list semantics -- but using `<ul>` or `<div role="list">` would be more semantically precise since numbering is author-managed.
**Fix:** Optional cleanup -- no functional impact. If desired, switch to `<ul>` since numbering is manually controlled.

---

_Reviewed: 2026-04-16T14:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
