---
phase: 08-ui-refresh
reviewed: 2026-04-15T12:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/components/devliot-header.ts
  - src/devliot-app.ts
  - src/styles/footer.css
  - src/styles/header.css
  - src/styles/reset.css
  - tests/design-system.spec.ts
  - tests/navigation-discovery.spec.ts
  - tests/ui-refresh.spec.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-04-15T12:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

The Phase 8 UI refresh is well-structured. The Lit 3 reactive property and attribute reflection for `variant` and `scrolled` are correctly implemented. The scroll event listener lifecycle is clean -- `_onScroll` is a stable arrow-function class field ensuring proper add/remove pairing, and `disconnectedCallback` calls `super` correctly. No memory leaks around custom event dispatch (`devliot-search` uses standard `CustomEvent` with `bubbles: true, composed: true`, no retained references). The monochrome constraint is respected in all reviewed CSS files; the only `rgba` value (`0, 0, 0, 0.08` for box-shadow) is a neutral black alpha. The `--header-height` ResizeObserver pipeline from Phase 7 (D-10) is preserved in `devliot-app.ts` with proper cleanup in `disconnectedCallback`.

Two warnings and three informational items follow.

## Warnings

### WR-01: Search input CSS transition is dead code (conditional rendering defeats animation)

**File:** `src/styles/header.css:116-122` and `src/components/devliot-header.ts:79-91`
**Issue:** The CSS declares a `transition: width 0.2s ease, opacity 0.2s ease` on `.search-input`, with a base state of `width: 0; opacity: 0` and an open state of `width: 180px; opacity: 1`. However, the input element is conditionally rendered via Lit's template (`${this._searchOpen ? html\`<input .../>\` : ''}`). When `_searchOpen` becomes `true`, both the input and the `search-container--open` class appear in the same render cycle, so the input is born into the DOM already matching the open selector. The transition from `width: 0` to `width: 180px` never fires because the element never exists in the closed state. Similarly, on close the input is removed from the DOM entirely, so no closing animation plays.

This means users see a jarring instant-appear/instant-disappear for the search field rather than a smooth expand/collapse.

**Fix:** Either (a) keep the input always in the DOM and toggle visibility via CSS class only, or (b) remove the dead transition declarations. Option (a) preserves the intended animation:

```typescript
// In render() for the home variant, always render the input:
<input
  class="search-input"
  type="text"
  placeholder="Rechercher un article..."
  aria-label="Rechercher un article"
  role="search"
  tabindex="${this._searchOpen ? 0 : -1}"
  .value=${this._searchValue}
  @input=${this._onSearchInput}
  @keydown=${this._onSearchKeydown}
/>
```

With this approach, the `search-container--open` class toggles the CSS width/opacity transition on an element already in the DOM, and the animation fires correctly. Use `tabindex="-1"` when closed to keep it out of the tab order.

### WR-02: Tests rely on hardcoded `waitForTimeout` -- flaky on CI

**File:** `tests/navigation-discovery.spec.ts:163,219` and `tests/ui-refresh.spec.ts:31`
**Issue:** Three tests use `page.waitForTimeout(500)` or `page.waitForTimeout(300)` to wait for debounce and CSS transitions. Hardcoded waits are a well-known source of flakiness: too short on slow CI runners (false failures), too long on fast machines (slow test suite). The 300ms wait for scroll shadow (ui-refresh.spec.ts:31) is particularly fragile since it relies on CSS transition timing.

**Fix:** Replace hardcoded waits with condition-based assertions that Playwright auto-retries:

```typescript
// Instead of waitForTimeout(500) + manual count check:
await expect(homePage.locator('.article-row').first()).toBeVisible({ timeout: 5000 });

// Instead of waitForTimeout(300) for scroll shadow:
await expect(page.locator('devliot-header')).not.toHaveCSS('box-shadow', 'none', { timeout: 2000 });

// For the empty state after search:
await expect(homePage.locator('.empty-state')).toBeVisible({ timeout: 5000 });
```

Playwright's `expect` with auto-retry handles timing variance without hardcoded sleeps.

## Info

### IN-01: `logo--small` font-size uses hardcoded px values instead of design tokens

**File:** `src/styles/header.css:53-65`
**Issue:** The `.logo--small` class uses `font-size: 6px`, `8px`, and `10px` across breakpoints. These are not part of the design token system defined in `reset.css` (which has `--font-size-body: 16px` and `--font-size-label: 14px`). While ASCII art sizing is a special case that may not fit the standard type scale, the magic numbers could be extracted to custom properties for easier tuning.

**Fix:** Define logo-specific tokens:
```css
:root {
  --font-size-logo-sm: 6px;
  --font-size-logo-md: 8px;
  --font-size-logo-lg: 10px;
}
```

### IN-02: `devliot-header.ts` imports `PropertyValues` from `@lit/reactive-element` instead of `lit`

**File:** `src/components/devliot-header.ts:3`
**Issue:** The import `import type { PropertyValues } from '@lit/reactive-element'` works but is unconventional. The canonical Lit 3 import path is `import type { PropertyValues } from 'lit'`, which re-exports the same type. Using the internal package directly couples the code to Lit's package structure.

**Fix:**
```typescript
import type { PropertyValues } from 'lit';
```

### IN-03: Navigation discovery tests silently skip when `Tutorial` chip is absent

**File:** `tests/navigation-discovery.spec.ts:48,70`
**Issue:** Two tests (`NAV-01: clicking a filter chip shows only matching articles` and `NAV-01: clicking active filter chip deactivates it`) wrap their core assertions inside `if (await tutorialChip.count() > 0)`. If the demo data changes and the `Tutorial` chip no longer exists, these tests pass silently without exercising any filtering logic. This defeats the purpose of regression testing.

**Fix:** Replace the conditional with an explicit assertion that the chip exists, or use `test.skip` with a clear reason:
```typescript
const tutorialChip = homePage.locator('.chip', { hasText: 'Tutorial' });
await expect(tutorialChip).toBeVisible({ timeout: 10000 });
await tutorialChip.click();
// ... rest of assertions
```

---

_Reviewed: 2026-04-15T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
