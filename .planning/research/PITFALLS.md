# Domain Pitfalls

**Domain:** Lit.js static technical blog with code highlighting, math, diagrams, charts on GitHub Pages
**Researched:** 2026-04-08

---

## Critical Pitfalls

Mistakes that cause rewrites or wasted phases.

---

### Pitfall 1: Prism.js / Highlight.js CSS Not Injected Into Shadow DOM

**What goes wrong:** You add Prism.js or Highlight.js to your page via a `<link>` stylesheet in `<head>`. The theme CSS loads fine globally, but code blocks inside Lit components (which use Shadow DOM by default) render without any syntax coloring. The code is highlighted in the JS sense — tokens have the right class names — but no styles apply. Debugging is confusing because the DOM looks correct.

**Why it happens:** Shadow DOM creates a style boundary. Global stylesheets in `<head>` do not pierce Shadow DOM. Styles must be explicitly imported inside each component's `static styles` or injected into the shadow root.

**Consequences:** All code blocks silently lose their theme. Because the tokens are present in the DOM, the bug is invisible until you visually inspect. Discovered late, it requires revisiting every article component.

**Prevention:**
- Import the Prism/Highlight.js CSS as a `CSSResult` inside the Lit component's `static styles`:
  ```js
  import prismStyles from 'prism-themes/themes/prism-one-dark.css?inline';
  static styles = [unsafeCSS(prismStyles), css`...`];
  ```
- Or call `Prism.highlightAllUnder(this.shadowRoot)` in `firstUpdated()` to highlight against an already-scoped root.
- Verify in browser DevTools by inspecting the shadow root's computed styles on a `<code>` element.

**Warning signs:** Code blocks appear unstyled (no color) even though Prism is loaded. Shadow root elements have the correct token classes but no matching CSS rules in computed styles.

**Phase:** Address in Phase 1 (foundation / component scaffold). Establish the pattern before writing any article content.

---

### Pitfall 2: MathJax Fails Silently Inside Shadow DOM

**What goes wrong:** You include MathJax and call `MathJax.typeset()` on page load. Math in the main document renders. Math inside Lit components renders as raw LaTeX strings, with no error thrown.

**Why it happens:** MathJax v2 uses `document.getElementById()` to locate elements, which fails for elements inside shadow roots (they are in a separate DOM subtree). MathJax v3 has a DOM adaptor layer, but it still defaults to scanning `document.body`, not shadow roots.

**Consequences:** Math never renders for article components. The failure is silent — no console error, just raw `$...$` or `\[...\]` strings visible to readers.

**Prevention:**
- Use KaTeX instead of MathJax. KaTeX renders synchronously via `katex.renderToString()` — you control the output directly inside the component, with no DOM scanning. This sidesteps the Shadow DOM issue entirely.
- If MathJax is required: use MathJax v3 and call `MathJax.typesetShadow(this.shadowRoot)` in `firstUpdated()`, after subclassing the DOM adaptor to handle shadow roots.
- KaTeX fonts (`.woff2`) must be co-located with `katex.min.css`. Load the CSS inside the shadow root via `unsafeCSS()` or inject a `<link>` into the component.

**Warning signs:** After page load, LaTeX source strings are visible in article bodies. `document.querySelectorAll('.MathJax')` returns elements outside components but nothing inside them.

**Phase:** Decide KaTeX vs. MathJax in Phase 1 (stack decisions). Implement math component in the phase that introduces article content rendering.

---

### Pitfall 3: Mermaid.js Initialization Timing and Shadow DOM ID Conflicts

**What goes wrong:** Mermaid diagrams in article components either (a) never render because `mermaid.initialize()` ran before the custom element connected to the DOM, or (b) render once then vanish when Lit re-renders the component, or (c) produce SVGs with duplicate IDs that corrupt each other when multiple diagrams are on the same page.

