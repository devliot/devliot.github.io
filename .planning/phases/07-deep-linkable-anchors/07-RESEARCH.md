# Phase 7: Deep-linkable Anchors - Research

**Researched:** 2026-04-15
**Domain:** History API, scroll mechanics, ResizeObserver, CSS scroll-margin-top, Playwright scroll assertions
**Confidence:** HIGH

## Summary

Phase 7 tightens the existing v1.0 anchor infrastructure (Phase 3) into the ANCH-01 through ANCH-05 contract. The work is ~90% behavioral (History API, scroll mechanics, ResizeObserver pipeline) with a small CSS/DOM surface (scoping anchors to h2/h3, adding `scroll-margin-top`). Zero new runtime dependencies are required -- all features use browser-native APIs: `history.pushState`, `history.replaceState`, `ResizeObserver`, `scrollIntoView`, `scroll-margin-top`.

The most critical architectural decision is URL placement: `?section={id}` must live in the **top-level search** portion of the URL (`window.location.search`), NOT inside the hash fragment. The project uses hash-based routing (`#/article/slug`), and the HashRouter parses `?` inside the hash as a query parameter, which would trigger `requestUpdate()` on the host and re-render the route. Placing `?section=` in the top-level search (`/?section=id#/article/slug`) keeps the hash unchanged, avoids `hashchange`, and allows `_scrollToSectionFromUrl()` to read from `window.location.search` correctly.

**Primary recommendation:** Use `history.pushState` to set URLs of the form `/?section={id}#/article/{slug}`, add a `popstate` listener to re-scroll on back/forward, publish `--header-height` via `ResizeObserver` on document root, and consume it via `scroll-margin-top` on h2/h3. The browser-native `scrollIntoView({behavior: 'smooth'})` respects `scroll-margin-top` in all modern browsers (Baseline 2021).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Clicking the `#` icon updates the URL to `?section={id}` and smooth-scrolls to the heading. No clipboard copy, no toast, no visible feedback beyond URL + scroll. The URL change is the confirmation. (Drops the clipboard write currently in `devliot-article-page.ts:142`.)
- **D-02:** Each anchor click calls `history.pushState` (not `replaceState`), so the browser back button steps back through the sections the reader clicked, then out of the article. ANCH-04 is taken literally.
- **D-03:** The FIRST transition into a `?section=` state from a URL load uses `replaceState` (not `pushState`) so a fresh back-button press from an opened deep link leaves the site cleanly instead of returning to an identical `?section=` entry.
- **D-04:** `popstate` handler re-runs the scroll-to-section logic so back/forward between `?section=` states re-positions the viewport without remounting the article. No router navigation -- same article, same DOM, different scroll target.
- **D-05:** The anchor-injection pass targets `h2, h3` only. h4/h5/h6 receive no `#` icon and are not deep-linkable. (Phase 3 currently injects on h2-h6 at `devliot-article-page.ts:119`; this phase tightens the selector.)
- **D-06:** The CSS hover-reveal rules in `src/styles/article.css:110-116` are also scoped to `h2, h3`. h4-h6 lose their current hover anchors entirely.
- **D-07:** Opening a URL with `?section={id}` performs a brief smooth scroll from the article top to the target heading. Not an instant snap.
- **D-08:** Target lookup is silent on miss. If `?section=unknown-heading` has no matching DOM id, the page stays at article top AND the `section` param is stripped from the URL via `history.replaceState`.
- **D-09:** The offset mechanism is a `ResizeObserver`-driven CSS custom property exposing the live sticky-header height. Article page uses `scroll-margin-top` on heading elements so browser-native scroll positioning handles the offset without JS math at scroll time.
- **D-10:** The gap between the bottom of the sticky header and the top of the landed heading is one line of breathing room (~0.75rem), applied via `scroll-margin-top: calc(var(--header-height) + 0.75rem)` on h2/h3.

### Claude's Discretion
- Exact module placement of the ResizeObserver / `--header-height` CSS variable publisher: inline in `devliot-header.ts`, a new helper in `src/utils/`, or a controller on `devliot-app.ts`
- Exact implementation form of the anchor-injection tightening (regex change, selector update, full refactor)
- Exact Playwright test granularity (one e2e spec vs per-criterion specs); minimum bar is each ANCH criterion must have a matching assertion
- Whether to also wire `popstate` to `devliot-app.ts` router or keep it local to `devliot-article-page.ts`
- Heading `id` derivation: keep as-is unless collision or i18n issue found

