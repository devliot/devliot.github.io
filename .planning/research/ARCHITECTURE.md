# Architecture Patterns — v2.0 Integration

**Domain:** Lit.js static technical blog (v2.0 feature integration)
**Researched:** 2026-04-14
**Scope:** Integration of 5 new features into the existing v1.0 architecture. Does NOT re-describe v1.0 foundations.

---

## Existing Architecture Reference (v1.0 — do not re-research)

```
src/
  main.ts                         → imports all components, mounts <devliot-app>
  devliot-app.ts                  → HashRouter + layout shell (header/main/footer)
  utils/hash-router.ts            → custom hash router (hashchange listener)
  components/
    devliot-header.ts             → sticky header: logo + search toggle + hamburger
    devliot-footer.ts             → simple copyright footer
    devliot-code.ts               → Shiki syntax highlighting
    devliot-math.ts               → KaTeX math rendering
    devliot-diagram.ts            → Mermaid diagram rendering
    devliot-chart.ts              → Chart.js chart rendering
  pages/
    devliot-home-page.ts          → article list + tag filter chips + search
    devliot-article-page.ts       → fetches article HTML, renders metadata, injects heading anchors
  styles/
    app.css, header.css, footer.css, article.css, home.css, ...

public/
  articles/
    index.json                    → metadata registry (slug, title, date, category, tags, description, image, readingTime)
    {slug}/index.html             → raw article HTML content
    {slug}/meta.json              → per-article metadata (slug, title, date, category, tags)
  search-data.json                → built by build-search-index.mjs

scripts/
  build-og-pages.mjs              → --enrich: computes readingTime; --generate: writes dist/articles/{slug}/og.html
  build-search-index.mjs          → builds search-data.json from article HTML + index.json

URL scheme: /#/ (home)  |  /#/article/{slug}  |  /#/?tag=foo  |  /#/?q=foo
Section links: window.location.search ?section={id} (not hash-based)
```

**Critical detail:** The router lives in `window.location.hash` (e.g. `#/article/01-demo-article`). The `?section=` parameter lives in `window.location.search` (i.e., the query string before the `#`). The HashRouter reads `window.location.hash` only. The article page reads `window.location.search` for section scrolling. These are two orthogonal URL segments.

---

## Feature 1: Deep-Linkable Anchors (h2/h3)

### Current State

`_injectHeadingAnchors()` in `devliot-article-page.ts`:
- Sets `heading.id` from slugified text
- Renders a `#` anchor button with `position: absolute; left: -1.5em`
- On click: writes `?section={id}` to clipboard, calls `heading.scrollIntoView({ behavior: 'smooth' })`
- Does NOT update the URL

`_scrollToSectionFromUrl()`:
- Reads `window.location.search` (not the hash) for `?section={id}`
- Calls `target.scrollIntoView({ behavior: 'smooth' })` without header offset compensation

### What Needs to Change

**Deep-link URL update (click behavior):**

The anchor click must update the browser URL so the link is shareable. The current clipboard write + no-URL-update approach is incomplete. The correct behavior: clicking `#` copies the shareable URL to clipboard AND pushes it to the browser URL bar without reloading.

Implementation: change the click handler in `_injectHeadingAnchors()` to call:
```typescript
const sectionUrl = `${window.location.origin}${window.location.pathname}?section=${id}${window.location.hash}`;
history.pushState(null, '', `?section=${id}${window.location.hash}`);
navigator.clipboard.writeText(sectionUrl).catch(() => {});
```

`history.pushState` updates the URL bar without triggering a page reload or hashchange event. This preserves the `#/article/{slug}` hash intact while appending `?section={id}` to the search segment.

**Header-offset scroll (scroll-margin-top vs JS):**

The sticky header is `devliot-header` with `position: sticky; top: 0` in `header.css`. Its rendered height is approximately 48–60px depending on viewport (logo at `font-size: 6px–10px` + padding). The exact height is not fixed — it depends on the rendered ASCII logo height.

Recommendation: **CSS `scroll-margin-top` via CSS custom property, set dynamically by JS once on mount.**

