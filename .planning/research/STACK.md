# Technology Stack

**Project:** devliot — Lit.js static technical blog
**Researched:** 2026-04-08 (v1.0) | Updated: 2026-04-14 (v2.0 additions)

---

## v2.0 Verdict: Zero New Runtime Dependencies

All five v2.0 features can be implemented with the existing stack. No new npm packages are required. The sections below document each feature's stack implications explicitly.

---

## v2.0 Feature-by-Feature Stack Analysis

### Feature 1 — Deep-linkable Anchors (h2/h3)

**New dependency:** NONE

**What already exists:** The `_injectHeadingAnchors()` method in `devliot-article-page.ts` already processes h2–h6, assigns `id` attributes, and inserts `.heading-anchor` elements. The click handler currently writes `?section=<id>` into `navigator.clipboard.writeText()` and calls `scrollIntoView()`. The `_scrollToSectionFromUrl()` method reads `?section=` from `window.location.search`.

**What changes (pure TypeScript + CSS, no new deps):**

1. **URL update on click** — Replace the clipboard call with `history.replaceState(null, '', ...)` to update the address bar. Because the site uses hash-based routing (`#/article/slug`), the anchor identifier is embedded inside the hash string, forming `#/article/slug?section=id`. This is already parsed by `HashRouter._onHashChange` (it splits on `?`), so the router will not re-trigger a navigation. Use `history.replaceState` — not `location.hash = ...` — because reassigning the hash fires a `hashchange` event that causes the router to re-process the URL.

2. **Scroll with header offset** — Use `scroll-margin-top` CSS property on `h2, h3` headings. This is the idiomatic pure-CSS solution (no JS computation of header height), universally supported since 2020. Set the value to the sticky header height measured at implementation time.

3. **Scroll on page load** — `_scrollToSectionFromUrl()` already exists. It needs a `requestAnimationFrame` or `setTimeout(0)` delay to ensure Lit's render cycle completes before scrolling. The CSS `scroll-margin-top` then handles the header offset automatically.

**Standards references:**
- `scroll-margin-top` (Baseline 2020, all browsers): https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top
- `history.replaceState` (universal): https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState

**Confidence:** HIGH

---

### Feature 2 — UI Refresh (white header/footer, page-specific header)

**New dependency:** NONE

**What changes:**

1. **White header/footer** — CSS-only: change background on `header.css` and `footer.css` to `#ffffff`, adjust border/shadow.

2. **Page-specific header content** — Add `@property({ type: String }) mode: 'home' | 'article' = 'home'` to `devliot-header`. Conditionally render either search only (home) or logo only (article). `devliot-app.ts` (the router host) sets this attribute when rendering each page route.

**Confidence:** HIGH

---

### Feature 3 — Per-article Bibliography

**New dependency:** NONE

**Metadata schema addition** — Add optional `references` array to `public/articles/index.json` entries:

```json
{
  "slug": "...",
  "references": [
    {
      "label": "[1]",
      "title": "Attention Is All You Need",
      "authors": "Vaswani et al.",
      "year": 2017,
      "url": "https://arxiv.org/abs/1706.03762"
    }
  ]
}
```

**Rendering** — `devliot-article-page.ts` already fetches and exposes metadata. Add `@state() private _references` and render them below the article body as a `<section>` with an `<ol>`. Pure Lit template work.

**Schema.org deferred** — `schema.org/citation` markup would be a future SEO enhancement, not required for v2.0.

**Confidence:** HIGH

---

### Feature 4 — Per-article Author(s)

**New dependency:** NONE

**Metadata schema addition** — Add optional `authors` array to `public/articles/index.json` entries:

```json
{
  "slug": "...",
  "authors": [
    { "name": "Eliott", "url": "https://github.com/devliot" }
  ]
}
```

Use an array (not a string) for consistency — supports co-authors without a schema change.

**Rendering** — Surface in `devliot-article-page.ts` alongside the existing date/readingTime meta block. Pure Lit template.

**Schema.org JSON-LD (recommended, no new dep)** — Extend `scripts/build-og-pages.mjs` to inject a `<script type="application/ld+json">` block into each OG HTML page. The `BlogPosting` + `author: { "@type": "Person" }` markup improves Google rich results and AI search visibility. This is a plain JSON string written by the existing Node.js build script — zero additional dependencies.