**Why it happens:**
- Mermaid scans for `<pre class="mermaid">` elements at initialization time. If the Lit component has not yet rendered into the DOM, those elements do not exist.
- Mermaid marks processed blocks with `data-processed="true"`. After a Lit re-render, the original DOM nodes are replaced by new ones that lack this attribute — Mermaid will never reprocess them because it already considers the job done (or the new nodes have no marker, causing re-render cycles).
- Mermaid uses non-unique IDs in generated SVGs. Multiple diagrams on one page collide.

**Consequences:** Blank diagram areas, diagrams that flicker and disappear, or corrupted overlapping SVG output.

**Prevention:**
- Do not rely on auto-detection. Use `mermaid.render()` programmatically inside `firstUpdated()` or `updated()`:
  ```js
  async firstUpdated() {
    const { svg } = await mermaid.render(`mermaid-${this._id}`, this.code);
    this.shadowRoot.querySelector('.diagram').innerHTML = svg;
  }
  ```
- Assign a unique ID per diagram instance (e.g., timestamp or counter) to avoid SVG ID collisions.
- Use the `beautiful-mermaid` library as an alternative — it renders directly to a pure SVG with no DOM dependencies, making it safe for Shadow DOM.
- If using Shadow DOM, inject Mermaid's CSS into the shadow root (same CSS scoping issue as Prism).

**Warning signs:** Diagrams render on first load but disappear after navigation. Multiple diagrams on one page share the same SVG element IDs.

**Phase:** Address in the phase that introduces diagram support. Do not defer the initialization pattern — it must be established before any diagram content is authored.

---

### Pitfall 4: GitHub Pages SPA Routing Returns 404 on Direct URL Access

**What goes wrong:** The blog uses client-side routing (e.g., `/articles/intro-to-transformers`). Navigating via internal links works. But when a reader bookmarks a URL and opens it directly, or shares a link, GitHub Pages returns a 404 because there is no `intro-to-transformers/index.html` file on disk.

**Why it happens:** GitHub Pages is a static file server. It can only serve files that exist. Client-side routing intercepts navigation after the initial page load, but the initial request for a deep URL hits the file server directly.

**Consequences:** Direct-link sharing is broken. Shared article URLs 404. This is a complete failure of the core use case (readers arriving via search or referral).

**Prevention (choose one):**
- **Hash-based routing:** Use `/#/articles/slug` style URLs. The hash is never sent to the server, so GitHub Pages always serves `index.html`. Simple but less clean URLs.
- **404.html redirect trick:** Create a `404.html` that reads the URL from `sessionStorage` or query string and redirects to `index.html` with the route encoded, where the SPA recovers it. This is the `spa-github-pages` approach. More complex but preserves clean URLs.
- **Pre-generate HTML files:** At build time, generate a static `articles/[slug]/index.html` for every article. GitHub Pages then serves them directly. No routing workaround needed. Recommended for a blog with known, stable article slugs.

**Warning signs:** Direct URL access returns GitHub's 404 page. Works perfectly in local dev server (which handles all routes via a fallback).

**Phase:** Address in the deployment phase (Phase 1 or the first phase that includes GitHub Pages setup). This must be resolved before any content phase, because it affects the URL design of the entire site.

---

## Moderate Pitfalls

---

### Pitfall 5: GitHub Pages Base Path Breaking Asset URLs for Project Sites

**What goes wrong:** The repo is named `devliot`, so GitHub Pages serves the site at `https://eliott.github.io/devliot/`. All absolute asset paths (e.g., `/assets/styles.css`, `/components/article.js`) resolve to `https://eliott.github.io/assets/styles.css` — the root of GitHub Pages, not the repo subdirectory — returning 404 for every asset.

**Why it happens:** Absolute paths starting with `/` are resolved from the domain root, not the repo root. GitHub Pages does not rewrite these paths.

**Consequences:** Entire site is broken: no styles, no scripts, no fonts, no images. Trivial to overlook during local dev (where `/` maps to `localhost:8080`).