Rationale:
- `scroll-margin-top` works with `scrollIntoView()` natively (MDN-confirmed behavior). When set on a heading, the browser adds that margin above it when scrolling it into view, which offsets the sticky header.
- A hardcoded pixel value in CSS would break if header height changes responsively.
- The correct pattern: on mount, measure the header height and write it to a CSS custom property on `:root`, then apply `scroll-margin-top: var(--header-height)` to headings in article CSS.

CSS custom properties pierce shadow DOM boundaries by design. The `--header-height` variable set on `document.documentElement` is readable inside any component's shadow root CSS.

**Integration points:**

| What | File | Change type |
|------|------|-------------|
| Measure header height, set `--header-height` on `:root` | `devliot-app.ts` | Modify: add `ResizeObserver` on `<devliot-header>` in `firstUpdated()` |
| Apply `scroll-margin-top: var(--header-height)` to `h2, h3` | `src/styles/article.css` | Modify: add scroll-margin-top rule |
| Update anchor click handler to `history.pushState` | `devliot-article-page.ts` → `_injectHeadingAnchors()` | Modify: replace clipboard-only with pushState + clipboard |
| Handle `popstate` event for browser back/forward with section | `devliot-article-page.ts` | Modify: add `popstate` listener alongside hashchange |

**No new files required for this feature.**

### Concrete Implementation Sketch

In `devliot-app.ts`, after `firstUpdated()`:
```typescript
firstUpdated() {
  const header = this.shadowRoot?.querySelector('devliot-header');
  if (header) {
    const ro = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${entry.contentRect.height}px`
      );
    });
    ro.observe(header);
  }
}
```

In `src/styles/article.css`:
```css
h2, h3, h4, h5, h6 {
  scroll-margin-top: var(--header-height, 64px);
}
```

The `64px` fallback covers the case where the JS hasn't run yet (SSR, first paint).

In `_injectHeadingAnchors()` click handler:
```typescript
anchor.addEventListener('click', (e: MouseEvent) => {
  e.preventDefault();
  history.pushState(null, '', `?section=${id}${window.location.hash}`);
  heading.scrollIntoView({ behavior: 'smooth' });
  navigator.clipboard.writeText(window.location.href).catch(() => {});
});
```

---

## Feature 2: UI Refresh (Header/Footer)

### Current State

- `devliot-header.ts` always shows: ASCII logo (left) + search toggle + hamburger (right)
- `devliot-footer.ts` always shows: `© 2026 DEVLIOT`
- `devliot-app.ts` renders both unconditionally with no page-context awareness

### What Needs to Change

**Page-aware header content:**

Per PROJECT.md v2.0 requirement: home = search-only, article = logo-only.

The header must know which page is active. The cleanest integration with the existing HashRouter: pass a `@property() page: 'home' | 'article'` to `devliot-header`.

In `devliot-app.ts`, the router already knows the current route. The render method can pass the page type:
```typescript
render() {
  const page = this.router.currentPage; // 'home' | 'article'
  return html`
    <devliot-header .page=${page}></devliot-header>
    <main>${this.router.outlet()}</main>
    <devliot-footer></devliot-footer>
  `;
}
```

This requires exposing `currentPage` (or equivalent) from `HashRouter`. The router already tracks `currentPath` — add a getter that derives `'home' | 'article'` from it.

**White header/footer background:**

Currently `background-color: var(--color-surface-alt)` (slightly off-white). Change to `background-color: #ffffff` or `var(--color-surface)` in `header.css` and `footer.css`.

**Search relocation (home = search-only):**

On home, the header renders only a search bar (no logo). The ASCII logo remains in the hero section of `devliot-home-page.ts` (already present). The search event dispatch mechanism (`devliot-search` custom event bubbling up to `devliot-home-page`) stays unchanged.

On article, the header renders only the logo (no search). Search is irrelevant in article context.

**Integration points:**

| What | File | Change type |
|------|------|-------------|
| Add `page` property to header | `devliot-header.ts` | Modify: add `@property() page: 'home' \| 'article' = 'home'` + conditional render |
| Expose current page from router | `src/utils/hash-router.ts` | Modify: add `get currentPage()` getter |
| Pass page to header | `devliot-app.ts` | Modify: `.page=${this.router.currentPage}` in render |
| White background for header/footer | `src/styles/header.css`, `src/styles/footer.css` | Modify: background color |
| Header CSS adjustments for two modes | `src/styles/header.css` | Modify: conditional layout styles |

