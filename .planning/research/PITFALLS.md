# Domain Pitfalls

**Domain:** Lit.js static technical blog — v2.0 additions (deep links, UI refresh, bibliography, authors, sitemap)
**Researched:** 2026-04-15
**Scope:** v2.0-specific pitfalls only. v1.0 pitfalls (Shadow DOM styling, Mermaid timing, KaTeX fonts, etc.) are archived in `.planning/milestones/v1.0-ROADMAP.md` and remain valid.

---

## Critical Pitfalls

Mistakes that cause rewrites or wasted phases.

---

### Pitfall 1: Deep-Link Anchor Clicks Trigger the Hash Router

**What goes wrong:** The v1.0 anchor implementation copies a `?section=<id>` URL to the clipboard and calls `heading.scrollIntoView()` directly. This is safe. But if v2.0 changes anchor clicks to update `window.location.hash` instead (a natural reflex when wanting to make anchors "linkable"), the HashRouter's `hashchange` listener fires, re-matches the route, and forces a full article re-render — resetting scroll position and destroying all post-render state (Shiki highlights, rendered diagrams, KaTeX).

**Why it happens:** The HashRouter in `hash-router.ts` listens to `window` `hashchange`. Any write to `window.location.hash` fires that event. There is no way to distinguish "anchor within an article" from "route change" using the `hashchange` event alone because both are hash mutations. The current `?section=` approach deliberately avoids this by keeping anchor identity in the query string, not the hash fragment.

**Consequences:** Clicking a section anchor unmounts and remounts the article. Shiki-highlighted blocks, rendered Mermaid diagrams, and KaTeX output are all lost because they depend on `firstUpdated()` being called once. The article re-fetches from network. Scroll position is lost. On slow connections the page blanks briefly.

**Prevention:**
- Keep the current `?section=<id>` encoding scheme. When a user clicks an anchor, update `window.location.search` (or use `history.replaceState` to add `?section=<id>` without triggering `hashchange`) rather than touching the hash fragment.
- If you want the anchor to appear in the URL bar after click, use `history.replaceState(null, '', window.location.href.split('?')[0] + '?section=' + id)`. This changes the URL without firing `hashchange`, so the router is not invoked.
- On initial load, `_scrollToSectionFromUrl()` already reads `?section=` from `window.location.search`, so deep-link entry from a shared URL will work correctly as long as `?section=` is preserved.
- Do not move to `#/article/slug#heading-id` double-hash notation — the browser spec says only the first `#` starts the fragment, so `#/article/slug#heading-id` is parsed with fragment `/article/slug#heading-id`, which breaks route matching entirely.

**Detection:** After clicking a heading anchor, observe whether the article component re-mounts (Mermaid diagrams disappear, scroll position jumps to top). Check `hash-router.ts` `_onHashChange` is not called via a breakpoint or `console.trace`.

**Owning phase:** Phase that implements deep-link anchors (first v2.0 phase).

---

### Pitfall 2: `scrollIntoView()` Does Not Respect the Sticky Header Offset

**What goes wrong:** `heading.scrollIntoView({ behavior: 'smooth' })` scrolls the heading to the top of the viewport — directly behind the sticky header. The heading text is partially or fully hidden. On mobile with a taller header (when the article mode shows a search bar instead of just a logo), the amount hidden is larger and varies.

**Why it happens:** `scrollIntoView()` aligns the element to the viewport top, not to the visible area below the header. `scroll-margin-top` on headings inside the Shadow DOM may not be applied correctly because: (a) the headings are injected via `unsafeHTML` into the article's shadow root, meaning the CSS must be scoped inside the component; (b) Safari (iOS and macOS) only honors `scroll-margin-top` within a scroll-snap container or when the scroll is initiated programmatically via `scrollIntoView()` — this behavior has been inconsistently fixed across Safari versions through 2025.

**Consequences:** Every deep-link navigation (on arrival and on click) hides the heading text under the header bar. The overlap is invisible during local dev if the header height matches hard-coded offset, but breaks when header height changes for article vs. home mode.