Schema shape:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Article title",
  "datePublished": "2026-04-11",
  "author": { "@type": "Person", "name": "Eliott", "url": "https://github.com/devliot" }
}
```

**Standards references:**
- schema.org/BlogPosting: https://schema.org/BlogPosting
- schema.org/author: https://schema.org/author
- Google structured data guide: https://developers.google.com/search/docs/appearance/structured-data/article

**Confidence:** HIGH for rendering; MEDIUM for schema.org (standard is stable, Google's rich result eligibility criteria evolve)

---

### Feature 5 — Sitemap XML

**New dependency:** NONE

**Implementation** — Add `scripts/build-sitemap.mjs`, modeled after `build-og-pages.mjs`. Reads `public/articles/index.json`, writes `dist/sitemap.xml` after the Vite build. Add to the `build` script in `package.json` after the `vite build` step.

**Protocol** — Sitemap Protocol 0.9 (stable since 2008, no updates since). Namespace: `http://www.sitemaps.org/schemas/sitemap/0.9`.

**Required per URL:**
- `<loc>` — absolute URL (required)
- `<lastmod>` — use article `date` field in `YYYY-MM-DD` format (Google uses this when accurate)

**Omit entirely:**
- `<priority>` — Google ignores it
- `<changefreq>` — Google ignores it

**Pages to include:**
- Home: `https://devliot.github.io/`
- Per-article OG pages: `https://devliot.github.io/articles/{slug}/og.html`

**Critical note on hash routing:** The SPA URLs (`/#/article/slug`) are hash fragments — not crawlable by search engines. The crawlable URLs are the OG HTML pages (`/articles/{slug}/og.html`). The sitemap must list those, not hash URLs.

**robots.txt** — Add a `Sitemap: https://devliot.github.io/sitemap.xml` directive. Place the file at `public/robots.txt` (Vite copies `public/` to `dist/` verbatim).

**Standards references:**
- Sitemap Protocol 0.9: https://www.sitemaps.org/protocol.html
- Google sitemap build guide: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

**Confidence:** HIGH — protocol is frozen; implementation is plain Node.js string concatenation

---

## What NOT to Add (Anti-patterns for This Project)

| Temptation | Why to Reject |
|---|---|
| `sitemap` npm package | A sitemap for a static blog with < 100 articles is ~20 lines of template string. A 100KB dependency is disproportionate. |
| `anchor-js` or similar | `_injectHeadingAnchors()` already exists. AnchorJS adds 4KB for functionality already in the codebase. |
| `schema-dts` (schema.org TypeScript types) | Useful for large projects; for one JSON-LD block per article in a Node.js build script, plain JS object literals are simpler with zero overhead. |
| `gray-matter` / frontmatter parsers | Metadata lives in `index.json`, not Markdown frontmatter. No parsing needed. |
| `js-yaml` for author/bibliography config | JSON is the existing metadata format. YAML adds a dep and a build step for no gain. |
| `scrollIntoView` polyfills | Baseline 2015+. All target browsers support it natively. |

---

## Build Script Integration (Updated Build Order)

Current `build` script in `package.json`:
```
node scripts/build-og-pages.mjs --enrich
&& node scripts/build-search-index.mjs
&& tsc
&& vite build
&& node scripts/build-og-pages.mjs --generate
```

Updated for v2.0:
```
node scripts/build-og-pages.mjs --enrich
&& node scripts/build-search-index.mjs
&& tsc
&& vite build
&& node scripts/build-og-pages.mjs --generate
&& node scripts/build-sitemap.mjs
```

`build-sitemap.mjs` runs post-Vite-build so it can write directly to `dist/`.

---

## Version Notes

**FlexSearch installed version:** `package.json` shows `flexsearch@0.8.212`; CLAUDE.md documents `0.7.x`. The installed version is 0.8.x (0.8 is the current npm latest). No v2.0 feature touches search — leave as-is, but CLAUDE.md should be corrected to reflect `0.8.x`.

**TypeScript installed version:** `package.json` shows `typescript@^6.0.2`; CLAUDE.md says `5.x`. TypeScript 6 was released in 2025. No breaking changes for the v2.0 features. CLAUDE.md should be updated.

---

## v2.0 Summary Table

| Feature | New Dep | Files Changed |
|---|---|---|
| Deep-linkable anchors | None | `devliot-article-page.ts`, `article.css` |
| UI refresh | None | `devliot-header.ts`, `devliot-app.ts`, `header.css`, `footer.css` |
| Bibliography | None | `index.json` schema (add `references[]`), `devliot-article-page.ts` |
| Authors | None | `index.json` schema (add `authors[]`), `devliot-article-page.ts`, `build-og-pages.mjs` |
| Sitemap XML | None | New `scripts/build-sitemap.mjs`, new `public/robots.txt`, `package.json` |

