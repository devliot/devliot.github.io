# Phase 8: UI Refresh - Research

**Researched:** 2026-04-15
**Domain:** Lit 3 web component styling, scroll-event patterns, attribute-driven variant rendering
**Confidence:** HIGH

## Summary

Phase 8 is a visual refresh of the header and footer chrome. The header gains a `variant` attribute (`home` | `article`) driven by `devliot-app`, which already re-renders on route changes via the PathRouter controller. The footer changes are trivial (one CSS property). The primary technical concerns are: (1) the scroll-shadow listener lifecycle in the header component, (2) attribute reflection so `:host([variant="..."])` selectors work in the external CSS, (3) preserving the Phase 7 ResizeObserver pipeline across variant swaps, and (4) updating tests that assert on the now-removed hamburger button and on the header logo being visible on the home page.

**Primary recommendation:** Use `@property({ type: String, reflect: true })` for the `variant` attribute and a `@state()` boolean `_scrolled` with a passive scroll listener attached in `connectedCallback()`. The ResizeObserver pipeline in `devliot-app.ts` requires zero changes -- it observes the host element, not shadow DOM internals, and fires automatically when the header's rendered height changes between variants. The variant computation in `devliot-app` is a simple inline expression in the render template (`window.location.pathname === '/' ? 'home' : 'article'`), which re-evaluates naturally because PathRouter calls `requestUpdate()` on every route change.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Header uses a scroll-activated shadow as its separator (no static border). Shadow absent at scroll=0, appears on scroll. Monochrome only.
- D-02: Footer has no separator. White on white.
- D-03: New `--color-border` token in reset.css (suggested #e5e5e5).
- D-04: Home variant -- only collapsible search affordance (preserve existing toggle pattern).
- D-05: French placeholder `Rechercher un article...`
- D-06: Article variant -- only DEVLIOT ASCII logo, no search/hamburger.
- D-07: Logo left-aligned, same scale (6/8/10px), links to `/`.
- D-08: Variant detection prop-driven from `devliot-app` (`<devliot-header variant="home|article">`).
- D-09: Hamburger button removed entirely from both variants.
- D-10: --header-height ResizeObserver pipeline must keep working.

### Claude's Discretion
- Exact pixel values for the scroll-shadow (offset, blur, alpha).
- Exact pixel value for `--color-border` (#e5e5e5 suggested but adjustable).
- Whether shadow fades in via `transition: box-shadow` or pops in immediately.
- Scroll threshold for triggering shadow (0 vs small buffer).
- Whether `devliot-app` computes variant via `@state` field or inline expression.
- How header re-renders on SPA route changes.

### Deferred Ideas (OUT OF SCOPE)
- Hamburger menu functionality -- removed, re-add in a dedicated phase.
- Dark mode / theme toggle -- monochrome palette is non-negotiable.
- SPA route transition animations -- variant swap is instantaneous.
- Mobile navigation drawer -- no menu content exists.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Fond du header en blanc, avec separation minimale (border 1px ou ombre au scroll, pas d'accent colore) | Scroll-shadow technique (Q2), attribute-reflected variant property (Q1), CSS `:host([scrolled])` pattern (Q5) |
| UI-02 | Fond du footer en blanc, typographie contrastee mais monochrome | Footer CSS change (Q6) -- single property swap, no separator removal needed |
| UI-03 | Sur la page d'accueil, header contient uniquement la barre de recherche | Home variant render path (Q1), variant computation from PathRouter (Q4) |
| UI-04 | Sur les pages article, header contient uniquement le logo DEVLIOT | Article variant render path (Q1), variant computation from PathRouter (Q4) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Header variant rendering | Browser / Client (Lit shadow DOM) | -- | Pure client-side component rendering based on reactive attribute |
| Scroll-shadow activation | Browser / Client (scroll listener) | -- | Window scroll event drives a `@state` boolean; no server involvement |
| Variant computation | Browser / Client (devliot-app) | -- | PathRouter is client-side; route change triggers `requestUpdate()` |
| Footer background change | Browser / Client (CSS) | -- | Single CSS property change in footer.css |
| ResizeObserver pipeline | Browser / Client (devliot-app) | -- | Already established in Phase 7; observes host element dimensions |
| Design token addition | Browser / Client (CSS custom property) | -- | `--color-border` added to `:root` in reset.css |

## Technical Approach

### Q1: Lit Reactive Attribute -> Re-render Mechanics (variant prop)

**Findings -- HIGH confidence** [VERIFIED: Context7 /lit/lit.dev, docs v3 properties]

The correct pattern for the `variant` attribute on `devliot-header` is:

```typescript
import { property } from 'lit/decorators.js';

@property({ type: String, reflect: true })
variant: 'home' | 'article' = 'home';
```

Key mechanics:
1. **`@property` (not `@state`)** -- because the value is set externally by `devliot-app` via an HTML attribute. `@state` is for internal-only reactive state.
2. **`reflect: true`** -- syncs the property value back to the HTML attribute on the host element. This is critical because the CSS needs `:host([variant="home"])` and `:host([variant="article"])` to match.
3. **Default `'home'`** -- per D-04/D-08, the home variant is the fallback.
4. **Re-render on change** -- Lit's reactive system calls `render()` whenever a `@property` changes. The render method uses a conditional (`this.variant === 'home'`) to produce different templates.

**Interaction with existing search toggle state:** When the variant switches from `home` to `article` (user navigates to an article), the search toggle state (`_searchOpen`, `_searchValue`) becomes irrelevant because the article variant doesn't render the search affordance. The `@state` fields remain on the class instance but are not referenced in the article template. When the user navigates back to home, `_searchOpen` will still be `false` and `_searchValue` will be `''` from their initial/reset state. **No explicit reset is needed** -- the state naturally stays collapsed. However, the UI-SPEC states "search state resets to collapsed/empty when switching away from home variant," so adding an explicit reset in `willUpdate()` when variant changes is a clean defensive measure:

```typescript
willUpdate(changed: PropertyValues) {
  if (changed.has('variant') && this.variant !== 'home') {
    this._searchOpen = false;
    this._searchValue = '';
  }
}
```

[VERIFIED: Context7 /lit/lit.dev] The `willUpdate()` lifecycle runs before `render()` and is the idiomatic place for derived-state cleanup.

### Q2: Scroll-Shadow Technique

**Findings -- HIGH confidence** [VERIFIED: Context7 /lit/lit.dev lifecycle docs, Lit event listener pattern]

Three options were evaluated:

| Approach | Cross-browser | Perf cost | Complexity |
|----------|--------------|-----------|------------|
| `scroll` listener + `@state` boolean | All browsers | Minimal (passive, boolean flip) | Low |
| IntersectionObserver sentinel | All browsers | Lower (no scroll handler) | Medium (sentinel element, threshold tuning) |
| CSS `animation-timeline: scroll()` | Chromium + Safari only (no Firefox) | Zero JS | Low CSS, but Firefox excluded |

**Recommendation: Scroll listener + `@state` boolean.** Rationale:

1. **Cross-browser safe today.** Firefox lacks `animation-timeline: scroll()` support [ASSUMED -- based on training data, Baseline status as of early 2025].
2. **Minimal perf cost.** A passive scroll listener that reads `window.scrollY` and flips a boolean is trivially cheap. The re-render only fires on the boolean transition (scrollY crossing 0), not on every scroll pixel, because Lit's `@state` only triggers re-render when the value actually changes.
3. **Simpler than IntersectionObserver sentinel.** The sentinel approach requires inserting an invisible element above the header and tuning `rootMargin`. For a single boolean ("scrolled or not"), a scroll listener is more readable and fewer moving parts.

**Implementation pattern** (from UI-SPEC, verified against Lit lifecycle docs):

```typescript
// In devliot-header.ts

@state() private _scrolled = false;

private _onScroll = () => {
  const scrolled = window.scrollY > 0;
  if (scrolled !== this._scrolled) {
    this._scrolled = scrolled;
  }
};

connectedCallback() {
  super.connectedCallback();
  window.addEventListener('scroll', this._onScroll, { passive: true });
  // Sync initial state (page might already be scrolled on reconnect)
  this._scrolled = window.scrollY > 0;
}

disconnectedCallback() {
  window.removeEventListener('scroll', this._onScroll);
  super.disconnectedCallback();
}
```

**Attribute reflection for CSS:** The `_scrolled` state needs to be visible to CSS as a host attribute. Two approaches:

- **Option A:** Use `@property({ type: Boolean, reflect: true, attribute: 'scrolled' })` instead of `@state()`. Simpler, but exposes an attribute that external consumers could set.
- **Option B:** Keep `@state()` and manually call `this.toggleAttribute('scrolled', this._scrolled)` in `updated()`. More explicit control.

**Recommendation: Option A** -- use `@property({ type: Boolean, reflect: true, attribute: 'scrolled' })`. The attribute is cosmetic (CSS hook), and no external consumer will set it. The simplicity of automatic reflection outweighs the theoretical concern. [VERIFIED: Context7 shows `reflect: true` on boolean properties removes the attribute when `false` and adds it when `true`.]

**CSS pattern:**
```css
:host {
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}

:host([scrolled]) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

**Shadow values:** The UI-SPEC specifies `0 1px 3px rgba(0, 0, 0, 0.08)` with `transition: box-shadow 0.2s ease`. The 0.2s transition handles sub-pixel scroll bounce at `scrollY === 0` threshold, eliminating the need for a buffer threshold. These values are locked in the UI-SPEC.

### Q3: ResizeObserver Pipeline Interaction with Variant Swap

**Findings -- HIGH confidence** [VERIFIED: reading `devliot-app.ts` source code]

The ResizeObserver in `devliot-app.ts firstUpdated()` (lines 22-32) does:

```typescript
const header = this.renderRoot.querySelector('devliot-header');
this._headerObserver = new ResizeObserver(([entry]) => { ... });
this._headerObserver.observe(header);
```

**Critical insight:** The observer is attached to the `devliot-header` **host element** (the custom element tag itself), NOT to any shadow DOM child. When the variant changes:

1. Lit re-renders the header's **shadow DOM content** (different template for home vs article).
2. The host element (`<devliot-header>`) stays the same DOM node -- it is never removed/re-created.
3. The rendered height changes (search-only header vs logo-only header differ).
4. ResizeObserver fires because the host element's `borderBoxSize` changed.
5. `--header-height` updates on `:root`.

**Conclusion: Zero changes needed to the ResizeObserver pipeline.** The observer survives variant swaps because it watches the host, not the shadow internals. This was explicitly designed in Phase 7 (see 07-01-SUMMARY.md: "Phase 8 header content changes will be absorbed automatically since ResizeObserver fires on dimension changes").

**Verification approach:** The existing `ANCH-03` Playwright test (`deep-linkable-anchors.spec.ts` line 47-60) asserts that a heading lands below the header. If the ResizeObserver pipeline breaks, this test fails. No new test needed for pipeline integrity -- just keep the existing test green.

### Q4: PathRouter -> Variant Computation

**Findings -- HIGH confidence** [VERIFIED: reading `path-router.ts` and `devliot-app.ts` source code]

The PathRouter is a Lit `ReactiveController`. When the URL changes (via `navigate()` or `popstate`), it calls `this.host.requestUpdate()` (path-router.ts line 41). This causes `devliot-app.render()` to re-execute.

The variant computation does NOT need a `@state` field or any subscription mechanism. It can be computed inline in the render template:

```typescript
render() {
  const variant = window.location.pathname === '/' ? 'home' : 'article';
  return html`
    <devliot-header variant="${variant}"></devliot-header>
    <main>${this.router.outlet()}</main>
    <devliot-footer></devliot-footer>
  `;
}
```

**Why this works:**
- `render()` is called on every route change (PathRouter calls `requestUpdate()`).
- `window.location.pathname` is already updated by the time `render()` executes (PathRouter updates it via `pushState` before calling `requestUpdate`).
- No need for a `@state` field because the value is derived from the URL, not from component state.

**Alternative (explicit `@state`):** Add a `@state() private _headerVariant: 'home' | 'article' = 'home';` and compute it in `willUpdate()`. This is more explicit but adds unnecessary state synchronization. The inline approach is simpler and equally correct because `render()` is always called after the URL has changed.

**Recommendation:** Use the inline approach. It's idiomatic for derived values in Lit and avoids a redundant state field.

### Q5: CSS Attribute Selector Pattern in Lit Shadow DOM

**Findings -- HIGH confidence** [VERIFIED: Context7 /lit/lit.dev, tutorial example with `:host([vote=up])`]

The `:host([variant="home"])` selector works exactly as expected in Lit shadow DOM:

1. `@property({ type: String, reflect: true }) variant` adds/updates the `variant` attribute on the host element.
2. Shadow DOM CSS `:host([variant="home"])` matches when the host has `variant="home"`.
3. This is the canonical Lit pattern for variant-driven styling -- Context7 shows an identical example with `:host([vote=up])` and `:host([vote=down])`.

```css
:host([variant="home"]) {
  justify-content: flex-end;  /* search affordance right-aligned */
}

:host([variant="article"]) {
  justify-content: flex-start;  /* logo left-aligned */
}
```

**No caveats.** The attribute reflection is synchronous within Lit's update cycle. The CSS selector matches immediately after the property change triggers a re-render.

### Q6: Footer "No Separator" + Content Reflow

**Findings -- HIGH confidence** [VERIFIED: reading `footer.css`, `article.css`, `app.css` source code]

Current `footer.css` `:host`:
```css
background-color: var(--color-surface-alt);
```

The change is a single property swap:
```css
background-color: var(--color-surface);
```

**No existing separator to remove.** The footer has:
- No `border-top`
- No `box-shadow`
- No pseudo-element divider

The `devliot-app` uses `flex-direction: column; min-height: 100vh` with `main { flex: 1 }`, so the footer is pushed to the bottom. The transition from `main` content to footer is seamless -- the `main` element has no bottom border, and the footer has no top separator.

The last visual element before the footer on an article page is `.article-tags` which has `border-top: 1px solid #eeeeee`. This sits inside the article component's shadow DOM and is unaffected by the footer change. The article's `:host { display: block }` has no bottom padding/margin that would create a visible gap.

**Conclusion: The footer change is literally one CSS property. No other file needs modification for UI-02.**

### Q7: Test Impact Analysis

**Findings -- HIGH confidence** [VERIFIED: reading all 4 test files]

#### Tests that WILL BREAK (must be updated):

1. **`tests/design-system.spec.ts` line 84-95: "hamburger button -- visible on mobile, hidden on desktop"**
   - Asserts `button[aria-label="Ouvrir le menu"]` is visible on mobile and hidden on desktop.
   - The hamburger is removed entirely (D-09).
   - **Action:** DELETE this test entirely.

2. **`tests/design-system.spec.ts` line 10-15: "header logo -- ASCII art pre element is visible in header"**
   - Navigates to `/` (home page) and asserts `pre[aria-label="DEVLIOT"]` is visible in the header.
   - In the new home variant, the header has NO logo (D-04).
   - **Action:** UPDATE this test. Either:
     - (a) Change it to navigate to an article page where the logo IS in the header, or
     - (b) Split into two tests: one for home variant (assert logo absent), one for article variant (assert logo present).
   - Recommended: option (b) -- two variant-specific assertions.

3. **`tests/design-system.spec.ts` line 49-54: "accent color -- links use #333333"**
   - Navigates to `/` and asserts `header.locator('a')` has color `rgb(51, 51, 51)`.
   - In the home variant, there is NO `<a>` element in the header (no logo link).
   - **Action:** UPDATE to navigate to an article page, or conditionalize.

4. **`tests/design-system.spec.ts` line 38-44: "code font -- Fira Code is applied to code elements"**
   - Navigates to `/` and tests `header.locator('pre')` for Fira Code font.
   - In the home variant, there is NO `<pre>` element in the header (no logo).
   - **Action:** UPDATE to navigate to an article page.

5. **`tests/navigation-discovery.spec.ts` line 133: aria-label assertion `'Search articles'`**
   - Asserts `aria-label="Search articles"` on the search button.
   - The aria-label changes to French: `"Rechercher des articles"` (UI-SPEC).
   - **Action:** UPDATE the expected aria-label string to `'Rechercher des articles'`.

6. **`tests/navigation-discovery.spec.ts` line 143: aria-label assertion `'Search articles'` on input**
   - Asserts `aria-label="Search articles"` on the search input.
   - Changes to `"Rechercher un article"` (UI-SPEC).
   - **Action:** UPDATE the expected aria-label string to `'Rechercher un article'`.

#### Tests that will PASS without changes:

1. **`tests/deep-linkable-anchors.spec.ts`** -- All 6 tests. They navigate to `/article/01-demo-article` which gets `variant="article"`. The header is present and sticky. The tests assert heading position relative to header bottom, not header internals. The only risk is if the article-variant header has a significantly different height -- but the `scroll-margin-top` pipeline adjusts automatically.

2. **`tests/navigation-discovery.spec.ts`** -- Most tests. They navigate to `/` which gets `variant="home"`. The search button (`.search-btn`) and search input (`.search-input`) are still rendered in the home variant. Selectors match. The exceptions are the aria-label assertions noted above.

3. **`tests/article-components.spec.ts`** -- All tests. They navigate to `/article/01-demo-article` and assert article content rendering. No header assertions.

4. **`tests/design-system.spec.ts` line 68-73: "sticky header -- position is sticky"** -- Passes unchanged. Both variants use `position: sticky`.

5. **`tests/design-system.spec.ts` line 75-81: "max-width"** -- Passes unchanged. Tests `main` max-width, not header.

6. **`tests/design-system.spec.ts` line 57-63: "no horizontal overflow"** -- Passes unchanged. Layout test, unaffected.

7. **`tests/design-system.spec.ts` line 17-25: "hero logo -- ASCII art pre element is visible on home page"** -- Passes unchanged. Tests `devliot-home-page` component, not the header.

8. **`tests/design-system.spec.ts` line 28-34: "body font -- Inter is applied to body text"** -- Passes unchanged. Tests `body`, not header.

#### Summary table:

| Test File | Test | Status | Action |
|-----------|------|--------|--------|
| design-system.spec.ts | hamburger button | BREAKS | Delete |
| design-system.spec.ts | header logo | BREAKS | Update (navigate to article page) |
| design-system.spec.ts | accent color links | BREAKS | Update (navigate to article page) |
| design-system.spec.ts | code font Fira Code | BREAKS | Update (navigate to article page) |
| navigation-discovery.spec.ts | NAV-04 search icon expand (aria-label) | BREAKS | Update aria-label to French |
| navigation-discovery.spec.ts | NAV-04 search input (aria-label) | BREAKS | Update aria-label to French |
| deep-linkable-anchors.spec.ts | All 6 | PASSES | None |
| article-components.spec.ts | All 8 | PASSES | None |

### Q8: Validation Architecture

Covered in the dedicated section below.

## Files to Create/Modify

| File | Action | Rationale |
|------|--------|-----------|
| `src/components/devliot-header.ts` | MODIFY | Add `variant` @property (reflect:true), add `scrolled` @property (reflect:true), add scroll listener in connectedCallback/disconnectedCallback, split render() into variant-conditional templates, remove hamburger button, update aria-labels to French, update search placeholder to French |
| `src/styles/header.css` | MODIFY | Change bg to `--color-surface`, add `:host([scrolled])` shadow, add `:host([variant="home"])` and `:host([variant="article"])` layout rules, remove all `.menu-toggle` rules, add `transition: box-shadow 0.2s ease` to `:host` |
| `src/styles/footer.css` | MODIFY | Change `background-color` from `--color-surface-alt` to `--color-surface` |
| `src/styles/reset.css` | MODIFY | Add `--color-border: #e5e5e5` to `:root` |
| `src/devliot-app.ts` | MODIFY | Compute variant from `window.location.pathname` in render(), pass as attribute to `<devliot-header variant="${variant}">` |
| `tests/design-system.spec.ts` | MODIFY | Delete hamburger test, update header logo / accent color / code font tests to navigate to article page, optionally add variant-specific assertions |
| `tests/navigation-discovery.spec.ts` | MODIFY | Update aria-label assertions from English to French |
| `tests/ui-refresh.spec.ts` | CREATE | New Playwright E2E tests for UI-01 through UI-04 (white bg, scroll shadow, home variant, article variant) |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (via @playwright/test) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/ui-refresh.spec.ts --project=chromium` |
| Full suite command | `npx playwright test --project=chromium` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01a | Header background is white (`rgb(255, 255, 255)`) | E2E (computed style) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-01.*white" --project=chromium -x` | Wave 0 |
| UI-01b | Scroll shadow absent at scroll=0 | E2E (computed style) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-01.*shadow.*absent" --project=chromium -x` | Wave 0 |
| UI-01c | Scroll shadow appears after scrolling | E2E (computed style + scroll) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-01.*shadow.*appears" --project=chromium -x` | Wave 0 |
| UI-02 | Footer background is white | E2E (computed style) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-02" --project=chromium -x` | Wave 0 |
| UI-03a | Home header has search button, no logo | E2E (element presence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-03.*search.*no logo" --project=chromium -x` | Wave 0 |
| UI-03b | Home header has no hamburger | E2E (element absence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-03.*no hamburger" --project=chromium -x` | Wave 0 |
| UI-04a | Article header has logo, no search | E2E (element presence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-04.*logo.*no search" --project=chromium -x` | Wave 0 |
| UI-04b | Article header has no hamburger | E2E (element absence) | `npx playwright test tests/ui-refresh.spec.ts -g "UI-04.*no hamburger" --project=chromium -x` | Wave 0 |
| D-10 | ResizeObserver pipeline still works (heading below header) | E2E (existing) | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-03" --project=chromium -x` | Exists |
| REGR | Existing 47 tests stay green | E2E (full suite) | `npx playwright test --project=chromium` | Exists |

### Testing Patterns for Each Assertion Type

**White background check (UI-01, UI-02):**
```typescript
// Playwright evaluates computed style through shadow DOM
const bgColor = await page.locator('devliot-header').evaluate(
  el => getComputedStyle(el).backgroundColor
);
expect(bgColor).toBe('rgb(255, 255, 255)');
```

**Scroll shadow check (UI-01):**
```typescript
// At top: no shadow
await page.goto('/');
const shadowAtTop = await page.locator('devliot-header').evaluate(
  el => getComputedStyle(el).boxShadow
);
expect(shadowAtTop).toBe('none');

// After scroll: shadow present
await page.evaluate(() => window.scrollTo(0, 100));
await page.waitForTimeout(300); // transition duration + buffer
const shadowAfterScroll = await page.locator('devliot-header').evaluate(
  el => getComputedStyle(el).boxShadow
);
expect(shadowAfterScroll).not.toBe('none');
```

**Variant content check (UI-03, UI-04):**
```typescript
// Home: search present, logo absent
await page.goto('/');
const searchBtn = page.locator('devliot-header .search-btn');
await expect(searchBtn).toBeVisible();
const logo = page.locator('devliot-header pre[aria-label="DEVLIOT"]');
await expect(logo).toHaveCount(0);

// Article: logo present, search absent
await page.goto('/article/01-demo-article');
await page.waitForSelector('devliot-article-page article h1');
const articleLogo = page.locator('devliot-header pre[aria-label="DEVLIOT"]');
await expect(articleLogo).toBeVisible();
const articleSearch = page.locator('devliot-header .search-btn');
await expect(articleSearch).toHaveCount(0);
```

**ResizeObserver pipeline regression (D-10):**
Already covered by `ANCH-03` in `tests/deep-linkable-anchors.spec.ts` -- heading lands below sticky header. If the pipeline breaks, this test fails.

### Sampling Rate

- **Per task commit:** `npx playwright test tests/ui-refresh.spec.ts --project=chromium`
- **Per wave merge:** `npx playwright test --project=chromium`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/ui-refresh.spec.ts` -- new file covering UI-01 through UI-04 (8 test stubs)
- [ ] No framework install needed -- Playwright already configured

## Risks and Mitigations

### Risk 1: design-system.spec.ts tests break silently

**What:** 4 tests in design-system.spec.ts assert header internals (logo, link color, font, hamburger) that change with the variant refactor. If these are not updated, they fail and block the full suite.
**Likelihood:** Certain (not a risk -- a known requirement).
**Mitigation:** The plan must include a dedicated task for updating design-system.spec.ts and navigation-discovery.spec.ts BEFORE or alongside the header refactor. Tests should be updated in the same commit as the component change to keep the suite green at every commit.

### Risk 2: Scroll listener fires too frequently

**What:** A naive scroll listener that calls `requestUpdate()` on every frame could cause unnecessary re-renders.
**Likelihood:** Low -- Lit's `@state` / `@property` only triggers re-render when the value actually changes (default `hasChanged` is strict equality). Since `_scrolled` is a boolean, it only transitions on the 0/non-0 boundary.
**Mitigation:** The guard `if (scrolled !== this._scrolled)` is belt-and-suspenders but costs nothing. The `{ passive: true }` option ensures no jank.

### Risk 3: Search aria-label language change breaks accessibility tests

**What:** The aria-labels change from English to French (D-05). Tests asserting the old English strings break.
**Likelihood:** Certain for `navigation-discovery.spec.ts` tests NAV-04.
**Mitigation:** Update assertions in the same commit as the aria-label change.

### Risk 4: Variant attribute not reflected on first render

**What:** If `variant` is set before `connectedCallback`, the attribute might not be on the host when CSS evaluates.
**Likelihood:** Very low -- Lit's property system handles attribute reflection synchronously during the first update cycle. The `@property({ reflect: true })` mechanism is well-tested. [VERIFIED: Context7 /lit/lit.dev v3 properties docs]
**Mitigation:** None needed beyond the standard `@property({ reflect: true })` pattern.

### Risk 5: Header height flash on variant switch

**What:** When navigating from home to article (or vice versa), the header content swaps and the ResizeObserver fires with the new height. There's a brief window (one frame) where `--header-height` has the old value.
**Likelihood:** Low impact -- the only consumer is `scroll-margin-top` on h2/h3, which only matters during active scrolling-to-anchor. A one-frame stale value is invisible.
**Mitigation:** None needed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Firefox lacks `animation-timeline: scroll()` support | Q2 Scroll-Shadow | Would miss an opportunity for a zero-JS approach; fallback (scroll listener) works everywhere regardless |

## Open Questions for Planner

1. **Test file organization:** Should the updated design-system.spec.ts tests that depend on header variant be moved into `ui-refresh.spec.ts`, or kept in design-system.spec.ts with updated navigation? Recommendation: keep in design-system.spec.ts (they test the design system, not the UI refresh feature) but update their setup steps.

2. **Search placeholder change timing:** The French placeholder (`Rechercher un article...`) changes the existing English placeholder. Should this be done in the header refactor task, or as a separate micro-task? Recommendation: same task as the header render refactor since it touches the same template.

## Sources

### Primary (HIGH confidence)
- Context7 `/lit/lit.dev` -- `@property` decorator, `reflect: true`, `:host([attr])` CSS pattern, `connectedCallback`/`disconnectedCallback` lifecycle, `willUpdate()` lifecycle
- Source code: `devliot-app.ts`, `devliot-header.ts`, `path-router.ts`, `header.css`, `footer.css`, `reset.css`, `article.css`, `app.css`
- Source code: `tests/deep-linkable-anchors.spec.ts`, `tests/navigation-discovery.spec.ts`, `tests/article-components.spec.ts`, `tests/design-system.spec.ts`
- `.planning/phases/08-ui-refresh/08-CONTEXT.md` -- locked decisions D-01 through D-10
- `.planning/phases/08-ui-refresh/08-UI-SPEC.md` -- visual and interaction contract
- `.planning/phases/07-deep-linkable-anchors/07-01-SUMMARY.md` -- ResizeObserver pipeline placement and design rationale

### Tertiary (LOW confidence)
- Firefox `animation-timeline: scroll()` support status [ASSUMED from training data]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all Lit 3 primitives verified via Context7
- Architecture: HIGH -- all patterns verified against existing source code and Lit docs
- Pitfalls: HIGH -- test impact analysis verified by reading all 4 test files line by line

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable -- no moving targets, all patterns are Lit 3 fundamentals)

---

## RESEARCH COMPLETE