**Prevention:**
- Do not use `scrollIntoView()` for the header-aware scroll. Use `window.scrollTo()` with a calculated offset instead:
  ```js
  const headerEl = document.querySelector('devliot-header');
  const headerHeight = headerEl?.getBoundingClientRect().height ?? 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8; // 8px breathing room
  window.scrollTo({ top, behavior: 'smooth' });
  ```
- Set `scroll-padding-top` on the `html` element (not on headings, not in shadow DOM) equal to the header height. This is applied globally and works correctly for browser-native scroll-to-anchor as well as `scrollIntoView()`. Update it via a CSS custom property that `ResizeObserver` keeps in sync with the actual header height.
  ```js
  const ro = new ResizeObserver(([entry]) => {
    document.documentElement.style.setProperty(
      '--header-height', `${entry.contentBoxSize[0].blockSize}px`
    );
  });
  ro.observe(document.querySelector('devliot-header'));
  ```
  ```css
  /* global reset.css */
  html { scroll-padding-top: var(--header-height, 60px); }
  ```
- For Safari reliability, use the `window.scrollTo()` approach (not relying on `scroll-padding-top`) as the primary method in `_scrollToSectionFromUrl()` and in the anchor click handler.

**Detection:** After clicking a heading anchor, measure whether the heading `getBoundingClientRect().top` is >= the header height. Write a Playwright test that navigates to an article with `?section=<id>`, waits for scroll to settle, and asserts `elementHandle.boundingBox().y >= headerBoundingBox.height`.

**Owning phase:** Phase that implements deep-link anchors.

---

### Pitfall 3: Header Height Is Not Constant — It Changes Between Pages and on Resize

**What goes wrong:** The v2.0 UI refresh gives home a search-only header and articles a logo-only header. The two header variants have different heights. Any hard-coded pixel value for the scroll offset (e.g., `const HEADER_HEIGHT = 60`) will be wrong for one of the two page types — and will also be wrong after a window resize or when Inter loads (font metrics affecting the logo height).

**Why it happens:** The ASCII logo rendered in the `<pre>` element changes visual size across breakpoints (6px → 8px → 10px font-size). The search bar on home adds height when open. The header is inside a custom element's shadow root, meaning its rendered height is not directly available from the article component. Hard-coding a constant is fragile.

**Consequences:** On mobile (smallest logo), the offset under-compensates and the heading scrolls behind the header. On desktop (largest logo), the offset over-compensates and the heading appears too low. After a resize event, previously calculated values are stale.

**Prevention:**
- Use `ResizeObserver` on `devliot-header` from `devliot-app.ts` or from the article component's `connectedCallback`. Write the observed height into a CSS custom property on `:root` (`--header-height`). Read it in JavaScript as `parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))` when calculating scroll offsets.
- Initialize `ResizeObserver` once in `devliot-app.ts` (the outermost component that lives for the full session), not in the article component (which unmounts on route changes).
- Guard for the case where `devliot-header` has not yet rendered: fall back to `document.querySelector('devliot-header')?.offsetHeight ?? 64`.

**Detection:** Playwright test: resize viewport from mobile (375px) to desktop (1280px) while an article is open, click a heading anchor, assert heading is visible below the header. Also check after font load completes (use `document.fonts.ready`).

**Owning phase:** Phase implementing UI refresh (header variant switching). This phase owns the `--header-height` CSS variable plumbing. Deep-link phase consumes it — so the UI refresh phase must run first, or provide a stub.

---

### Pitfall 4: Sitemap URLs Contain Hash Fragments — Google Strips Them

**What goes wrong:** The blog's routes are `/#/` and `/#/article/<slug>`. A naive sitemap generation script produces `<loc>https://devliot.github.io/#/article/intro-to-transformers</loc>`. Google's crawler strips the fragment at crawl time. The crawled URL becomes `https://devliot.github.io/` — the homepage — not the article. All article URLs in the sitemap resolve to the same page. Articles gain no indexing benefit from the sitemap.

