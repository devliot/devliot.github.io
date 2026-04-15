# Phase 8: UI Refresh - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 8 (1 new, 7 modified)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/devliot-header.ts` | component | event-driven (scroll listener + variant prop) | itself + `src/components/devliot-chart.ts` (connectedCallback lifecycle) | exact + role-match |
| `src/styles/header.css` | style | N/A | itself | exact |
| `src/styles/footer.css` | style | N/A | itself | exact |
| `src/styles/reset.css` | config | N/A | itself | exact |
| `src/devliot-app.ts` | component | request-response (router -> variant) | itself | exact |
| `tests/design-system.spec.ts` | test | assertion | itself | exact |
| `tests/navigation-discovery.spec.ts` | test | assertion | itself | exact |
| `tests/ui-refresh.spec.ts` | test | assertion | `tests/design-system.spec.ts` (computed style pattern) | role-match |

---

## Pattern Assignments

### `src/components/devliot-header.ts` (component, event-driven)

**Analog:** itself (primary) + `src/components/devliot-chart.ts` (lifecycle pattern)

**Imports pattern** (devliot-header.ts lines 1-3):

Currently only uses `state` from decorators. Must add `property` for the `variant` and `scrolled` reactive attributes:

```typescript
// CURRENT (line 1-2):
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// NEW — add property import:
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
```

**@property decorator pattern** (from `src/components/devliot-code.ts` line 10):

The codebase already uses `@property({ type: String })` without reflect. For the variant, `reflect: true` is required so CSS `:host([variant="..."])` selectors work. No existing component uses `reflect: true`, so this is a new pattern for the project:

```typescript
// devliot-code.ts line 10 — existing @property usage (no reflect):
@property({ type: String }) lang = 'text';

// NEW pattern for devliot-header.ts — with reflect:
@property({ type: String, reflect: true }) variant: 'home' | 'article' = 'home';
@property({ type: Boolean, reflect: true }) scrolled = false;
```

**connectedCallback/disconnectedCallback lifecycle pattern** (from `src/components/devliot-chart.ts` lines 36-58):

The chart component is the closest analog for the connectedCallback/disconnectedCallback lifecycle with observer setup/teardown:

```typescript
// devliot-chart.ts lines 36-41 — connectedCallback with observer:
override connectedCallback() {
  super.connectedCallback();
  this._observer = new IntersectionObserver(
    async (entries) => { /* ... */ },
    { rootMargin: '200px' }
  );
}

// devliot-chart.ts lines 54-58 — disconnectedCallback with cleanup:
override disconnectedCallback() {
  super.disconnectedCallback();
  this._observer?.disconnect();
  this._chart?.destroy();
}
```

Apply same pattern for the scroll listener in devliot-header:

```typescript
// NEW — scroll listener following the same lifecycle pattern:
connectedCallback() {
  super.connectedCallback();
  window.addEventListener('scroll', this._onScroll, { passive: true });
  this.scrolled = window.scrollY > 0;
}

disconnectedCallback() {
  window.removeEventListener('scroll', this._onScroll);
  super.disconnectedCallback();
}
```

**Existing search toggle state machine** (devliot-header.ts lines 9-44):

This entire block is preserved. The `_searchOpen`, `_searchValue`, `_toggleSearch()`, `_onSearchInput()`, `_onSearchKeydown()`, and `_dispatchSearch()` methods remain unchanged:

```typescript
// lines 9-10 — kept as-is:
@state() private _searchOpen = false;
@state() private _searchValue = '';

// lines 12-44 — all search methods kept as-is
```

**Existing render template** (devliot-header.ts lines 46-88):

The render method currently outputs both logo and search+hamburger. It will be split into variant-conditional templates:

```typescript
// CURRENT render() lines 46-88 — monolithic template with:
// - Logo link (lines 48-56)
// - Search container (lines 58-82)
// - Hamburger button (lines 83-85) — REMOVED per D-09

// NEW — variant-conditional:
render() {
  if (this.variant === 'home') {
    return html`/* search affordance only */`;
  }
  return html`/* logo only */`;
}
```

**Hamburger button to remove** (devliot-header.ts lines 83-85):

```typescript
// DELETE these lines entirely:
<button class="menu-toggle" aria-label="Ouvrir le menu">
  <span class="hamburger-icon">&#9776;</span>
</button>
```

**Search placeholder and aria-labels to update** (devliot-header.ts lines 63-65, 73-74):

```typescript
// CURRENT (line 63-64):
placeholder="Search articles..."
aria-label="Search articles"

// NEW (French):
placeholder="Rechercher un article\u2026"
aria-label="Rechercher un article"

// CURRENT (line 73):
aria-label="Search articles"

// NEW (French):
aria-label="Rechercher des articles"
```