### Deferred Ideas (OUT OF SCOPE)
- Copy-link-to-clipboard button / toast -- explicitly dropped (D-01)
- Anchors on h4+ -- out of scope per ANCH-05
- Auto-generated Table of Contents -- v2.1 candidate
- Heading id collision detection -- punt unless real-world breakage
- Focus management on scroll (a11y) -- future a11y pass
- URL sharing hint / UI affordance -- revisit only if feature is undiscovered
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANCH-01 | Click h2/h3 anchor updates URL with `?section={id}` via pushState (without reload or hash route change) | History API pattern (pushState on search portion), HashRouter isolation verified |
| ANCH-02 | Opening URL with `?section={id}` navigates to article and scrolls to heading | `_scrollToSectionFromUrl()` reads `window.location.search`, scrollIntoView + scroll-margin-top |
| ANCH-03 | Scroll deposits heading visible below sticky header, offset based on real header height | ResizeObserver -> `--header-height` CSS var -> `scroll-margin-top: calc(var(--header-height) + 0.75rem)` |
| ANCH-04 | Back/forward buttons navigate between `?section=` states without remounting article | `popstate` listener reads `?section=` from `window.location.search`, re-scrolls |
| ANCH-05 | Anchors on h2 and h3, not on h4+ | Selector change in `_injectHeadingAnchors()` + CSS scope change in article.css |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| URL mutation (pushState/replaceState) | Browser / Client | -- | History API is purely client-side; no server involvement |
| Scroll-to-section on load | Browser / Client | -- | DOM query + scrollIntoView, all client-side |
| Sticky header height measurement | Browser / Client | -- | ResizeObserver on DOM element, CSS custom property on :root |
| scroll-margin-top offset | Browser / Client (CSS) | -- | Pure CSS property consumed by browser scroll engine |
| Anchor injection (h2/h3 DOM manipulation) | Browser / Client | -- | Post-render DOM manipulation in Lit `updated()` lifecycle |
| popstate navigation | Browser / Client | -- | Window event listener, re-reads URL search params |
| Playwright E2E assertions | Test tier | -- | Separate test project, runs against dev server |

## Standard Stack

### Core (Zero New Dependencies)

| API | Baseline | Purpose | Why Standard |
|-----|----------|---------|--------------|
| `history.pushState` / `history.replaceState` | Universal | URL mutation without navigation | MDN-confirmed: does NOT fire `hashchange` or `popstate`. Only way to update URL without triggering HashRouter. [VERIFIED: MDN docs] |
| `window.popstate` event | Universal | Back/forward detection | Fires when user navigates history entries created by pushState. [VERIFIED: MDN docs] |
| `ResizeObserver` | Baseline 2020 | Observe header height changes | No polling, no resize event. Fires on element dimension changes including font load, content swap. [VERIFIED: MDN docs] |
| `scrollIntoView({behavior: 'smooth'})` | Baseline 2022 (smooth) | Smooth scroll to heading | Respects `scroll-margin-top` in all modern browsers (Baseline 2021). [VERIFIED: MDN, caniuse] |
| `scroll-margin-top` CSS | Baseline 2021 | Sticky header offset | Applied to h2/h3 elements. Browser scroll engine uses it natively when `scrollIntoView` is called. [VERIFIED: MDN, caniuse] |
| `CSS.escape()` | Baseline 2020 | Safe selector construction | Already used in existing code (line 171). Prevents injection when heading text contains special chars. [VERIFIED: codebase] |
| `URLSearchParams` | Universal | Parse `?section=` from URL | Already used in existing code (line 164). [VERIFIED: codebase] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `scrollIntoView` + `scroll-margin-top` | `window.scrollTo` with manual offset math | More control but duplicates browser-native behavior. PITFALLS.md Pitfall 2 recommends `scrollTo` but that was written before confirming scroll-margin-top + scrollIntoView works reliably. The CSS approach is simpler and what D-09/D-10 lock. |
| `scroll-margin-top` on elements | `scroll-padding-top` on html | scroll-padding on html is a global setting. scroll-margin on elements is more targeted and works in Shadow DOM. Both are respected by scrollIntoView. |

**Installation:** None required. All APIs are browser-native.

## Architecture Patterns

### System Architecture Diagram

```
User clicks h2/h3 anchor
    |
    v
[Click handler in devliot-article-page.ts]
    |
    |--> history.pushState({section: id}, '', newUrl)
    |       URL becomes: /?section={id}#/article/{slug}
    |       hash unchanged -> HashRouter NOT triggered
    |
    |--> heading.scrollIntoView({behavior: 'smooth'})
    |       Browser uses scroll-margin-top to clear sticky header
    |
    v
[URL bar updated, viewport scrolled]

---

User opens URL with ?section={id}
    |
    v
[HashRouter processes hash -> mounts devliot-article-page]
    |
    v
[updated() lifecycle fires after _html set]
    |
    |--> _injectHeadingAnchors() (h2, h3 only)
    |--> _scrollToSectionFromUrl()
    |       reads window.location.search -> URLSearchParams
    |       finds heading by id in shadow DOM
    |       history.replaceState (D-03: no extra history entry)
    |       heading.scrollIntoView({behavior: 'smooth'})
    |       if miss: strip ?section= via replaceState (D-08)
    v
[Heading visible below sticky header]

---

User presses Back/Forward
    |
    v
[popstate event fires]
    |
    v
[popstate handler in devliot-article-page.ts]
    |--> reads window.location.search
    |--> if ?section= present: scroll to heading
    |--> if no ?section=: no scroll action
    |--> article DOM unchanged (no remount)

---

ResizeObserver Pipeline (runs continuously)
    |
[devliot-app.ts connectedCallback]
    |--> new ResizeObserver on <devliot-header> element
    |--> callback: document.documentElement.style.setProperty(
    |       '--header-height', `${entry.borderBoxSize[0].blockSize}px`)
    |
    v
[h2, h3 CSS rule consumes]
    scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)
```