**Why it happens:** Google deprecated AJAX crawling (the `#!` scheme) in 2015. Googlebot strips everything from `#` onward in a URL. A sitemap entry with a hash fragment is treated as the base URL before the hash. Since the entire site routes from `/#/`, every hash URL reduces to `https://devliot.github.io/` after fragment stripping.

**Consequences:** The sitemap is useless for article discovery. Googlebots that find the site via other means (backlinks, sitemap URL only pointing to root) will only index the homepage. Articles are not individually crawlable by any fragment-unaware crawler.

**Prevention:**
- Include only the canonical root URL in sitemap.xml: `<loc>https://devliot.github.io/</loc>`. This is factually correct because all content loads from a single HTML file.
- Do not include per-article hash URLs. They will not be crawled as distinct pages.
- For article-level discovery, rely on the OG tags and Social sharing already implemented in v1.0. Each article's static HTML file (at `articles/<slug>/index.html`) is what search engines can discover if they follow links.
- Optional: add a `<urlset>` entry for each `articles/<slug>/index.html` as a standalone URL (these are real files on disk and are crawlable). These won't render the full article UI but contain the article's raw HTML content, which Googlebot can index. This is the most SEO-effective approach without changing the routing strategy.
- For the sitemap generation script: write a Vite `closeBundle` plugin that reads `articles/index.json` (the article registry) and emits `sitemap.xml` listing `https://devliot.github.io/` plus `https://devliot.github.io/articles/<slug>/index.html` for each article.

**Detection:** Validate the generated `sitemap.xml` by inspecting each `<loc>` — none should contain a `#`. Test with `curl https://devliot.github.io/sitemap.xml` and parse entries.

**Owning phase:** Phase implementing sitemap XML generation.

---

## Moderate Pitfalls

---

### Pitfall 5: White Header/Footer Break Contrast When Background Is Also White

**What goes wrong:** Switching from `--color-surface-alt: #f8f9fa` (the current header background) to `--color-surface: #ffffff` (pure white) makes the header/footer visually merge with the page body, which is also `#ffffff`. The boundary between header and content becomes invisible. Worse: the ASCII logo is `--color-accent: #333333` on white — that's a 10.9:1 ratio (safe), but any muted-color icons, placeholder text, or secondary labels that rely on `--color-text-muted: #666666` on a white background yield 5.74:1, which passes AA but can degrade on lower-quality displays.

