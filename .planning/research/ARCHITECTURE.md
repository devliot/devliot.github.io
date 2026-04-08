# Architecture Patterns

**Domain:** Lit.js static technical blog (code, math, diagrams, charts)
**Researched:** 2026-04-08

---

## Recommended Architecture

A client-side SPA built from Lit web components, served as a single `index.html` from GitHub Pages. There is no server, no backend, no build-time content pipeline — articles are Lit components written in TypeScript. The build tool (Vite) bundles everything into a `dist/` folder that GitHub Pages serves directly.

```
Browser
  └── index.html  (entry point, served by GitHub Pages)
       └── <blog-app>  (SPA shell, owns routing)
            ├── <blog-nav>  (navigation + search input)
            ├── <article-list>  (home / category / tag views)
            │    └── <article-card> (repeated per post)
            └── <article-view>  (single article view)
                 ├── <code-block>  (wraps Prism.js)
                 ├── <math-formula>  (wraps KaTeX)
                 ├── <diagram-block>  (wraps Mermaid)
                 └── <chart-block>  (wraps Chart.js)
```

---

## Component Boundaries

### Shell Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `<blog-app>` | SPA entry, owns router, top-level layout | Router, all views |
| `<blog-nav>` | Site navigation, category links, search trigger | `<blog-app>` (events), router |

### View Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `<article-list>` | Renders filtered list of article cards | Article registry, `<article-card>` |
| `<article-view>` | Renders a single article by ID | Article registry, content components |
| `<article-card>` | Summary tile (title, date, tags, excerpt) | None — display only |

### Content Components (Leaf Nodes)

| Component | Responsibility | Communicates With | Third-Party Lib |
|-----------|---------------|-------------------|-----------------|
| `<code-block>` | Syntax-highlighted code | None | Prism.js |
| `<math-formula>` | Inline and block math | None | KaTeX |
| `<diagram-block>` | Flowcharts, sequence diagrams | None | Mermaid.js |
| `<chart-block>` | Bar charts, line charts, histograms | None | Chart.js |

### Data Layer (not a component — a module)

| Module | Responsibility | Consumed By |
|--------|---------------|-------------|
| `article-registry.ts` | Imports all article components, exposes metadata array | `<article-list>`, `<article-view>`, search, router |
| `article-meta.ts` | TypeScript type for article metadata (id, title, date, tags, category) | Registry, cards, router |

---

## Data Flow

### Routing Flow

```
URL / user navigation
  → @lit-labs/router (inside <blog-app>)
  → renders <article-list> or <article-view>
  → article components receive props (article ID, filter params)
  → article component imports the matching article module
  → renders rich content components inline
```

### Article Metadata Flow

```
article-registry.ts  (static import array at build time)
  → <article-list> reads metadata to render cards
  → <blog-nav> reads metadata for category counts and search corpus
  → router reads metadata to validate article IDs
```

Content and metadata are co-located: each article file exports both a rendered `html` template (the body) and a metadata object (title, date, tags, category, excerpt). The registry imports all articles and assembles the metadata array. This happens at build time — no runtime JSON fetch required.

### Third-Party Library Integration Flow

All four content libraries (Prism, KaTeX, Mermaid, Chart.js) require a real DOM node before they can render. The integration pattern is consistent across all of them:

```
Parent article renders <code-block code="..." language="ts">
  → <code-block> Lit template renders a <pre><code> placeholder
  → firstUpdated() lifecycle fires after DOM is created
  → <code-block> calls Prism.highlightElement(this.shadowRoot.querySelector('code'))
  → Prism mutates the DOM node with highlighted markup
  → styles are injected via adoptedStyleSheets (not global CSS — Shadow DOM scoped)
```

The same pattern applies to KaTeX (`katex.render(formula, this.shadowRoot.querySelector('.target'))`), Mermaid (`mermaid.render(id, definition)` then insert returned SVG), and Chart.js (get canvas ref, call `new Chart(canvas, config)`).

**Shadow DOM scoping rule:** Never call `document.querySelector` inside Lit components. Always use `this.shadowRoot.querySelector`. Third-party libraries that auto-scan the document (Prism's `highlightAll`, Mermaid's auto-init) must be initialized with `manual: true` / `startOnLoad: false` to prevent them from running before components mount.

### Search Flow

```
User types in <blog-nav>
  → search input dispatched as custom event to <blog-app>
  → <blog-app> passes query to search module (Fuse.js)
  → Fuse.js searches pre-built index (from article-registry metadata)
  → results list passed to <article-list> via reactive property
  → <article-list> re-renders filtered card set
```