### Component Responsibilities

| Component | File | Phase 7 Changes |
|-----------|------|-----------------|
| `devliot-article-page` | `src/pages/devliot-article-page.ts` | Tighten anchor selector (h2,h3), replace clipboard with pushState, add popstate listener, enhance `_scrollToSectionFromUrl` with replaceState-on-load and miss handling |
| `devliot-app` | `src/devliot-app.ts` | Add ResizeObserver on `devliot-header` to publish `--header-height` |
| Article CSS | `src/styles/article.css` | Scope hover-reveal to h2/h3 only, add `scroll-margin-top` rule |
| Reset CSS | `src/styles/reset.css` | No changes needed (--header-height on :root via JS) |
| HashRouter | `src/utils/hash-router.ts` | NO CHANGES -- must not be disturbed |
| devliot-header | `src/components/devliot-header.ts` | No changes in Phase 7 (ResizeObserver observes it from outside) |

### Recommended ResizeObserver Placement

**Recommendation: `devliot-app.ts`** (the app shell).

Rationale:
1. `devliot-app.ts` lives for the full SPA session -- never unmounts. The observer is created once.
2. It renders `<devliot-header>` and can query it after first render.
3. It writes to `document.documentElement.style` (`:root`), making `--header-height` available globally -- both in light DOM CSS and inside any Shadow DOM via CSS custom property inheritance.
4. Phase 8 will change header content (home vs article). The ResizeObserver fires automatically when the header re-renders with different content, so no additional wiring is needed.
5. Placing it in `devliot-header.ts` would work but couples the header to a global side-effect. Placing it in `devliot-article-page.ts` is wrong because article pages unmount on navigation.

**Implementation pattern:**
```typescript
// In devliot-app.ts
private _headerObserver?: ResizeObserver;

firstUpdated() {
  const header = this.renderRoot.querySelector('devliot-header');
  if (header) {
    this._headerObserver = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height + /* padding */;
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    });
    this._headerObserver.observe(header);
  }
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._headerObserver?.disconnect();
}
```

[VERIFIED: ResizeObserver API from MDN docs. borderBoxSize includes padding and border, which is what we need for the full header height including padding.]

### Pattern 1: pushState URL Construction

**What:** Construct the pushState URL preserving the hash while updating the search portion.

**Critical insight:** The browser URL structure is `origin + pathname + search + hash`. For this project:
- Current: `http://localhost:5173/#/article/01-demo-article`
- After anchor click: `http://localhost:5173/?section=code-highlighting#/article/01-demo-article`

The `?section=` goes BEFORE the `#`, in the real `window.location.search`. This is critical because:
1. `window.location.search` returns the top-level query string (before `#`)
2. The HashRouter only listens to `hashchange` and only parses inside the hash
3. `pushState` does NOT fire `hashchange` [VERIFIED: MDN]

**Code pattern:**
```typescript
// Source: MDN History.pushState + project architecture analysis
anchor.addEventListener('click', (e: MouseEvent) => {
  e.preventDefault();
  const url = new URL(window.location.href);
  url.searchParams.set('section', id);
  history.pushState({ section: id }, '', url.toString());
  heading.scrollIntoView({ behavior: 'smooth' });
});
```

Using `new URL()` + `searchParams.set()` is safer than string concatenation -- it correctly handles existing query params and hash preservation. The `URL` constructor preserves the hash fragment automatically. [VERIFIED: MDN URL API]

### Pattern 2: popstate Handler

**What:** Re-scroll on back/forward navigation between `?section=` states.

**When to use:** After the user has clicked multiple anchors (each creating a pushState entry) and uses back/forward.

**Critical edge cases:**
1. User backs from `?section=b` to `?section=a` -- re-scroll to heading `a`
2. User backs from `?section=a` to no section (initial article load) -- no scroll, stay where they are
3. User backs OUT of the article entirely (hash changes) -- the `hashchange` listener in HashRouter handles this, our `popstate` handler should be a no-op