**Prevention:**
- Set `<base href="/devliot/">` in `index.html` at build time.
- Use Vite's `base` config option: `base: '/devliot/'` — this rewrites all asset imports in the bundle automatically.
- Use only relative paths in dynamic imports and asset references.
- If using a custom domain (CNAME), the site serves from root and this is not an issue.

**Warning signs:** Everything works locally, all assets 404 on GitHub Pages. Browser network tab shows assets being requested from `github.io/assets/` instead of `github.io/devliot/assets/`.

**Phase:** Address in the build/deployment scaffolding phase. Configure `base` in Vite before writing any component that imports assets.

---

### Pitfall 6: KaTeX Fonts Not Available Inside Shadow DOM (FOUT / Missing Glyphs)

**What goes wrong:** KaTeX math renders but displays in a fallback font, or shows boxes for special mathematical symbols. The CSS is loaded, but the `.woff2` font files are either not found (wrong path) or not usable within the shadow root.

**Why it happens:** KaTeX requires its own fonts and expects `katex.min.css` and the `fonts/` directory to be co-located. If the CSS is injected into a shadow root via `unsafeCSS()` but the font paths are relative to the original file location (not the served URL), fonts 404. Additionally, `@font-face` declared inside a shadow root has historically had inconsistent behavior across browsers.

**Prevention:**
- Declare `@font-face` for KaTeX fonts in the **global** stylesheet (main `index.html`), not inside the shadow root. CSS custom properties and font faces pierce shadow boundaries by design.
- Alternatively, place `katex.min.css` in `<head>` and only inject KaTeX's component-specific structural CSS into the shadow root.
- Ensure the `fonts/` directory is at the correct path relative to your served base URL, accounting for the GitHub Pages base path (Pitfall 5).

**Warning signs:** Math symbols render as squares or in a serif fallback font. Network tab shows font files returning 404.

**Phase:** Address alongside math rendering implementation. Validate font loading on the deployed GitHub Pages URL, not just locally.

---

### Pitfall 7: Search Index Grows Unbounded as Articles Accumulate

**What goes wrong:** Client-side search works well for 10 articles. At 50+ articles with substantial code content, the JSON search index becomes multi-megabyte. It is downloaded on every page load (or on search open), causing a multi-second delay on mobile connections.

**Why it happens:** The simplest client-side search approaches (Fuse.js, Lunr.js with full document indexing) store the full text of every article in a single JSON file fetched at runtime.

**Consequences:** Search opens slowly, first-visit performance degrades significantly, and the problem is invisible until content volume grows.

**Prevention:**
- Use Pagefind for search index generation at build time. Pagefind generates a chunked, compressed index and only downloads the relevant chunks when a query is made — not the entire index.
- If using Fuse.js or MiniSearch, index only article titles, tags, and first-paragraph summaries — not full body content.
- Lazy-load the search library and index only when the search input is focused.

**Warning signs:** `search-index.json` exceeds 500KB. Search initialization takes > 1s on a throttled network in DevTools.

**Phase:** Address during the search implementation phase. Build the lazy-loading and chunk-based approach from the start rather than migrating later.

---

### Pitfall 8: Lit Re-renders Overwrite Prism/Mermaid Post-Processing

**What goes wrong:** After Prism or Mermaid processes a DOM node (adding spans, replacing elements), Lit's reactive rendering replaces the element with a fresh render, removing all the post-processing. On subsequent property updates, the article body reverts to unformatted code or blank diagram areas.

**Why it happens:** Lit manages its own DOM subtree via `render()`. Any external tool that mutates that DOM directly will have its mutations overwritten on the next render cycle.

**Consequences:** Intermittent loss of syntax highlighting or diagrams after any reactive state change (theme toggle, navigation, property update). Extremely confusing to debug.