**Why it happens:** The current monochrome palette uses `--color-surface-alt` (#f8f9fa) specifically to provide visual separation between the header, body, and footer. Removing that distinction requires an alternative separator — usually a border or a shadow — or the components visually collapse into each other.

**Consequences:** No clear visual hierarchy between header, content, and footer. Loss of perceived page structure. On low-contrast displays or in bright sunlight, the header becomes imperceptible. Users lose the affordance that the header is sticky and separate from the content.

**Prevention:**
- Add a `border-bottom: 1px solid #e5e5e5` to the white header. This is the minimal separator that is visible at all contrast levels and avoids adding color. At `#e5e5e5` on `#ffffff`, the border contrast is 1.57:1 — sufficient for a non-text graphical separator (WCAG requires 3:1 only for UI components that convey information, not decorative separators).
- Alternatively, add `box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.08)` on scroll (via `IntersectionObserver` sentinel, same pattern as noted in research). This avoids the shadow appearing in the resting state.
- Do not increase the shadow to `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)` — at that strength on a white page, the gray shadow visually reads as a color accent, which contradicts the monochrome constraint.
- Validate logo and nav text contrast with WebAIM contrast checker: `#333333` on `#ffffff` = 10.9:1 (AAA). `#666666` on `#ffffff` = 5.74:1 (AA). No failures, but check any new text added during UI refresh.

**Detection:** Disable CSS in devtools momentarily to confirm the header boundary is still perceivable via border/shadow alone. Run automated contrast check on any new color pair introduced during the refresh.

**Owning phase:** UI refresh phase.

---

### Pitfall 6: Bibliography Reference Numbers Collide When Multiple Articles Load in the Same Session

**What goes wrong:** If bibliography items use `id="ref-1"`, `id="ref-2"` etc. as plain numbers, and a user navigates from Article A to Article B in the same SPA session without a page reload, the old IDs from Article A may persist in the DOM (or in the browser's anchor resolution cache), causing `#ref-1` links to resolve to the wrong article's reference.

**Why it happens:** The article component uses `unsafeHTML` to inject article content into the shadow DOM. If bibliography entries are authored with flat IDs like `ref-1`, they are scoped to the shadow root (safe from external collision) but the `href="#ref-1"` in the footnote citation anchor links are resolved against the shadow root's host element — which is correct. However, if anchor `href` values are plain `#ref-1` inside `unsafeHTML`, browsers may resolve them against the document root, not the shadow root, causing them to scroll to the wrong element or find no element at all.

**Consequences:** In-article "jump to reference [1]" links silently do nothing (no element with that ID found in the document root), or worse, jump to a stale ID from a previous article still present in a detached shadow DOM node.

**Prevention:**
- Scope bibliography IDs per-article: use `id="<slug>-ref-1"` and `href="#<slug>-ref-1"`. This prevents cross-article collisions.
- Alternatively: since anchor `href="#id"` inside Shadow DOM does not traverse the shadow boundary to reach the document root (the shadow DOM creates a separate ID namespace per root), navigation links like `<a href="#ref-1">` inside `unsafeHTML` will not find elements. Use JavaScript click handlers instead of `href="#ref-1"`:
  ```js
  refLink.addEventListener('click', (e) => {
    e.preventDefault();
    this.shadowRoot?.querySelector('#ref-1')?.scrollIntoView({ behavior: 'smooth' });
  });
  ```
- Or use the same approach as heading anchors: call a post-processing step in `updated()` that queries all bibliography links and wires them to scroll handlers within the shadow root.
- The backlink from the bibliography entry back to its citation in the article body (`↩`) has the same scoping issue — wire it via JS, not `href="#cite-1"`.

**Detection:** Write a Playwright test: navigate to an article, click "[1]" in the body, assert the page scrolled to the bibliography section. Click "↩" in the bibliography, assert scroll returned to the citation location.

**Owning phase:** Bibliography phase.

---

### Pitfall 7: Bibliography Numbering Must Be Automatic — Manual Numbers Are a Maintenance Trap

**What goes wrong:** Authoring bibliography entries as `[1]`, `[2]`, `[3]` manually in article HTML means reordering references requires updating every citation number in the article body and the bibliography list. This is error-prone and authors will inevitably create gaps (`[1], [3]`) or duplicates (`[2], [2]`).

**Why it happens:** Articles are HTML in Lit components. There is no Markdown preprocessing step or citation management system (Pandoc, BibTeX). Without automation, numbers are just text.

**Consequences:** Bibliography entries fall out of sync with citations in the article body. Broken cross-references erode reader trust. The v2.0 design should anticipate this from the start rather than retrofitting automation after several articles are authored.

**Prevention:**
- Use CSS counters for automatic numbering. Define a `counter-reset: bibliography` on the `<ol>` or the bibliography container, and `counter-increment: bibliography` on each `<li>`. This makes the numbering automatic, reorder-safe, and requires no JavaScript.
  ```css
  ol.bibliography { counter-reset: biblio-counter; list-style: none; }
  ol.bibliography li::before { counter-increment: biblio-counter; content: '[' counter(biblio-counter) '] '; }
  ```
- For in-body citation links (`[1]`, `[2]`), use `<sup><a href="#ref-intro-transformers-1" role="doc-noteref">[1]</a></sup>`. The visible `[1]` text is still manual, but since the bibliography auto-numbers via CSS, the visible number must match the bibliography position. Consider whether to generate citation anchors programmatically in a post-process step in `updated()`.
- Simpler alternative: don't use numbered citations at all. Use inline hyperlinks and a flat reference section without citation numbers. This avoids the numbering problem entirely and is acceptable for a technical blog.

**Detection:** Author a bibliography with 3 entries, reorder entries 1 and 2, verify displayed numbers update without editing the HTML.

**Owning phase:** Bibliography phase.

---

### Pitfall 8: Page-Specific Header Content Requires Route Awareness Inside the Header Component — or a Different Architecture

**What goes wrong:** `devliot-header` currently renders the same content regardless of the current route. v2.0 wants home = search-only header, article = logo-only header. Naively, this means the header component needs to know the current route. But the header is a sibling of `<main>` inside `devliot-app`, not a descendant of the article page component — so it cannot receive a `slug` property from the article.

**Why it happens:** The current architecture in `devliot-app.ts` renders header, main (routed), and footer as flat siblings. The router outlet is in `<main>`. The header has no access to routing state unless it (a) listens to `hashchange` itself, (b) receives a property from `devliot-app`, or (c) the app shell passes a `mode` property.

**Consequences:** Three common bad patterns emerge: (1) Header duplicates the routing logic independently (fragile, becomes the third source of truth after the router and the app shell); (2) Header uses global events and creates tight coupling; (3) Two separate header components are conditionally rendered, causing them to mount/unmount on every route change and losing any header-local state (search open/closed, animation in-progress).

**Prevention:**
- Add a `@property({ type: String }) mode: 'home' | 'article' = 'home'` property to `devliot-header`. The `devliot-app` component, which owns the router, sets `.mode=${this.router.isArticle() ? 'article' : 'home'}` in its `render()` method.
- Keep a single `devliot-header` instance in the DOM. Only the `mode` property changes — the component re-renders its interior but does not unmount. This preserves any transient state (search focus, open/closed) across route transitions.
- Do not use `hashchange` inside the header — it creates an implicit dependency on the routing implementation.

**Detection:** Navigate between home and article. Confirm the header DOM node has the same `shadowRoot` reference (not remounted). Check that a partially-typed search query on home is cleared (or preserved, per UX intent) when navigating, by design.

**Owning phase:** UI refresh phase.

---

### Pitfall 9: Mobile Safari Dynamic Viewport Shifts the Scroll Target After Anchor Navigation

**What goes wrong:** On iOS Safari, the address bar collapses when the user scrolls down and re-expands when they scroll back to the top. When `window.scrollTo({ top: X })` executes, the viewport height is based on the collapsed-bar state. If the address bar re-expands after the scroll settles (because the scroll landed near the top), the visual position of the target heading shifts upward by ~50px (the address bar height), partially obscuring it.

**Why it happens:** iOS Safari has two viewport heights: the small viewport (address bar visible) and the large viewport (address bar hidden). `window.innerHeight` and `getBoundingClientRect()` return values relative to the visual viewport, but `window.scrollY` and `document.documentElement.scrollTop` relate to the layout viewport. During a programmatic scroll, these can diverge momentarily.

**Consequences:** After deep-link navigation on iPhone, the target heading may be 40-55px higher than intended. This is only noticeable when the scroll lands near the top of the page where the address bar is likely to re-expand.

**Prevention:**
- Add a fixed safety margin of 8-12px below the header offset. This creates breathing room that absorbs minor viewport fluctuations.
- Use `dvh` (dynamic viewport height) units where height is needed in CSS, not `100vh`. This does not directly affect scroll offset calculation but prevents related layout shifts.
- Accept this as a minor cosmetic edge case. The heading is not hidden — it is just slightly lower than ideal. A comprehensive fix requires using the `VisualViewport` API, which adds significant complexity for a marginal gain.
- Write a Playwright mobile test (`{ viewport: { width: 390, height: 844 } }`) to catch regressions, but do not model iOS address bar collapse in automated tests — it is a live browser behaviour.

**Detection:** Manual test on real iPhone Safari. Playwright with a mobile viewport does not simulate address bar collapse.

**Owning phase:** Deep-link anchor phase. Note in the implementation plan that the address bar quirk is a known edge case with an accepted tolerance.

---

### Pitfall 10: Authors Array Schema Change Breaks Existing Article Registry Consumers

**What goes wrong:** The existing `articles/index.json` article registry (consumed by `devliot-article-page.ts` and the search index) currently has no `authors` field. Adding an `authors` array to the schema is safe in isolation, but if any consumer deserializes the JSON with a strict type (e.g., a TypeScript `interface Article` without an `authors` field), it will silently drop the field. Future consumers that expect `authors` will find `undefined`.

**Why it happens:** TypeScript interfaces are stripped at runtime. If the registry interface is updated but a consumer file is not recompiled (stale cache, partial rebuild), or if the interface is not updated at all, the field is silently absent.

**Consequences:** Author metadata renders as blank on article pages. Search index does not include author names. Future coauthor support cannot be added without another schema migration.

**Prevention:**
- Update the TypeScript interface for `ArticleMetadata` in the same commit that adds authors support. Make `authors` a required field with a default: `authors: string[]` (empty array if single-author or legacy article).
- Add a build-time validation step (a simple Node script run in `npm run build`) that reads `articles/index.json` and asserts every entry has an `authors` key. Fail the build if any entry is missing it.
- For backward compatibility during the migration: add `"authors": []` to all existing article entries before merging the feature. This prevents any consumer from receiving `undefined`.

**Detection:** TypeScript strict mode (`"strict": true` in tsconfig) will flag any optional access without a null check. Playwright test: load the demo article, assert that the author element is present in the DOM (even if displaying "Anonymous" or a default).

**Owning phase:** Authors phase.

---

## Minor Pitfalls

---

### Pitfall 11: `scroll-padding-top` on `html` Ignored by Programmatic `scrollIntoView()` in Some Browsers

**What goes wrong:** Setting `scroll-padding-top` on the `html` element is the recommended CSS-only solution for sticky header offset. However, this property only affects browser-native scroll-to-anchor (clicking `<a href="#id">`) and `scrollIntoView()` in some browser versions. Safari (desktop and iOS) historically did not apply `scroll-padding-top` when `scrollIntoView()` was called programmatically without an enclosing scroll-snap container. This has been inconsistently patched.

**Prevention:** Always use the JavaScript `window.scrollTo()` approach (Pitfall 2 prevention) as the primary scroll mechanism. Treat `scroll-padding-top` as a progressive enhancement layer that handles edge cases not covered by programmatic scroll (e.g., keyboard Tab navigation to anchored headings).

**Owning phase:** Deep-link anchor phase.

---

### Pitfall 12: Sitemap `<lastmod>` Dates Are Unreliable from File Timestamps

**What goes wrong:** A common pattern in sitemap generation is to use the file's `mtime` (last-modified timestamp) as `<lastmod>`. On GitHub Actions, all files have the checkout timestamp (when the CI runner cloned the repo), not the actual content modification date. Every article appears to have been modified at deploy time, defeating the purpose of `<lastmod>` for incremental crawling.

**Prevention:** Read article dates from the `articles/index.json` registry (which has the `date` field already populated per article) and use that as `<lastmod>`. This is accurate and deterministic regardless of CI filesystem behavior.

**Owning phase:** Sitemap phase.

---

### Pitfall 13: Sticky Header Shadow Visible in Initial Rest State Looks Like a Design Artifact

**What goes wrong:** Adding `box-shadow` to a white sticky header creates a persistent shadow visible even before the user has scrolled. When the header is flush with the page top and nothing is behind it, the shadow renders against the header's own background — making it look like a design mistake rather than a scroll affordance.

**Prevention:** Use the `IntersectionObserver` sentinel pattern: place a 1px invisible `<div id="scroll-sentinel">` as the first child of `<main>`. Observe it in `devliot-app.ts`. When it is out of view (user has scrolled past it), add a CSS class `header--scrolled` to `devliot-header`, which activates the shadow:
```css
:host(.header--scrolled) { box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
```
The sentinel approach uses no scroll event listeners and has zero layout thrashing.

**Owning phase:** UI refresh phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Deep-link anchors | Hash router triggered by anchor clicks (Pitfall 1) | Use `history.replaceState` for `?section=` URL update, never touch `window.location.hash` for anchors |
| Deep-link anchors | Scroll offset ignores sticky header height (Pitfall 2) | Use `window.scrollTo()` with measured header height, not `scrollIntoView()` |
| Deep-link anchors | `scroll-padding-top` unreliable in Safari (Pitfall 11) | JS-first approach as primary, CSS as progressive enhancement |
| Deep-link anchors | Mobile Safari viewport shift (Pitfall 9) | Add 8-12px breathing room below offset, accept as known edge case |
| UI refresh | Header height not constant across page types (Pitfall 3) | `ResizeObserver` in `devliot-app.ts` writes `--header-height` to `:root` |
| UI refresh | White header loses visual separation from body (Pitfall 5) | `border-bottom: 1px solid #e5e5e5` or scroll-activated shadow |
| UI refresh | Scroll shadow visible in rest state (Pitfall 13) | `IntersectionObserver` sentinel activates shadow on scroll |
| UI refresh | Page-specific header requires route awareness (Pitfall 8) | Single header instance with `mode` property set by `devliot-app` |
| Bibliography | In-shadow-DOM `href="#id"` does not navigate correctly (Pitfall 6) | JS click handlers for all bibliography navigation |
| Bibliography | Manual reference numbers become maintenance trap (Pitfall 7) | CSS counters for auto-numbering or avoid numbered citations entirely |
| Authors | Schema change silently drops new field in old consumers (Pitfall 10) | Update TypeScript interface + add `"authors": []` to all existing registry entries |
| Sitemap | Hash fragment URLs not crawled as distinct pages (Pitfall 4) | List root URL + individual `articles/<slug>/index.html` paths, no hash URLs |
| Sitemap | `<lastmod>` uses CI checkout timestamp (Pitfall 12) | Read article `date` field from `articles/index.json` |

---

## Sources

- [MDN: Window: hashchange event](https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event) — confirms pushState does not fire hashchange
- [MDN: scroll-padding-top](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding-top) — property behaviour and scroll-snap caveat
- [CSS-Tricks: Fixed Headers and Jump Links — scroll-margin-top](https://css-tricks.com/fixed-headers-and-jump-links-the-solution-is-scroll-margin-top/) — scroll-margin vs scroll-padding strategies
- [GetPublii: One-line CSS for sticky header anchor offset](https://getpublii.com/blog/one-line-css-solution-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header.html) — scroll-padding-top recommendation
- [Bram.us: 100vh in Safari on iOS](https://www.bram.us/2020/05/06/100vh-in-safari-on-ios/) — dynamic viewport background
- [Google Search Central: JavaScript SEO Basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) — Googlebot fragment stripping
- [Google Search Central: Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — canonical sitemap guidance
- [SEOjuice: URL Fragment Indexing](https://seojuice.com/glossary/seo/programmatic-seo/url-fragment-indexing/) — hash fragments stripped by crawler
- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/) — WCAG AA/AAA contrast thresholds
- [DAISY KB: doc-backlink](https://kb.daisy.org/publishing/docs/html/dpub-aria/doc-backlink.html) — role="doc-backlink" for bibliography backlinks
- [Kitty Giraudel: Accessible Footnotes](https://kittygiraudel.com/2020/11/24/accessible-footnotes-and-a-bit-of-react/) — citation + backlink patterns with ARIA
- [Svelte SPA Router Issue #157: Anchor links in hash routing](https://github.com/ItalyPaleAle/svelte-spa-router/issues/157) — hash-router vs anchor fragment conflict (cross-framework evidence)
- [Walmart Global Tech: Activatable Shadow on Sticky Elements](https://medium.com/walmartglobaltech/activatable-drop-shadow-on-sticky-elements-d0c12f1ebfdf) — IntersectionObserver sentinel pattern for scroll shadow
- [Vispero: Prevent focused elements from being obscured by sticky headers](https://vispero.com/resources/prevent-focused-elements-from-being-obscured-by-sticky-headers/) — ResizeObserver + scroll-padding approach
- [GitHub: vite-plugin-sitemap](https://github.com/jbaubree/vite-plugin-sitemap) — Vite closeBundle sitemap generation