**Code pattern:**
```typescript
// Source: MDN Window popstate event + project architecture analysis
private _onPopState = () => {
  const section = new URLSearchParams(window.location.search).get('section');
  if (section) {
    const article = this.shadowRoot?.querySelector('article');
    const target = article?.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
  // If no ?section=, do nothing -- user backed to initial article state or left article
};

connectedCallback() {
  super.connectedCallback();
  window.addEventListener('popstate', this._onPopState);
}

disconnectedCallback() {
  super.disconnectedCallback();
  window.removeEventListener('popstate', this._onPopState);
}
```

**Why this is safe with HashRouter:** When `popstate` fires from a hash change (user navigated to a different route), the HashRouter's `hashchange` listener also fires and handles the route change. Our `popstate` handler reads `?section=` from `window.location.search` -- if the user navigated away, `?section=` won't be present (it was specific to the article page), so the handler is a no-op. Even if it weren't, the article-page component is about to be unmounted by the router, so any scroll action is harmless.

**Subtlety:** `popstate` fires for BOTH search-only changes (our `?section=` navigation) AND hash changes (router navigation). The handler must not assume the article is still mounted. The `this.shadowRoot?.querySelector('article')` null check handles this naturally -- if the component is being torn down, the query returns null and we bail. [VERIFIED: MDN popstate event docs]

### Pattern 3: replaceState on Initial Load (D-03)

**What:** When a URL with `?section={id}` is opened fresh (not via anchor click), use `replaceState` instead of `pushState` to avoid a duplicate history entry.

**Code pattern:**
```typescript
// In _scrollToSectionFromUrl(), called from updated() and connectedCallback()
private _scrollToSectionFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section');
  if (!section) return;

  const article = this.shadowRoot?.querySelector('article');
  if (!article) return;

  const target = article.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
  if (target) {
    // D-03: replaceState on initial load so back button leaves cleanly
    history.replaceState({ section }, '', window.location.href);
    target.scrollIntoView({ behavior: 'smooth' });
  } else {
    // D-08: silent miss -- strip bad ?section= from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    history.replaceState(null, '', url.toString());
  }
}
```

### Anti-Patterns to Avoid

- **Touching `window.location.hash` for anchor state:** Fires `hashchange`, triggers HashRouter, remounts article, destroys Shiki/KaTeX/Mermaid output. [VERIFIED: codebase analysis of HashRouter._onHashChange]
- **Putting `?section=` inside the hash fragment:** The HashRouter parses `?` inside the hash as query params and calls `host.requestUpdate()`. This re-renders the route even though the path hasn't changed, causing unnecessary work and potential flickering. [VERIFIED: HashRouter code lines 33-39]
- **Using `scroll-behavior: smooth` CSS property on html:** Safari 15.4+ has a known bug where this CSS property blocks programmatic `scrollTo`/`scrollIntoView`. Use `scrollIntoView({behavior: 'smooth'})` programmatically instead. [CITED: Apple Developer Forums thread/703294]
- **Hardcoding header height:** The header height varies across breakpoints (logo font-size: 6px/8px/10px) and will change in Phase 8 (home vs article content). Only `ResizeObserver` provides the live value.
- **Placing ResizeObserver in article-page component:** The article page unmounts on route change. The observer would be destroyed and recreated on every navigation, missing header height changes that happen while on the home page.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll offset for sticky header | Manual `window.scrollTo({top: target.getBoundingClientRect().top + scrollY - headerHeight})` | `scroll-margin-top` CSS + `scrollIntoView` | Browser handles the offset natively. Less JS, fewer edge cases, automatically respects scroll-margin during keyboard Tab navigation too. D-09/D-10 lock this approach. |
| Smooth scroll animation | Custom JS animation loop or CSS `scroll-behavior: smooth` | `scrollIntoView({behavior: 'smooth'})` | Native smooth scroll, browser-controlled duration/easing. No polyfill needed (Baseline 2022). |
| URL query string parsing | Manual string splitting | `new URL()` + `URLSearchParams` | Handles encoding, multiple params, hash preservation correctly. Already used in codebase. |
| Element height observation | `window.resize` event + `getComputedStyle` | `ResizeObserver` | Fires on element-level size changes (content, font load), not just window resize. No layout thrashing. |

## Common Pitfalls

### Pitfall 1: ?section= Placement in URL (CRITICAL)
**What goes wrong:** Placing `?section=id` INSIDE the hash fragment (`#/article/slug?section=id`) instead of in the top-level search (`?section=id#/article/slug`). The HashRouter's `_onHashChange` splits on `?` inside the hash and calls `host.requestUpdate()`, causing an unnecessary re-render of the route.
**Why it happens:** Natural instinct is to append `?section=` after the current URL, which for hash-routed apps means after the hash. The current clipboard-copy code at line 140-141 does exactly this (but it never updates the URL bar, so the bug was latent).
**How to avoid:** Always construct the pushState URL using `new URL(window.location.href)` + `url.searchParams.set('section', id)`. The URL API places search params BEFORE the hash automatically.
**Warning signs:** HashRouter `requestUpdate()` fires after anchor click (set breakpoint on line 39 of hash-router.ts). Article component re-renders unnecessarily.