**Prevention:**
- Treat the article body as static content that never re-renders after `firstUpdated()`. Use `shouldUpdate()` or guard conditions to prevent re-renders once the article is set.
- For Prism: highlight in `firstUpdated()` only, and ensure the article content is set once (not via a reactive property that triggers re-renders).
- For Mermaid: render to a `innerHTML` target within `firstUpdated()`, and do not bind that target to Lit's reactive template.
- Use Lit's `{once: true}` event modifier pattern or a `_initialized` flag to skip re-initialization.

**Warning signs:** Syntax highlighting disappears after clicking a UI element. Works on hard reload but not after in-page interactions.

**Phase:** Address during the article rendering component phase. Establish the "render once" contract for rich content as an explicit architectural decision.

---

## Minor Pitfalls

---

### Pitfall 9: Custom Element Tag Name Collisions With Third-Party Libraries

**What goes wrong:** You define `<code-block>` or `<math-formula>` as custom elements. A library you later add also registers one of these names. The browser throws `DOMException: the name "code-block" has already been used with this registry` and the page partially breaks.

**Why it happens:** The global `CustomElementRegistry` enforces uniqueness. Once a tag name is registered, it cannot be re-registered.

**Prevention:** Use a project-specific prefix for all custom elements: `<devliot-code-block>`, `<devliot-article>`, etc. This is a one-time naming convention decision.

**Warning signs:** Console shows `CustomElementRegistry` errors. One of the third-party libraries you import silently stops working.

**Phase:** Establish the naming convention in Phase 1 (project scaffold). It is practically impossible to rename custom elements retroactively without breaking stored URLs or cached HTML.

---

### Pitfall 10: HTML-in-Lit Articles Make Code Snippet Authoring Painful