---

## v1.0 Recommended Stack (retained for reference)

### Core Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `lit` | 3.3.1 | Web component authoring | Non-negotiable per project constraints. Lit 3 is ES2021, drops IE11, is stable and interop with Lit 2. No breaking changes from 2→3 for typical usage. |
| TypeScript | 5.x (via Vite) | Type safety | Standard for Lit projects. Decorators (`@customElement`, `@property`) require `useDefineForClassFields: false` in tsconfig — this is a Lit-specific gotcha. |

**Confidence:** HIGH — verified on lit.dev and GitHub releases.

---

### Build Tool

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `vite` | 8.x (current) | Dev server + production build | Vite ships a `lit` and `lit-ts` template via `create-vite`. Lit's official docs recommend Rollup for production, and Vite uses Rollup/Rolldown under the hood. Handles HMR, TypeScript transpilation (via esbuild, 20-30x faster than tsc), asset hashing, and static output for GitHub Pages. Vite 8 (April 2026) integrates Rolldown for ~70% faster builds. |

**Confidence:** HIGH — Vite's official docs show explicit GitHub Pages deployment instructions. lit template is first-class.

**Do NOT use:** Webpack — unnecessary complexity for a single-author blog. Raw Rollup — Vite adds dev server, HMR, and zero-config TS without boilerplate.

---

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Pages + GitHub Actions | — | Hosting + CI/CD | Non-negotiable per project constraints. Vite's official guide has a canonical workflow: push to main → `npm run build` → upload `dist/` → deploy via `actions/deploy-pages@v5`. |

**Key config requirement:** Set `base: '/<REPO>/'` in `vite.config.ts` if deploying to `username.github.io/<repo>/`. If using a custom domain or root pages site, omit (defaults to `/`).

**Confidence:** HIGH — Vite's static deploy docs are authoritative.

---

### Client-Side Routing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom `HashRouter` | — | SPA navigation (category pages, article routes) | Implemented in v1.0 as `src/utils/hash-router.ts`. Replaces `@lit-labs/router` (which was considered but the custom 75-line implementation is simpler and more controllable for hash-based routing on GitHub Pages). |

**Confidence:** HIGH — implementation validated in v1.0.

---

### Syntax Highlighting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `shiki` | 4.0.2 | Code block syntax highlighting | Shiki is the current industry standard (adopted by VitePress, Nuxt Content, Astro). Uses TextMate grammars — same accuracy as VS Code. Ships zero JS to the client when used at build time. Supports lazy-loading themes/languages on demand in the browser (~200KB total for typical usage). Prism is stagnant (v2 abandoned). Highlight.js is heavier and less accurate. |

**Confidence:** HIGH — Shiki docs confirm v4.0.2 with browser CDN support.

---

### Math Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `katex` | 0.16.45 | LaTeX math formula rendering | KaTeX is synchronous, ~347KB page weight, and fast. MathJax 3 has closed the performance gap but is larger and async-first. For a blog rendering `\( ... \)` and `\[ ... \]` in HTML, KaTeX's synchronous API is the simpler integration. |

**Confidence:** HIGH — KaTeX version confirmed via katex.org CDN docs.

---

### Diagrams

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `mermaid` | 11.14.0 | Flowcharts, sequence diagrams, architecture diagrams, state machines | Non-negotiable per project requirements. v11 is the current stable. Supports all required diagram types plus Wardley Maps and TreeView added in 11.14.0. |

**Bundle size warning:** Mermaid is large. Lazy-load inside a Lit web component that only initializes when a `<mermaid-diagram>` element enters the viewport (Intersection Observer).

**Confidence:** HIGH — version confirmed from GitHub releases (April 1, 2026 release).

---

### Data Visualization (Charts)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `chart.js` | 4.5.1 | Bar charts, line charts, scatter plots, histograms | Canvas-based (faster for many data points), tree-shakeable, simple declarative config, no D3 expertise required. |
| `@observablehq/plot` | 0.6.17 | Grammar-of-graphics style charts (histograms, distributions) | Use when Chart.js's pre-defined chart types are too rigid. A histogram in D3 is 50 lines; in Plot it's 1. |