### Pitfall 2: scrollIntoView Timing After Lit Render
**What goes wrong:** Calling `scrollIntoView` before the Shadow DOM has rendered the heading elements. The heading with the target `id` doesn't exist yet, so the scroll silently does nothing.
**Why it happens:** Lit's `updated()` fires after the template re-renders, but `unsafeHTML` content may not be in the DOM until the next microtask.
**How to avoid:** The existing code already handles this: `this.updateComplete.then(() => { ... })` in `updated()`. Keep this pattern. For `popstate`, the DOM is already rendered (article is mounted), so no timing issue.
**Warning signs:** `_scrollToSectionFromUrl()` called but `article.querySelector('#id')` returns null.

### Pitfall 3: popstate Fires on Hash Changes Too
**What goes wrong:** The `popstate` handler runs scroll logic when the user is actually navigating between routes (e.g., article -> home), not between sections.
**Why it happens:** `popstate` fires for any history navigation, including those caused by hash changes.
**How to avoid:** The handler's null-check chain (`shadowRoot?.querySelector('article')?.querySelector('#id')`) naturally short-circuits when the article is not mounted. No explicit route-checking needed.
**Warning signs:** Console errors or scroll attempts during route transitions.

### Pitfall 4: Safari scroll-behavior CSS Property Blocks Programmatic Scroll
**What goes wrong:** If anyone adds `html { scroll-behavior: smooth; }` to reset.css, Safari 15.4+ may block `scrollIntoView()` and `scrollTo()` calls entirely.
**Why it happens:** Safari 15.4 regression (WebKit bug 238497). The CSS property interferes with programmatic scroll APIs when `overflow: hidden` is involved.
**How to avoid:** Do NOT add `scroll-behavior: smooth` to CSS. Use `scrollIntoView({behavior: 'smooth'})` for each programmatic scroll call. The project's reset.css currently does not set this property -- keep it that way. [CITED: Apple Developer Forums thread/703294, WebKit bug 238497]
**Warning signs:** Smooth scroll works in Chrome/Firefox but fails silently in Safari.

### Pitfall 5: ResizeObserver borderBoxSize Array Structure
**What goes wrong:** Accessing `entry.borderBoxSize.blockSize` directly instead of `entry.borderBoxSize[0].blockSize`. The property is an array (to support fragmented elements in multi-column layouts).
**Why it happens:** The API is counterintuitive -- for single-fragment elements (99% of cases), the array always has exactly one entry.
**How to avoid:** Always access `entry.borderBoxSize[0].blockSize`. Fall back to `entry.contentRect.height` if borderBoxSize is undefined (some older browsers). [VERIFIED: MDN ResizeObserverEntry.borderBoxSize]
**Warning signs:** `TypeError: Cannot read property 'blockSize' of undefined`.

### Pitfall 6: Back Button After Deep Link Opens Identical URL
**What goes wrong:** User opens `/?section=code-highlighting#/article/01-demo-article`, then presses Back. If the initial load used `pushState`, the history stack has TWO identical entries -- the user hits Back and nothing happens (same URL), then hits Back again and finally leaves.
**Why it happens:** `pushState` creates a new history entry. If the page load already has `?section=` and the scroll handler also pushes, there are two entries.
**How to avoid:** D-03 explicitly requires `replaceState` on initial load. The `_scrollToSectionFromUrl()` method must use `replaceState`, never `pushState`, when processing the URL on page arrival.
**Warning signs:** User has to press Back twice to leave an article opened via deep link.

## Code Examples

### URL Construction for pushState

```typescript
// Source: MDN URL API + project codebase analysis
// Correct: uses URL API which places search BEFORE hash
const url = new URL(window.location.href);
url.searchParams.set('section', headingId);
history.pushState({ section: headingId }, '', url.toString());
// Result: http://localhost:5173/?section=code-highlighting#/article/01-demo-article

// WRONG: string concatenation puts ?section= inside hash
const baseUrl = window.location.origin + window.location.pathname + window.location.hash.split('?')[0];
const link = baseUrl + '?section=' + headingId;
// Result: http://localhost:5173/#/article/01-demo-article?section=code-highlighting
// This is INSIDE the hash! HashRouter will parse it and re-render.
```

### CSS scroll-margin-top Rule

```css
/* Source: MDN scroll-margin-top + D-10 decision */
/* Add to article.css alongside existing h2, h3 rule */
h2, h3 {
  scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem);
}
```