---

### `src/styles/header.css` (style)

**Analog:** itself

**`:host` block — background change + shadow addition** (lines 2-11):

```css
/* CURRENT (lines 2-11): */
:host {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-surface-alt);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* NEW — change background, add shadow transition, keep everything else: */
:host {
  display: flex;
  align-items: center;
  justify-content: space-between;       /* becomes variant-driven below */
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-surface);  /* was --color-surface-alt */
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}
```

**New `:host([scrolled])` rule — ADD after `:host`:**

```css
:host([scrolled]) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

**New variant selectors — ADD after `:host([scrolled])`:**

```css
:host([variant="home"]) {
  justify-content: flex-end;
}

:host([variant="article"]) {
  justify-content: flex-start;
}
```

**`.menu-toggle` rules to DELETE** (lines 126-147):

```css
/* DELETE all of these (lines 126-147): */
.menu-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  color: var(--color-text);
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-toggle:hover {
  color: var(--color-accent);
}

@media (min-width: 1280px) {
  .menu-toggle {
    display: none;
  }
}
```

**Existing rules to KEEP unchanged:**

- `a` link styles (lines 13-25)
- `.logo` and `.logo--small` responsive sizing (lines 27-52)
- `.header-actions` group (lines 54-60) -- may be simplified since hamburger is removed
- `.search-container`, `.search-btn`, `.search-input` rules (lines 62-123) -- all kept

---

### `src/styles/footer.css` (style)

**Analog:** itself

**Single property change** (line 5):

```css
/* CURRENT (lines 1-9): */
:host {
  display: block;
  padding: var(--space-md);
  background-color: var(--color-surface-alt);  /* <-- change this line */
  text-align: center;
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
}

/* NEW — only line 5 changes: */
  background-color: var(--color-surface);  /* was --color-surface-alt */
```

---

### `src/styles/reset.css` (config)

**Analog:** itself

**Existing token block** (lines 10-15):

```css
/* CURRENT (lines 10-15): */
:root {
  /* Colors -- DEVLIOT brand (D-04) */
  --color-surface: #ffffff;
  --color-surface-alt: #f8f9fa;
  --color-accent: #333333;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
```

**ADD `--color-border` after `--color-text-muted`** (after line 15):

```css
  --color-border: #e5e5e5;
```

---

### `src/devliot-app.ts` (component, request-response)

**Analog:** itself

**Existing PathRouter subscription + render** (lines 14-47):

```typescript
// lines 14-17 — PathRouter setup (unchanged):
private router = new PathRouter(this, [
  { pattern: '/', render: () => html`<devliot-home-page></devliot-home-page>` },
  { pattern: '/article/:slug', render: (params) => html`<devliot-article-page .slug=${params['slug']}></devliot-article-page>` },
]);

// lines 40-46 — CURRENT render():
render() {
  return html`
    <devliot-header></devliot-header>
    <main>${this.router.outlet()}</main>
    <devliot-footer></devliot-footer>
  `;
}

// NEW render() — compute variant inline and pass as attribute:
render() {
  const variant = window.location.pathname === '/' ? 'home' : 'article';
  return html`
    <devliot-header variant="${variant}"></devliot-header>
    <main>${this.router.outlet()}</main>
    <devliot-footer></devliot-footer>
  `;
}
```

**Why this works:** PathRouter calls `this.host.requestUpdate()` in `_resolve()` (path-router.ts line 41), which re-runs `render()`. By the time `render()` executes, `window.location.pathname` is already updated via `pushState`. No `@state` field needed -- the value is derived from the URL on each render.

**Existing ResizeObserver pipeline** (lines 19-33, ZERO CHANGES NEEDED):

```typescript
// lines 19-33 — keep as-is, do not touch:
private _headerObserver?: ResizeObserver;

firstUpdated() {
  const header = this.renderRoot.querySelector('devliot-header');
  if (header) {
    this._headerObserver = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize
        ?? (entry.target as HTMLElement).offsetHeight;
      document.documentElement.style.setProperty(
        '--header-height', `${height}px`
      );
    });
    this._headerObserver.observe(header);
  }
}
```

The observer watches the host element (`<devliot-header>` tag), not shadow DOM internals. When the variant changes, the shadow DOM content changes, the host height changes, and the observer fires automatically.

---

### `tests/design-system.spec.ts` (test, assertion updates)

**Analog:** itself

**Test 1 — "header logo" (lines 10-15) — BREAKS, UPDATE:**

```typescript
// CURRENT (lines 10-15):
test('header logo -- ASCII art pre element is visible in header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const header = page.locator('devliot-header');
  const pre = header.locator('pre[aria-label="DEVLIOT"]');
  await expect(pre).toBeVisible();
});