**Confidence:** MEDIUM — Chart.js version from GitHub releases (October 2024). Observable Plot version from GitHub releases (February 2025).

---

### Client-Side Search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `flexsearch` | 0.8.x | Full-text search across articles | FlexSearch is the fastest client-side search library available. At build time, generate a JSON search index from article content; at runtime, load it lazily. |

**Confidence:** MEDIUM — community consensus. FlexSearch's API has historically been unstable between minor versions.

---

## Complete Dependency Summary (v1.0 baseline, no changes for v2.0)

```bash
# Core
npm install lit

# Build tool
npm install -D vite typescript

# Syntax highlighting
npm install shiki

# Math rendering
npm install katex

# Diagrams (lazy-loaded)
npm install mermaid

# Charts
npm install chart.js
npm install @observablehq/plot

# Search index
npm install flexsearch

# Fonts
npm install @fontsource/inter @fontsource/fira-code
```

---

## TypeScript Configuration Note

For Lit with TypeScript and decorators, `tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "useDefineForClassFields": false,
    "experimentalDecorators": true
  }
}
```

Without `useDefineForClassFields: false`, Lit's `@property()` decorators break silently — reactive properties stop updating the DOM.

**Confidence:** HIGH — documented in Lit official upgrade guide and Vite starter kit.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Syntax highlighting | Shiki 4 | Prism.js | Prism v2 abandoned; Prism v1 maintenance-only |
| Syntax highlighting | Shiki 4 | Highlight.js | Less accurate TypeScript/JSX; heavier |
| Math rendering | KaTeX | MathJax 3 | Heavier, async, overkill for v1 |
| Charts | Chart.js + Observable Plot | D3.js | Too low-level; 5-10x code for standard charts |
| Charts | Chart.js + Observable Plot | ApexCharts | Heavy styling overhead |
| Routing | Custom HashRouter | Vaadin Router | Abandoned November 2024 |
| Routing | Custom HashRouter | @lit-labs/router | Labs = pre-stable; custom 75-line solution is simpler for hash routing |
| Search | FlexSearch | Lunr.js | Slower on larger article counts |
| Build | Vite | Raw Rollup | No dev server, no HMR, more config boilerplate |
| Sitemap | Custom script | `sitemap` npm package | Overkill for < 100 articles; plain template string suffices |
| Anchor linking | Custom JS | `anchor-js` | `_injectHeadingAnchors()` already exists; AnchorJS adds 4KB for nothing |

---

## Sources

- Lit 3.3.1 release: https://github.com/lit/lit/releases
- Lit production build guide: https://lit.dev/docs/tools/production/
- Vite GitHub Pages deployment: https://vite.dev/guide/static-deploy
- Vite 8 with Rolldown: https://vite.dev/blog
- Shiki v4.0.2 installation: https://shiki.style/guide/install
- Shiki v4 changelog: https://shiki.style/blog/v4
- KaTeX 0.16.45: https://katex.org/docs/browser.html
- KaTeX vs MathJax 2025: https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison
- Mermaid 11.14.0 release: https://github.com/mermaid-js/mermaid/releases
- Mermaid web component wrapper: https://blog.lmorchard.com/2026/01/28/mermaid-web-component/
- Mermaid lazy loading: https://weblog.west-wind.com/posts/2025/May/10/Lazy-Loading-the-Mermaid-Diagram-Library
- Chart.js 4.5.1 release: https://github.com/chartjs/Chart.js/releases
- Observable Plot 0.6.17: https://github.com/observablehq/plot/releases
- Observable Plot getting started: https://observablehq.com/plot/getting-started
- FlexSearch 0.8 npm: https://www.npmjs.com/package/flexsearch
- FlexSearch vs Lunr: https://npm-compare.com/elasticlunr,flexsearch,fuse.js,lunr,search-index
- Comparing syntax highlighters 2025: https://chsm.dev/blog/2025/01/08/comparing-web-code-highlighters
- scroll-margin-top MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-top
- Fixed Headers and Jump Links (CSS-Tricks): https://css-tricks.com/fixed-headers-and-jump-links-the-solution-is-scroll-margin-top/
- history.replaceState MDN: https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
- Sitemap Protocol 0.9: https://www.sitemaps.org/protocol.html
- Google sitemap build guide: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- schema.org BlogPosting: https://schema.org/BlogPosting
- schema.org author property: https://schema.org/author
- Google structured data for articles: https://developers.google.com/search/docs/appearance/structured-data/article