The `0px` fallback handles the brief window before ResizeObserver fires. [VERIFIED: CSS calc() with var() fallback syntax]

### Scoped CSS Hover Reveal

```css
/* Source: D-06 decision + existing article.css:110-117 */
/* BEFORE (Phase 3): */
h2:hover .heading-anchor,
h3:hover .heading-anchor,
h4:hover .heading-anchor,
h5:hover .heading-anchor,
h6:hover .heading-anchor,
.heading-anchor:focus {
  opacity: 1;
}

/* AFTER (Phase 7): */
h2:hover .heading-anchor,
h3:hover .heading-anchor,
.heading-anchor:focus {
  opacity: 1;
}
```

### ResizeObserver in App Shell

```typescript
// Source: MDN ResizeObserver + devliot-app.ts architecture
// In devliot-app.ts firstUpdated()
private _headerObserver?: ResizeObserver;

firstUpdated() {
  const header = this.renderRoot.querySelector('devliot-header');
  if (header) {
    this._headerObserver = new ResizeObserver(([entry]) => {
      // borderBoxSize includes padding+border, which gives the full visual height
      const height = entry.borderBoxSize?.[0]?.blockSize
        ?? (entry.target as HTMLElement).offsetHeight;
      document.documentElement.style.setProperty(
        '--header-height', `${height}px`
      );
    });
    this._headerObserver.observe(header);
  }
}

disconnectedCallback() {
  super.disconnectedCallback();
  this._headerObserver?.disconnect();
}
```

### Anchor Injection (Tightened Selector)

```typescript
// Source: existing devliot-article-page.ts:119 + D-05 decision
// BEFORE:
const headings = article.querySelectorAll<HTMLHeadingElement>('h2, h3, h4, h5, h6');

// AFTER:
const headings = article.querySelectorAll<HTMLHeadingElement>('h2, h3');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `scroll-padding-top` on html | `scroll-margin-top` on target elements | Always available, both valid | scroll-margin is more granular (per-element), works in Shadow DOM via CSS custom property inheritance |
| Manual `window.scrollTo` offset math | `scrollIntoView` + `scroll-margin-top` | scroll-margin-top Baseline 2021 | Browser handles offset natively; less JS, fewer bugs |
| `onresize` event for header height | `ResizeObserver` | Baseline 2020 | Fires on element dimension changes, not just window resize; covers font load, content swap |
| Hash fragments for deep links (`#heading-id`) | Query params in search (`?section=id`) | Project-specific (hash router constraint) | Avoids HashRouter remount; `pushState` does not fire `hashchange` |

## Heading ID Stability and Collision

**Current id derivation rule** (line 125-128):
```typescript
const id = (heading.textContent ?? '')
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w-]/g, '');
```

**Collision risk:** If two headings in the same article have identical text content, they get the same `id`. The `querySelector('#id')` would find the FIRST one, making the second heading unreachable via deep link.

**Assessment:** The demo article has no duplicate heading text. The CONTEXT.md deferred section explicitly notes this as "not reported as a real-world issue" and punts it. For Phase 7, this is a non-blocking edge case. [VERIFIED: codebase analysis of demo article headings]

**If it matters later:** Append a counter suffix (`-2`, `-3`) when a duplicate is detected. GitHub's Markdown renderer does this. But not in Phase 7 scope.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `scroll-margin-top` is respected by `scrollIntoView({behavior: 'smooth'})` in Safari 14.1+ | Architecture Patterns | If Safari ignores scroll-margin-top during programmatic scrollIntoView, headings land behind the sticky header on Safari. Fallback: use `window.scrollTo` with manual offset calculation. Risk: LOW -- MDN documents baseline support since April 2021 and 2026 best practice guides confirm the combination works. |
| A2 | `new URL(window.location.href).searchParams.set()` preserves the hash fragment | Pattern 1: pushState URL Construction | If the URL API strips the hash when setting search params, the hash route is lost. Risk: VERY LOW -- URL API spec requires hash preservation. |
| A3 | `borderBoxSize[0].blockSize` on the `<devliot-header>` custom element returns the full rendered height including Shadow DOM content | Code Examples: ResizeObserver | If the custom element reports 0 or only the host element height, the observed value is wrong. Risk: LOW -- ResizeObserver observes the element's layout box, which includes rendered Shadow DOM content. |

**All other claims in this research were verified via MDN docs, codebase analysis, or caniuse.**

## Open Questions