**No new files required for this feature.**

---

## Feature 3: Per-Article Bibliography

### index.json Schema Extension

Add a `bibliography` array to each article entry in `public/articles/index.json`. Each entry is a reference object.

Proposed schema:
```json
{
  "articles": [
    {
      "slug": "01-demo-article",
      "title": "Article Components Demo",
      "date": "2026-04-11",
      "category": "Tutorial",
      "tags": ["demo", "components", "reference"],
      "description": "...",
      "image": "articles/01-demo-article/og-image.png",
      "readingTime": 2,
      "bibliography": [
        {
          "id": "ref1",
          "type": "article",
          "authors": ["Smith, J.", "Doe, A."],
          "title": "Attention Is All You Need",
          "year": 2017,
          "url": "https://arxiv.org/abs/1706.03762",
          "venue": "NeurIPS 2017"
        },
        {
          "id": "ref2",
          "type": "book",
          "authors": ["LeCun, Y."],
          "title": "Deep Learning",
          "year": 2016,
          "publisher": "MIT Press"
        },
        {
          "id": "ref3",
          "type": "web",
          "authors": ["Karpathy, A."],
          "title": "The Unreasonable Effectiveness of RNNs",
          "year": 2015,
          "url": "http://karpathy.github.io/2015/05/21/rnn-effectiveness/",
          "accessed": "2026-04-01"
        }
      ]
    }
  ]
}
```

Fields:
- `id` — used for `[ref1]` citation anchors inside article HTML (future feature — not required for v2.0)
- `type` — `"article"` | `"book"` | `"web"` — drives formatting logic
- `authors` — array of strings in "Last, F." format
- `title` — required
- `year` — required
- `url` — optional (links the title)
- `venue` — for academic papers (conference/journal)
- `publisher` — for books
- `accessed` — for web references

Articles with no bibliography omit the field entirely (treated as empty by the component).

### Rendering Component

New Lit component `devliot-bibliography.ts` (or inline rendering inside `devliot-article-page.ts`). Given the simplicity (a formatted list), inline rendering in article page is preferred — no need for a new element.

In `devliot-article-page.ts`:
- Add `_bibliography` to `@state()` (typed array)
- Load it from the `bibliography` field of the fetched metadata
- Render a `<section class="bibliography">` below the tags nav

Placement: bibliography appears after article content + after tag navigation, before the footer.

Format: numbered list `[1] Author, A., Author, B. (year). Title. Venue. URL.`

**Integration points:**

| What | File | Change type |
|------|------|-------------|
| Add `bibliography` field to index.json | `public/articles/index.json` | Modify: add array per article |
| Add `_bibliography` state + render | `devliot-article-page.ts` | Modify: load + render bibliography section |
| Add bibliography styles | `src/styles/article.css` | Modify: add `.bibliography` section styles |
| Update `enrichIndexJson` to preserve bibliography | `scripts/build-og-pages.mjs` | Verify: `JSON.parse`/`JSON.stringify` round-trip preserves unknown fields — it does, no change needed |
| Update TypeScript interface | `devliot-article-page.ts` | Modify: add `BibEntry` interface |

**No new files required for this feature.** The bibliography is metadata-only — no separate data file.

---

## Feature 4: Per-Article Authors

### index.json Schema Extension

Add an `authors` field to each article entry:
```json
{
  "slug": "01-demo-article",
  "title": "Article Components Demo",
  "date": "2026-04-11",
  "authors": [
    {
      "name": "Eliott Barril",
      "role": "author",
      "url": "https://github.com/devliot"
    }
  ],
  "bibliography": [...]
}
```

Fields:
- `name` — display name (required)
- `role` — `"author"` | `"co-author"` (optional, default `"author"`)
- `url` — profile link (optional)

Single-author articles use a single-element array. Multi-author articles list all. Articles without an `authors` field are treated as anonymous.

### Display Location

Authors display in the article metadata bar, alongside date and reading time. The existing metadata line in `devliot-article-page.ts` renders:
```
April 11, 2026  ·  2 min read
```

Extend to:
```
April 11, 2026  ·  2 min read  ·  Eliott Barril
```