The search index is built in memory at app startup from the metadata array already imported by the registry. No separate JSON file, no network request.

---

## Routing on GitHub Pages

GitHub Pages does not support server-side URL rewriting. A request to `/articles/my-post` returns a 404 unless a file exists at that path.

**Recommended approach: hash routing.**

Use `@lit-labs/router` with hash-based URLs (`/#/articles/my-post`). The page loaded is always `index.html` — GitHub Pages serves it correctly because the hash is client-only. The router reads `window.location.hash` and renders the matching view.

Note: there is an open issue that `@lit-labs/router` has a bug with hash pattern matching (GitHub issue #3517). **Fallback plan:** implement a thin custom router using `hashchange` event and a switch over `window.location.hash`. For a blog with ~5 routes (home, article, category, tag, search), a custom router is 30 lines and has zero dependencies.

**404.html redirect trick** (alternative): add a `404.html` that copies the path into `sessionStorage` then redirects to `/index.html`, which reads it and navigates. This enables clean URLs but adds fragility. Not recommended for a first iteration.

---

## Patterns to Follow

### Pattern 1: Leaf Components Are Pure Renderers

Content components (`<code-block>`, `<math-formula>`, etc.) receive their data as properties, render a DOM placeholder, then invoke the third-party library in `firstUpdated()`. They own nothing outside their shadow root, dispatch no events, have no side effects beyond their own DOM.

```typescript
@customElement('code-block')
export class CodeBlock extends LitElement {
  @property() code = '';
  @property() language = 'typescript';

  static styles = [prismTheme]; // imported CSS-in-JS, scoped to shadow root

  render() {
    return html`<pre><code class="language-${this.language}">${this.code}</code></pre>`;
  }

  override firstUpdated() {
    const el = this.shadowRoot!.querySelector('code')!;
    Prism.highlightElement(el);
  }
}
```

### Pattern 2: Articles Are Static Lit Modules

Articles are TypeScript files that export a metadata object and an `html` tagged template literal. They are not components — they are data. The article view component imports them and renders them as slots or inlined `html`.

```typescript
// src/articles/2024-intro-to-transformers.ts
import { html } from 'lit';

export const meta = {
  id: '2024-intro-to-transformers',
  title: 'Intro to Transformers',
  date: '2024-11-15',
  category: 'AI',
  tags: ['AI', 'NLP', 'Deep Learning'],
  excerpt: 'A practical guide to the transformer architecture.',
};

export const content = html`
  <h2>What is Attention?</h2>
  <p>The self-attention mechanism...</p>
  <code-block language="python" .code=${'model = TransformerModel()'}></code-block>
  <math-formula .formula=${'E = mc^2'}></math-formula>
`;
```

### Pattern 3: Article Registry as Single Source of Truth

One file imports all articles and builds the metadata index. The router, listing views, and search all read from this one registry. Adding a new article means: create the `.ts` file, add one import and one metadata push in the registry.

```typescript
// src/articles/registry.ts
import { meta as intro, content as introContent } from './2024-intro-to-transformers';
// ...

export const articles = [intro, ...];
export const articleContents = new Map([
  [intro.id, introContent],
  // ...
]);
```

### Pattern 4: CSS Variables for Theming Across Shadow Roots

Shadow DOM prevents global styles from reaching component internals. Use CSS custom properties (CSS variables) defined on `:root` in a global stylesheet. They pierce shadow boundaries and allow consistent theming (colors, fonts, spacing) without disabling Shadow DOM.

```css
/* global.css */
:root {
  --color-text: #1a1a1a;
  --font-mono: 'JetBrains Mono', monospace;
  --spacing-base: 1rem;
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling Third-Party Library Auto-Init Before Components Mount

**What:** Importing Mermaid or Prism at the top level and letting them scan `document` on `DOMContentLoaded`.
**Why bad:** Components mount asynchronously. The library runs before Shadow DOM content exists and finds nothing. It also cannot access content inside shadow roots via `document.querySelector`.
**Instead:** Set `Prism.manual = true` before any import. Set `mermaid.initialize({ startOnLoad: false })`. Call APIs manually inside `firstUpdated()` targeting `this.shadowRoot`.

### Anti-Pattern 2: Mutating Lit-Managed DOM Directly

**What:** Third-party library modifies a node that Lit's template controls (e.g., the `<code>` element's `innerHTML`).
**Why bad:** On next re-render, Lit overwrites the mutation. Highlighting disappears on any property change.
**Instead:** Either (a) render a placeholder, call the library in `firstUpdated` only once, and never re-render that node; or (b) for dynamic content, use `updated()` with a guard to re-apply highlighting only when the `code` property changes.

### Anti-Pattern 3: Putting Article Content in a Separate Fetch Call

**What:** Articles stored as JSON or Markdown files, fetched at runtime with `fetch('/articles/foo.json')`.
**Why bad:** Network latency on every article open. Requires additional bundler config. Adds async error handling everywhere. Offers no benefit for a small blog.
**Instead:** Static imports at build time. Vite tree-shakes unused articles. Bundle size is acceptable for a blog that loads one article at a time via lazy import.

### Anti-Pattern 4: Disabling Shadow DOM for Articles

**What:** Override `createRenderRoot()` to return `this` so article content renders in the light DOM.
**Why bad:** Loses style encapsulation. Global styles (Prism theme, KaTeX fonts) bleed across the whole page. Third-party reset CSS can corrupt article typography.
**Instead:** Keep Shadow DOM. Use CSS custom properties for cross-component theming. Apply third-party CSS via `adoptedStyleSheets` or `static styles` scoped to the component.

### Anti-Pattern 5: One Giant Article Component

**What:** A single `<blog-article>` component that hard-switches on article ID inside one `render()`.
**Why bad:** All article content is bundled together. Load times grow with every post.
**Instead:** Dynamic imports per article. The article view does `const { content } = await import('./articles/${id}.js')`. Vite splits each article into its own chunk automatically.

---

## Build Order (Phase Dependencies)

The component graph has clear dependency layers. Build bottom-up:

```
Layer 0 — Types and data contracts
  article-meta.ts (ArticleMeta type)
  No dependencies.

Layer 1 — Leaf content components
  <code-block>, <math-formula>, <diagram-block>, <chart-block>
  Depend on: third-party libs, article-meta types
  Can be built and tested in isolation with hardcoded props.

Layer 2 — Article modules
  src/articles/*.ts
  Depend on: Layer 1 components (used inline via html``)
  Each article is independently buildable.

Layer 3 — Article registry
  src/articles/registry.ts
  Depends on: Layer 2 articles (imports all of them)
  This is where all articles are wired together.

Layer 4 — View components
  <article-card>, <article-list>, <article-view>
  Depend on: Layer 3 registry, Layer 1 content components

Layer 5 — Navigation and search
  <blog-nav>
  Depends on: Layer 3 registry (for category counts), Fuse.js

Layer 6 — Shell and router
  <blog-app> with routing
  Depends on: Layer 4 views, Layer 5 nav, router library

Layer 7 — Entry point and build config
  index.html, vite.config.ts, GitHub Actions workflow
  Depends on: everything
```

Implication for roadmap phases: Layers 0-1 (foundation + content components) should be a dedicated phase before any article work begins. Articles cannot be written until their content components are stable. The router and shell can be scaffolded early but should be fully completed only after views exist.

---

## Scalability Considerations

This is a personal blog. These constraints are relevant at current scale, not at 10K users.

| Concern | Now (1-50 articles) | Later (100+ articles) |
|---------|--------------------|-----------------------|
| Bundle size | Static imports fine | Switch to dynamic `import()` per article (code splitting) |
| Search | In-memory Fuse.js on metadata | Still fine; Fuse.js handles 10K items easily |
| Build time | Instant with Vite | Still fast; no Markdown pipeline, pure TS |
| GitHub Pages limits | None relevant | None relevant (static files) |

---

## Sources

- Lit Shadow DOM docs: https://lit.dev/docs/components/shadow-dom/ — HIGH confidence
- Lit lifecycle docs: https://lit.dev/docs/components/lifecycle/ — HIGH confidence
- KaTeX in Lit issue + web component wrapper pattern: https://github.com/Polymer/lit-html/issues/761 — HIGH confidence
- @lit-labs/router hash routing bug: https://github.com/lit/lit/issues/3517 — MEDIUM confidence (open issue, may be resolved)
- GitHub Pages SPA routing challenge: https://github.com/orgs/community/discussions/64096 — HIGH confidence
- Mermaid initialization API: https://mermaid.js.org/config/usage.html — HIGH confidence (official docs)
- Prism manual mode + `highlightAllUnder` for Shadow DOM: community documented, Prism GitHub — MEDIUM confidence
- Modern Lit stack (Vite + TypeScript): https://dev.to/matsuuu/the-modern-2025-web-components-tech-stack-1l00 — MEDIUM confidence
- D3 + Lit day-journal (Shadow DOM selection pattern): https://medium.com/@sbsends/lit-day-3-d3-js-graphs-f5c3dd1627d7 — MEDIUM confidence
- Fuse.js for static search: https://yihui.org/en/2023/09/fuse-search/ — MEDIUM confidence