1. **scroll-margin-top in Shadow DOM inheritance**
   - What we know: CSS custom properties (`--header-height`) inherit through Shadow DOM boundaries. `scroll-margin-top` is set on h2/h3 elements inside the article's shadow root using `calc(var(--header-height) + 0.75rem)`.
   - What's unclear: The `--header-height` is set on `document.documentElement` (:root). Lit components use `unsafeCSS` for their styles, and the h2/h3 elements are inside the Shadow DOM. CSS custom properties DO inherit through Shadow DOM -- this is one of the few CSS mechanisms that crosses the boundary.
   - Recommendation: This should work by spec. Verify in implementation with a quick manual test. If it doesn't work, set `--header-height` on the `devliot-article-page` host element as well.

2. **popstate firing order vs hashchange**
   - What we know: When a user clicks Back and both the search AND hash change, both `popstate` and `hashchange` fire. The order is: `popstate` first, then `hashchange` (per HTML spec).
   - What's unclear: If the user backs from `?section=a#/article/slug` to `#/` (home page), `popstate` fires first. Our handler tries to find the heading, fails (article unmounting), and is a no-op. Then `hashchange` fires and HashRouter remounts the home page. This should be fine.
   - Recommendation: Rely on the null-check chain in the popstate handler. No explicit coordination with HashRouter needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (already installed) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/deep-linkable-anchors.spec.ts --project=chromium` |
| Full suite command | `npx playwright test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANCH-01 | Click h2/h3 anchor -> URL contains `?section={id}` in `window.location.search` (not in hash), no hashchange fired | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-01" --project=chromium` | Wave 0 |
| ANCH-02 | Load URL with `?section={id}` -> heading scrolled into view in viewport | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-02" --project=chromium` | Wave 0 |
| ANCH-03 | Landed heading clears sticky header (heading.y >= header.bottom) | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-03" --project=chromium` | Wave 0 |
| ANCH-04 | Back button after two anchor clicks -> URL returns to prior `?section=` state, article DOM unchanged | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-04" --project=chromium` | Wave 0 |
| ANCH-05 | h2/h3 have `.heading-anchor`; h4/h5/h6 do NOT | E2E | `npx playwright test tests/deep-linkable-anchors.spec.ts -g "ANCH-05" --project=chromium` | Wave 0 |

### Playwright Test Patterns for Scroll Assertions

The key challenge is asserting that a heading is visible below the sticky header after a scroll animation completes. The existing test suite uses `boundingBox()` for position assertions (see `article-metadata.spec.ts` line 41-46). Apply the same pattern.

**Pattern: Assert heading clears sticky header**
```typescript
// Source: project test patterns (article-metadata.spec.ts) + Playwright docs
test('ANCH-03: heading lands below sticky header', async ({ page }) => {
  // Navigate to article with ?section= in the URL
  await page.goto('/?section=code-highlighting#/article/01-demo-article');

  // Wait for article content to load
  const articlePage = page.locator('devliot-article-page');
  await articlePage.locator('article h1').waitFor({ timeout: 10000 });

  // Wait for smooth scroll to complete (browser-native ~400-600ms)
  await page.waitForTimeout(1000);

  // Get header bounding box (devliot-header is in light DOM of devliot-app)
  const header = page.locator('devliot-header');
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();

  // Get target heading bounding box (inside shadow DOM, Playwright auto-pierces)
  const heading = articlePage.locator('#code-highlighting');
  const headingBox = await heading.boundingBox();
  expect(headingBox).not.toBeNull();

  // Heading top must be at or below header bottom
  expect(headingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
});
```

**Pattern: Assert URL updated via pushState (not hashchange)**
```typescript
test('ANCH-01: anchor click updates URL with ?section= via pushState', async ({ page }) => {
  await page.goto('/#/article/01-demo-article');
  await page.locator('devliot-article-page article h1').waitFor({ timeout: 10000 });

  // Click the anchor on the first h2
  const heading = page.locator('devliot-article-page article h2').first();
  await heading.hover();
  const anchor = heading.locator('.heading-anchor');
  await anchor.click();

  // Verify URL has ?section= in the search portion (before hash)
  const url = new URL(page.url());
  expect(url.searchParams.get('section')).toBeTruthy();
  // Verify hash is preserved (article route unchanged)
  expect(url.hash).toContain('#/article/01-demo-article');
});
```

**Pattern: Assert back button navigates section history**
```typescript
test('ANCH-04: back button returns to prior ?section= state', async ({ page }) => {
  await page.goto('/#/article/01-demo-article');
  await page.locator('devliot-article-page article h1').waitFor({ timeout: 10000 });

  // Click two different heading anchors
  const h2First = page.locator('devliot-article-page article h2').first();
  await h2First.hover();
  await h2First.locator('.heading-anchor').click();
  const firstSection = new URL(page.url()).searchParams.get('section');

  const h2Second = page.locator('devliot-article-page article h2').nth(1);
  await h2Second.hover();
  await h2Second.locator('.heading-anchor').click();
  const secondSection = new URL(page.url()).searchParams.get('section');
  expect(secondSection).not.toEqual(firstSection);

  // Press back
  await page.goBack();
  await page.waitForTimeout(500); // wait for popstate + scroll

  // URL should be back to first section
  const afterBack = new URL(page.url()).searchParams.get('section');
  expect(afterBack).toEqual(firstSection);

  // Article should still be mounted (not remounted)
  const articleContent = page.locator('devliot-article-page article h1');
  await expect(articleContent).toBeVisible();
});
```