**What goes wrong:** Articles are authored as HTML inside Lit template literals. Code snippets containing angle brackets (`<`, `>`), backticks, or `${` must be manually escaped (`&lt;`, `&gt;`, `` &#96; ``, `${'$'}{`). Missing a single escape causes the Lit template parser to interpret the content as a binding expression or broken HTML, throwing a runtime error or silently corrupting the snippet.

**Why it happens:** Lit's `html` tagged template uses the browser's HTML parser. The HTML parser treats `<code>` content as markup unless the code is inside a `<textarea>` or properly encoded. Template literal syntax (`${`) is active JavaScript inside the template string.

**Consequences:** Authoring articles becomes error-prone and slow. Java generics (`List<String>`), TypeScript (`interface Foo {}`), and shell commands are all problematic. Errors appear as missing content or runtime exceptions, not editor warnings.

**Prevention:**
- Establish a reusable `<devliot-code-block>` component that accepts code as a JavaScript string property (not slotted HTML content). Pass code via `codeBlock.code = rawString` from the component's `render()` method, where the string is defined outside the template literal.
- Use a utility function to produce escaped HTML entities for inline code.
- For multi-line blocks, define the code content as a separate tagged template string or imported module string.

**Warning signs:** Article with Java generics or TypeScript code causes a blank render or console parse error. Backtick-containing code breaks template literal parsing.

**Phase:** Design the code-block component API in Phase 1. This affects every article that will ever be written.

---

### Pitfall 11: SEO — Article Content Hidden Until JS Executes

**What goes wrong:** Googlebot and other crawlers fetch the page, receive `<devliot-article>` as an empty shell (the component's shadow DOM has not been hydrated), and index no article content. Articles are invisible to search engines.

**Why it happens:** Web components require JavaScript to upgrade and render. If the crawler does not execute JS (or executes it with a delay), the shadow DOM content is absent from the crawled DOM.

**Consequences:** Blog articles are not indexed. Readers cannot find content via search engines. For a technical blog where search discovery is a primary acquisition channel, this is a significant long-term problem.

**Prevention:**
- Use Declarative Shadow DOM (DSD): Lit's SSR package can pre-render components to static HTML with `<template shadowrootmode="open">` at build time. This makes content available without JS execution.
- For a simpler approach without SSR: place article body content in the light DOM (accessible to crawlers) and use the Lit component only for interactive features (copy button, theme toggle). Use `createRenderRoot() { return this; }` to opt out of Shadow DOM for article components.
- Minimally: ensure `<title>`, `<meta description>`, and `<h1>` are in static HTML, not inside Shadow DOM.

**Warning signs:** Google Search Console shows pages as crawled but not indexed, or indexed with no content snippets. `curl` of the page URL shows empty component shells.

**Phase:** Address during the article component design phase. The light-DOM vs. Shadow-DOM architectural decision for article content containers must be made early — it is expensive to reverse.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Project scaffold / component naming | Tag name collisions (Pitfall 9) | Establish `devliot-` prefix on day one |
| GitHub Pages deployment setup | Base path 404s (Pitfall 5), SPA routing 404s (Pitfall 4) | Configure Vite `base`, choose routing strategy before writing content |
| Article component architecture | Shadow DOM vs. light DOM for SEO (Pitfall 11), HTML escaping for code snippets (Pitfall 10) | Decide DOM strategy and code block API before authoring articles |
| Code highlighting | Prism CSS not in shadow root (Pitfall 1), re-render overwrites (Pitfall 8) | Inject styles inside component, use firstUpdated() |
| Math rendering | MathJax Shadow DOM failure (Pitfall 2), KaTeX font paths (Pitfall 6) | Choose KaTeX early, validate fonts on deployed URL |
| Diagram support | Mermaid timing and ID conflicts (Pitfall 3), re-render overwrites (Pitfall 8) | Use mermaid.render() in firstUpdated(), unique IDs per diagram |
| Search implementation | Index size at scale (Pitfall 7) | Use Pagefind or lazy-loaded chunked index from the start |

---

## Sources

- [Lit: Working with Shadow DOM](https://lit.dev/docs/components/shadow-dom/) — official docs
- [Lit: Pre-rendering / Static / SSR / Performance Discussion](https://github.com/lit/lit/discussions/4551) — GitHub discussion
- [MathJax: CommonHTML renderer doesn't work in Custom Elements](https://github.com/mathjax/MathJax/issues/2162) — tracked issue, documented workaround
- [MathJax: rendering TeX input with custom elements](https://github.com/mathjax/MathJax/issues/2195) — additional context
- [Why Mermaid Charts Disappear in React and How to Fix It](https://rendazhang.medium.com/why-mermaid-charts-disappear-in-react-and-how-to-fix-it-351545ef1ebc) — re-render timing pattern
- [Wrapping Mermaid Diagrams in a Web Component](https://blog.lmorchard.com/2026/01/28/mermaid-web-component/) — practical 2026 solution
- [GitHub Pages does not support routing for SPAs](https://github.com/orgs/community/discussions/64096) — official GitHub community thread
- [GitHub Pages SPA 404s? Fix Base Path Issues](https://devactivity.com/posts/apps-tools/unlocking-spa-deployment-solving-github-pages-404s-for-enhanced-engineering-productivity/) — solutions overview
- [CSS Shadow DOM Pitfalls: Styling Web Components Correctly](https://blog.pixelfreestudio.com/css-shadow-dom-pitfalls-styling-web-components-correctly/) — styling pitfalls
- [Web Components & Lit in mixed stacks — Security Pitfalls](https://www.sachith.co.uk/web-components-lit-in-mixed-stacks-security-pitfalls-fixes-practical-guide-feb-15-2026/) — 2026 security guide
- [Scaling Fully Static Search with Pagefind](https://cfe.dev/sessions/static-search-with-pagefind/) — search index scaling
- [Scoped Custom Element Registries proposal](https://wicg.github.io/webcomponents/proposals/Scoped-Custom-Element-Registries.html) — tag name conflict context
- [Why Fonts Don't Work in Web Components](https://dev.to/akdevcraft/use-font-in-web-component-51a4) — font loading in Shadow DOM
- [KaTeX Browser docs](https://katex.org/docs/browser.html) — official KaTeX setup