For multi-author: `Eliott Barril & Jane Doe` or `Eliott Barril, Jane Doe`.

If `url` is present, the name is a link. If not, plain text.

This placement is preferred over a dedicated section below the article because: (a) it matches established blog conventions (Substack, Medium), (b) it avoids disrupting the content flow, (c) it is scannable before reading.

**Integration points:**

| What | File | Change type |
|------|------|-------------|
| Add `authors` field to index.json | `public/articles/index.json` | Modify: add array per article |
| Add `_authors` state + render in meta bar | `devliot-article-page.ts` | Modify: load + inline render |
| Update TypeScript interface | `devliot-article-page.ts` | Modify: add `Author` interface |
| No style changes needed | `src/styles/article.css` | None — uses existing `.article-meta` styles |

**No new files required for this feature.**

---

## Feature 5: Sitemap XML

### Where it Fits in the Build Pipeline

The existing build script is:
```
node scripts/build-og-pages.mjs --enrich
  && node scripts/build-search-index.mjs
  && tsc
  && vite build
  && node scripts/build-og-pages.mjs --generate
```

Sitemap generation runs at the end, after `vite build`, because it writes to `dist/`. It reads from the already-enriched `public/articles/index.json`.

New build script: `scripts/build-sitemap.mjs`

Updated build sequence:
```
node scripts/build-og-pages.mjs --enrich
  && node scripts/build-search-index.mjs
  && tsc
  && vite build
  && node scripts/build-og-pages.mjs --generate
  && node scripts/build-sitemap.mjs
```

### Sitemap Content

The site uses hash-based routing (`/#/article/{slug}`). Search engines treat the fragment as client-side-only and ignore it — they only index `https://devliot.github.io/`. However, the existing OG pages at `dist/articles/{slug}/og.html` are real static paths that crawlers can follow. The sitemap should list:

1. The root URL: `https://devliot.github.io/` (the SPA shell — home page)
2. Each OG page: `https://devliot.github.io/articles/{slug}/og.html` — these are real static URLs with full OG metadata

Including only the root URL is minimal but valid. Including OG pages gives crawlers a path to each article's metadata.

### Script Implementation

`scripts/build-sitemap.mjs` follows the same pattern as `build-og-pages.mjs`:
- Reads `public/articles/index.json` (for slugs and dates)
- Writes `dist/sitemap.xml`
- Pure Node.js — no npm dependencies needed; XML is simple string templating

Sitemap structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://devliot.github.io/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://devliot.github.io/articles/01-demo-article/og.html</loc>
    <lastmod>2026-04-11</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

Note: `lastmod` uses the article's `date` field from index.json. `changefreq: never` for articles (they don't change after publish). Add a `robots.txt` to `public/` pointing to the sitemap — it is copied verbatim to `dist/` by Vite.

**Integration points:**

| What | File | Change type |
|------|------|-------------|
| New sitemap generator script | `scripts/build-sitemap.mjs` | New file |
| Add script to build pipeline | `package.json` scripts.build | Modify: append `&& node scripts/build-sitemap.mjs` |
| Add robots.txt pointing to sitemap | `public/robots.txt` | New file |

**`dist/sitemap.xml` is a generated artifact — never committed to source.**

---

## New vs. Modified: Complete Split

### New Files

| File | Purpose |
|------|---------|
| `scripts/build-sitemap.mjs` | Sitemap XML generator |
| `public/robots.txt` | Points crawlers to sitemap |

### Modified Files

| File | Features Affected |
|------|------------------|
| `src/devliot-app.ts` | Header ResizeObserver (feature 1), pass `page` to header (feature 2) |
| `src/utils/hash-router.ts` | Expose `currentPage` getter (feature 2) |
| `src/components/devliot-header.ts` | Page-aware conditional rendering (feature 2) |
| `src/components/devliot-footer.ts` | Background color change (feature 2) |
| `src/pages/devliot-article-page.ts` | Deep-link pushState (feature 1), authors (feature 4), bibliography (feature 3) |
| `src/styles/article.css` | `scroll-margin-top` (feature 1), bibliography styles (feature 3) |
| `src/styles/header.css` | White background + two-mode layout (feature 2) |
| `src/styles/footer.css` | White background (feature 2) |
| `public/articles/index.json` | Add `authors` + `bibliography` fields (features 3, 4) |
| `package.json` | Extend build script with sitemap step (feature 5) |