// PROBLEM: Home page header no longer has a logo (D-04).
// FIX: Navigate to article page where logo IS visible (D-06).
// Change line 12 from `await page.goto('/')` to `await page.goto('/article/01-demo-article')`
// and add a waitForSelector for article content load.
```

**Test 2 — "code font -- Fira Code" (lines 36-44) — BREAKS, UPDATE:**

```typescript
// CURRENT (lines 36-44):
test('code font -- Fira Code is applied to code elements', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  // Test against the pre element in header (ASCII logo uses Fira Code)
  const header = page.locator('devliot-header');
  const pre = header.locator('pre');
  const fontFamily = await pre.evaluate(el => getComputedStyle(el).fontFamily);
  expect(fontFamily.toLowerCase()).toContain('fira code');
});

// PROBLEM: Home page header has no `pre` element (D-04).
// FIX: Navigate to article page. Change line 38 from `await page.goto('/')` to
// `await page.goto('/article/01-demo-article')` and add waitForSelector.
```

**Test 3 — "accent color -- links use #333333" (lines 46-54) — BREAKS, UPDATE:**

```typescript
// CURRENT (lines 46-54):
test('accent color -- links use #333333 (grayscale)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const header = page.locator('devliot-header');
  const link = header.locator('a');
  const color = await link.evaluate(el => getComputedStyle(el).color);
  // #333333 = rgb(51, 51, 51)
  expect(color).toBe('rgb(51, 51, 51)');
});

// PROBLEM: Home page header has no `a` element (D-04).
// FIX: Navigate to article page. Change line 48 from `await page.goto('/')` to
// `await page.goto('/article/01-demo-article')` and add waitForSelector.
```

**Test 4 — "hamburger button" (lines 84-95) — BREAKS, DELETE ENTIRELY:**

```typescript
// CURRENT (lines 84-95):
test('hamburger button -- visible on mobile, hidden on desktop', async ({ page }) => {
  // Mobile: hamburger visible
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const header = page.locator('devliot-header');
  const hamburger = header.locator('button[aria-label="Ouvrir le menu"]');
  await expect(hamburger).toBeVisible();

  // Desktop: hamburger hidden
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(hamburger).toBeHidden();
});

// PROBLEM: Hamburger is removed entirely (D-09).
// FIX: Delete this entire test block.
```

---

### `tests/navigation-discovery.spec.ts` (test, assertion updates)

**Analog:** itself

**Aria-label assertion 1 — search button** (line 133) — BREAKS, UPDATE:

```typescript
// CURRENT (line 133):
await expect(searchBtn).toHaveAttribute('aria-label', 'Search articles');

// NEW (French per D-05 / UI-SPEC):
await expect(searchBtn).toHaveAttribute('aria-label', 'Rechercher des articles');
```

**Aria-label assertion 2 — search input** (line 143) — BREAKS, UPDATE:

```typescript
// CURRENT (line 143):
await expect(searchInput).toHaveAttribute('aria-label', 'Search articles');

// NEW (French per D-05 / UI-SPEC):
await expect(searchInput).toHaveAttribute('aria-label', 'Rechercher un article');
```

**All other tests in this file PASS unchanged.** The `.search-btn` and `.search-input` selectors still work because the search affordance exists in the home variant, and all tests in this file navigate to `/` (home page).

---

### `tests/ui-refresh.spec.ts` (test, NEW FILE)

**Analog:** `tests/design-system.spec.ts` (computed style assertions through shadow DOM)

**Test file structure pattern** (design-system.spec.ts lines 1-7):

```typescript
import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;
```

**Computed style assertion through Lit shadow DOM** (design-system.spec.ts lines 68-73):

Playwright auto-pierces shadow DOM for locators, but `getComputedStyle()` must be called on the host element. The `toHaveCSS` matcher works on Lit custom elements because Playwright evaluates it on the resolved element:

```typescript
// design-system.spec.ts lines 68-73 — sticky header position check:
test('sticky header -- position is sticky', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const header = page.locator('devliot-header');
  await expect(header).toHaveCSS('position', 'sticky');
});
```

Apply same pattern for background-color, box-shadow checks:

```typescript
// NEW — white background check (UI-01):
const header = page.locator('devliot-header');
await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');