**Pattern: Assert h4+ have no anchors**
```typescript
test('ANCH-05: h4/h5/h6 have no heading-anchor elements', async ({ page }) => {
  await page.goto('/#/article/01-demo-article');
  await page.locator('devliot-article-page article h1').waitFor({ timeout: 10000 });

  // h2 and h3 SHOULD have anchors
  const h2Anchors = page.locator('devliot-article-page article h2 .heading-anchor');
  await expect(h2Anchors.first()).toHaveCount(1);

  const h3Anchors = page.locator('devliot-article-page article h3 .heading-anchor');
  await expect(h3Anchors.first()).toHaveCount(1);

  // h4, h5, h6 should NOT have anchors
  const h4Anchors = page.locator('devliot-article-page article h4 .heading-anchor');
  await expect(h4Anchors).toHaveCount(0);
  const h5Anchors = page.locator('devliot-article-page article h5 .heading-anchor');
  await expect(h5Anchors).toHaveCount(0);
  const h6Anchors = page.locator('devliot-article-page article h6 .heading-anchor');
  await expect(h6Anchors).toHaveCount(0);
});
```

**Note on scroll timing:** `page.waitForTimeout(1000)` is a pragmatic approach for waiting for smooth scroll to complete. Alternatively, use `page.waitForFunction` to poll `heading.getBoundingClientRect().top` until it stabilizes. The timeout approach is simpler and sufficient for CI. [ASSUMED: 1000ms is enough for smooth scroll completion; may need adjustment if CI is slow]

### Sampling Rate
- **Per task commit:** `npx playwright test tests/deep-linkable-anchors.spec.ts --project=chromium`
- **Per wave merge:** `npx playwright test` (full suite including existing tests)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/deep-linkable-anchors.spec.ts` -- new file covering ANCH-01 through ANCH-05
- No framework install needed (Playwright already configured)
- No config changes needed (playwright.config.ts already targets `./tests`)

## Security Domain

Phase 7 has a minimal security surface. All changes are client-side browser API usage with no server interaction, no data persistence, and no user input handling beyond heading text content (which is author-controlled HTML).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes (minor) | `CSS.escape()` around user-derived heading ids when constructing selectors. Already implemented at line 171. Prevents CSS selector injection from heading text. |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSS selector injection via heading text | Tampering | `CSS.escape()` on all id-based selectors (already in place) |
| History state pollution | Information Disclosure | pushState state object contains only section id (heading text derivative), no sensitive data |

## Sources

### Primary (HIGH confidence)
- [MDN: History.pushState()](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) -- confirmed pushState does NOT fire hashchange
- [MDN: Window popstate event](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event) -- popstate fires on back/forward for pushState entries
- [MDN: scroll-margin-top](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-top) -- Baseline 2021, works with scrollIntoView
- [MDN: ResizeObserverEntry.borderBoxSize](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/borderBoxSize) -- array structure, blockSize property
- [MDN: Element.scrollIntoView()](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) -- smooth behavior, respects scroll-margin
- [Can I Use: scroll-margin-top](https://caniuse.com/mdn-css_properties_scroll-margin-top) -- 95.9% global support, Safari 14.1+
- [MDN: Window hashchange event](https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event) -- confirms pushState/replaceState do NOT fire this

### Secondary (MEDIUM confidence)
- [Apple Developer Forums: Safari scroll-behavior smooth bug](https://developer.apple.com/forums/thread/703294) -- Safari 15.4+ CSS scroll-behavior blocks programmatic scroll
- [CSS-Tricks: Fixed Headers and Jump Links](https://css-tricks.com/fixed-headers-and-jump-links-the-solution-is-scroll-margin-top/) -- scroll-margin-top as standard solution
- [Playwright GitHub #3105](https://github.com/microsoft/playwright/issues/3105) -- scrollIntoView with sticky header in Playwright tests

### Tertiary (LOW confidence)
- None -- all claims verified against primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all browser-native APIs with Baseline 2020-2022 status, verified via MDN and caniuse
- Architecture: HIGH -- URL construction pattern verified against HashRouter source code, pushState/hashchange isolation confirmed by MDN
- Pitfalls: HIGH -- URL placement pitfall verified by reading HashRouter code; Safari CSS bug cited from Apple Developer Forums
- Validation: HIGH -- Playwright patterns based on existing test suite conventions in the project

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable browser APIs, unlikely to change)