---

## Recommended Build Order

Dependencies between features drive this ordering:

**Phase 1: Data schema first (index.json)**

Add `authors` and `bibliography` fields to `index.json` before any component work. Both features 3 and 4 read from this file. Do it once, do it right, then build components against the real data shape. The `build-og-pages.mjs --enrich` step round-trips `index.json` through `JSON.parse`/`JSON.stringify` — verify the enrichment step preserves new fields (it does, since it only writes `readingTime`).

**Phase 2: Deep-linkable anchors**

This is the most architecturally significant change. It touches `devliot-app.ts`, `hash-router.ts`, `devliot-article-page.ts`, and `article.css`. Getting the header ResizeObserver → `--header-height` CSS variable pipeline working first means subsequent phases don't need to re-examine scrolling behavior. This has no dependencies on features 2, 3, or 4.

**Phase 3: UI refresh (header/footer)**

Depends on Phase 2 having established the `ResizeObserver` in `devliot-app.ts`. The header restructuring is independent of article content features (3 and 4). Build this before bibliography/authors because header height changes could affect `--header-height`, and it's better to finalize the header before testing scroll behavior end-to-end.

**Phase 4: Authors**

Simpler than bibliography (no list rendering, no type dispatch logic). Renders in the existing metadata bar. Serves as a warm-up for Phase 5's more complex rendering.

**Phase 5: Bibliography**

Most complex rendering in this milestone (type-dependent formatting: article vs book vs web). Build last among content features. Depends on Phase 1 (schema must exist in index.json). Independent of features 1, 2, 4.

**Phase 6: Sitemap**

Pure build artifact. No runtime components. No dependencies on features 1–5 except that `authors` and `bibliography` in index.json may be included in sitemap metadata in the future — but for v2.0 the sitemap only reads `slug` and `date`. Can be built any time after the build pipeline is understood. Lowest risk, build last.

**Dependency graph:**
```
Schema (index.json)
  ├── Authors rendering (article-page)
  └── Bibliography rendering (article-page)

Header ResizeObserver (app)
  ├── Deep-link scroll-margin-top (article-page + CSS)
  └── UI refresh header height (header.css)

Sitemap (standalone — no deps on other v2.0 features)
```

---

## Key Architectural Constraints to Respect

**Shadow DOM and CSS custom properties:** `--header-height` must be set on `document.documentElement` (not on a shadow host) to be accessible inside `devliot-article-page`'s shadow root. CSS variables pierce shadow boundaries only when defined on an ancestor in the light DOM.

**HashRouter and `window.location.search`:** The current design uses `?section=` in `window.location.search` (before the `#`). `history.pushState` can update the search segment without affecting `window.location.hash`. This means the HashRouter's `_onHashChange` handler is NOT triggered by pushState calls that only change the search segment — section navigation does not re-render the router. This is the correct behavior.

**`build-og-pages.mjs --enrich` idempotency:** The enrich step reads index.json, computes `readingTime`, and writes back. It uses `JSON.parse`/`JSON.stringify` with 2-space indent. Any manually-added `authors` or `bibliography` fields will be preserved through this round-trip. Confirmed: the script only explicitly sets `article.readingTime` — all other fields pass through untouched.

**No new npm dependencies required** for any of these 5 features. All are implementable with existing stack (Lit, ResizeObserver Web API, history.pushState Web API, Node.js built-in fs for sitemap).

---

## Sources

- `scroll-margin-top` with `scrollIntoView()`: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top — HIGH confidence
- Dynamic scroll offset via CSS custom properties: https://kurtrank.me/dynamic-scroll-offset-via-custom-properties/ — MEDIUM confidence
- CSS custom properties pierce shadow DOM (Lit docs): https://lit.dev/docs/components/styles/ — HIGH confidence
- `history.pushState` without hashchange: https://developer.mozilla.org/en-US/docs/Web/API/History/pushState — HIGH confidence
- Sitemap.xml for hash-based GitHub Pages SPAs: https://github.com/cicirello/generate-sitemap — MEDIUM confidence
- Sitemap XML spec: https://www.sitemaps.org/protocol.html — HIGH confidence