// NEW — no shadow at top (UI-01):
await expect(header).toHaveCSS('box-shadow', 'none');
```

**Scroll + computed style pattern** (from RESEARCH.md Q2, following design-system.spec.ts style):

```typescript
// Scroll the page then re-check computed style:
await page.evaluate(() => window.scrollTo(0, 100));
await page.waitForTimeout(300); // transition 0.2s + buffer
const shadow = await page.locator('devliot-header').evaluate(
  el => getComputedStyle(el).boxShadow
);
expect(shadow).not.toBe('none');
```

**Element presence/absence checks** (from navigation-discovery.spec.ts lines 127-143):

```typescript
// Presence check (search button visible):
const searchBtn = header.locator('.search-btn');
await expect(searchBtn).toBeVisible();

// Absence check (logo not rendered):
const logo = header.locator('pre[aria-label="DEVLIOT"]');
await expect(logo).toHaveCount(0);
```

**Article page wait pattern** (from article-components.spec.ts lines 9-11):

```typescript
// Wait for article content before asserting header variant:
await page.goto('/article/01-demo-article');
await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
```

---

## Shared Patterns

### CSS-in-file with `?inline` imports

**Source:** Every component in `src/components/`
**Apply to:** `devliot-header.ts` (already uses this pattern -- no change)

```typescript
// devliot-header.ts line 3:
import headerStyles from '../styles/header.css?inline';

// devliot-header.ts line 7:
static styles = unsafeCSS(headerStyles);
```

### `:host` attribute selectors for variant styling

**Source:** No existing component uses this, but it is the canonical Lit pattern (verified in RESEARCH.md Q5). The closest project analog is `:host { ... }` in every component CSS.
**Apply to:** `header.css` for `:host([variant="home"])`, `:host([variant="article"])`, `:host([scrolled])`

```css
/* Pattern: `:host([attribute="value"])` matches when the host element has that attribute */
:host([variant="home"]) {
  justify-content: flex-end;
}
```

### Playwright shadow DOM assertion pattern

**Source:** `tests/design-system.spec.ts` lines 68-73
**Apply to:** `tests/ui-refresh.spec.ts` for all computed style checks

Playwright's `toHaveCSS()` works on Lit custom elements because Playwright auto-resolves the element. For shadow DOM internal elements, use `.locator()` which auto-pierces shadow boundaries.

```typescript
// Host-level CSS (works directly):
await expect(page.locator('devliot-header')).toHaveCSS('position', 'sticky');

// Shadow DOM internal element (auto-piercing):
const pre = page.locator('devliot-header').locator('pre[aria-label="DEVLIOT"]');
await expect(pre).toBeVisible();
```

### Playwright test structure

**Source:** `tests/design-system.spec.ts` lines 1-7, `tests/navigation-discovery.spec.ts` lines 1-4
**Apply to:** `tests/ui-refresh.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const HOME_URL = '/';
const DEMO_ARTICLE_URL = '/article/01-demo-article';

test.describe('UI Refresh (Phase 8)', () => {
  // tests here
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | | | All files have analogs -- most are modifications to existing files, and the new test file follows established Playwright patterns |

---

## Metadata

**Analog search scope:** `src/components/`, `src/styles/`, `src/`, `tests/`
**Files scanned:** 14 source files + 5 test files
**Pattern extraction date:** 2026-04-15

---

## PATTERN MAPPING COMPLETE

**Phase:** 8 - UI Refresh
**Files classified:** 8
**Analogs found:** 8 / 8

### Coverage
- Files with exact analog: 7 (all modifications to existing files, plus the new test file maps to design-system.spec.ts)
- Files with role-match analog: 1 (devliot-header.ts connectedCallback pattern from devliot-chart.ts)
- Files with no analog: 0

### Key Patterns Identified
- All components use CSS-in-file with `?inline` imports and `unsafeCSS()` -- no inline styles in templates
- `@property({ type: String })` is used in `devliot-code.ts` and `devliot-chart.ts` but none use `reflect: true` yet -- this is a new pattern needed for `:host([variant="..."])` CSS selectors
- `connectedCallback()/disconnectedCallback()` lifecycle with observer setup/teardown is established in `devliot-chart.ts` -- same pattern applies for the scroll listener in `devliot-header.ts`
- Playwright tests use `toHaveCSS()` for computed style assertions on Lit host elements and `.locator()` for shadow DOM piercing -- both patterns needed for `ui-refresh.spec.ts`
- PathRouter calls `host.requestUpdate()` on route change, making inline variant computation in `render()` the simplest approach (no `@state` field needed)

### File Created
`/Users/eliott/dev/devliot/.planning/phases/08-ui-refresh/08-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files.
