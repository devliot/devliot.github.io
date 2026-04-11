# Phase 3: Article Components — Research

**Researched:** 2026-04-11
**Domain:** Lit web components, syntax highlighting, math rendering, diagram/chart lazy loading, article HTML fetching
**Confidence:** HIGH (all stack versions registry-verified; critical pitfalls sourced from official issue trackers)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Generic renderer architecture — `devliot-article-page` fetches and renders external HTML files (not one Lit component per article). Articles live as plain `.html` files.
- **D-02:** Custom elements in article HTML — articles use `<devliot-code>`, `<devliot-math>`, `<devliot-diagram>`, `<devliot-chart>` etc. The renderer loads the HTML and Lit auto-upgrades the custom elements.
- **D-03:** Article files in `src/articles/` — each article has a `.html` content file and a companion `.json` metadata file (title, date, category, tags). An `index.json` registry lists all articles for routing.
- **D-04:** Include a demo article that exercises all content types (code, math, image, diagram, chart) — serves as an end-to-end proof and authoring reference.
- **D-05:** Shiki with GitHub Light theme — clean, neutral syntax highlighting.
- **D-06:** Copy button: top-right corner, clipboard icon only, appears on hover. Shows "Copied!" feedback briefly after click.
- **D-07:** Language badge AND line numbers displayed on all code blocks.
- **D-08:** (Carried from Phase 2) Horizontal scroll, no line wrapping. Fira Code monospace font. Light/gray background.
- **D-09:** KaTeX via `<devliot-math>` custom element — LaTeX content inside the element. `display` attribute for block math, inline by default.
- **D-10:** Mermaid diagrams and Chart.js charts are lazy-loaded — imported only when their custom element enters the viewport (IntersectionObserver).
- **D-11:** Chart.js config passed as a JSON attribute on the `<devliot-chart>` element (`config='{ ... }'`). `type` attribute specifies chart type.
- **D-12:** Heading anchor links: hover-reveal `#` symbol to the left of headings. Clicking copies the anchor URL.
- **D-13:** Image captions: numbered figures with caption text — "Figure 1: Description" using `<figure>` / `<figcaption>`.
- **D-14:** Generous spacing between content blocks — 32-48px between major blocks, 16-24px between paragraphs.

### Claude's Discretion

- Exact Shiki language set to bundle (balance coverage vs bundle size)
- Mermaid diagram container sizing and responsive behavior
- Chart.js color palette for grayscale compatibility
- KaTeX CSS loading strategy (global vs per-component)
- Article HTML fetching mechanism (static import vs fetch)
- Error states for failed renders (Mermaid syntax error, invalid LaTeX, etc.)
- Figure auto-numbering implementation approach

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ART-01 | Articles écrits en HTML dans des composants Lit | D-01/D-02: generic renderer + HTML files; `unsafeHTML` directive for injecting fetched HTML |
| ART-02 | Coloration syntaxique du code avec bouton copier (Shiki) | `devliot-code` Lit element wrapping `codeToHtml`; copy button via Clipboard API |
| ART-03 | Rendu de formules mathématiques (KaTeX) | `devliot-math` Lit element; `katex.renderToString()` + `unsafeHTML`; CSS via `katex/dist/katex.min.css` |
| ART-04 | Support images avec légendes (figure/figcaption) | Native HTML `<figure>`/`<figcaption>` + CSS counter auto-numbering; no custom element needed |
| ART-05 | Liens d'ancrage sur les titres (deep links) | Post-process heading elements in rendered HTML; Clipboard API on click |
| ART-06 | Diagrammes Mermaid (flowcharts, architecture, séquences) | `devliot-diagram` with IntersectionObserver lazy-load; **critical: render outside Shadow DOM** |
| ART-07 | Graphiques de données Chart.js (courbes, histogrammes) | `devliot-chart` with IntersectionObserver lazy-load; `<canvas>` inside Shadow DOM works fine |
</phase_requirements>

---

## Summary

Phase 3 builds the full article rendering pipeline on top of the existing Lit/Vite/Hash-router foundation. The core pattern is: `devliot-article-page` fetches a `.html` file from `src/articles/`, injects it via `unsafeHTML`, and the browser auto-upgrades the `<devliot-*>` custom elements contained within. Because article HTML is developer-controlled (no user input), `unsafeHTML` is safe without DOMPurify.

All five library versions are confirmed against npm dist-tags: Shiki 4.0.2, KaTeX 0.16.45, Mermaid 11.14.0, Chart.js 4.5.1, @observablehq/plot 0.6.17. None are installed yet — `npm install` is a Wave 0 prerequisite.

One critical architectural pitfall exists: **Mermaid 11 is incompatible with Shadow DOM** (confirmed open issue #6306). The `devliot-diagram` component must render the Mermaid SVG outside its shadow root — either by overriding `createRenderRoot()` to use light DOM, or by inserting the SVG into the host element's light DOM via `this.insertAdjacentHTML()` after calling `mermaid.render()`. This is the only component where Shadow DOM cannot be used.

**Primary recommendation:** Build `devliot-article-page` as a fetch-based HTML renderer, implement `devliot-code` synchronously (Shiki `codeToHtml`), `devliot-math` synchronously (KaTeX `renderToString`), and lazy-load `devliot-diagram` and `devliot-chart` via IntersectionObserver with dynamic import. Use CSS counters for figure auto-numbering. Implement heading anchors via post-render DOM walk in `devliot-article-page.firstUpdated()`.

---

## Standard Stack

### Core (not yet installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `shiki` | 4.0.2 | Syntax highlighting | Per CLAUDE.md; current npm dist-tag [VERIFIED: npm registry] |
| `katex` | 0.16.45 | LaTeX math rendering | Per CLAUDE.md; current npm dist-tag [VERIFIED: npm registry] |
| `mermaid` | 11.14.0 | Diagrams | Per CLAUDE.md; current npm dist-tag [VERIFIED: npm registry] |
| `chart.js` | 4.5.1 | Data charts | Per CLAUDE.md; current npm dist-tag [VERIFIED: npm registry] |
| `@observablehq/plot` | 0.6.17 | Statistical charts | Per CLAUDE.md; current npm dist-tag [VERIFIED: npm registry] |

### Already Installed

| Library | Version | Notes |
|---------|---------|-------|
| `lit` | ^3.3.2 | Already in dependencies [VERIFIED: package.json] |
| `@playwright/test` | ^1.59.1 | E2E test runner [VERIFIED: package.json] |

### Supporting (discretionary)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@shikijs/transformers` | Latest | Shiki notation transformers | Only if diff/highlight annotations needed in articles — not required for base phase |

**Note on `@observablehq/plot`:** CLAUDE.md lists it as part of the stack. At this phase, Chart.js alone covers the ART-07 requirement. Observable Plot can be added to `devliot-chart` as an alternative renderer in a later iteration. It does not need to be integrated in Phase 3 unless explicitly needed for a demo article.

**Installation:**

```bash
npm install shiki katex mermaid chart.js @observablehq/plot
```

**Version verification:** All five packages verified against npm registry dist-tags on 2026-04-11. [VERIFIED: npm registry]

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── articles/
│   ├── index.json              # Article registry (id, slug, title, date, category, tags)
│   ├── demo-article.html       # Demo exercising all content types (D-04)
│   └── demo-article.json       # Demo metadata
├── components/
│   ├── devliot-header.ts       # Existing
│   ├── devliot-footer.ts       # Existing
│   ├── devliot-code.ts         # NEW: syntax highlighted code block
│   ├── devliot-math.ts         # NEW: KaTeX math rendering
│   ├── devliot-diagram.ts      # NEW: lazy-loaded Mermaid (light DOM render)
│   └── devliot-chart.ts        # NEW: lazy-loaded Chart.js
├── pages/
│   ├── devliot-home-page.ts    # Existing
│   └── devliot-article-page.ts # EVOLVED: fetch + render + heading anchors
└── styles/
    ├── reset.css               # Existing (design tokens)
    ├── article.css             # EXPANDED: rich content styles, figure numbering
    └── code.css                # NEW: code block styles (line numbers, language badge)
```

### Pattern 1: Article Page — Fetch + unsafeHTML

`devliot-article-page` receives a `slug` property from the router, fetches `src/articles/${slug}.html`, and renders it via `unsafeHTML`. Custom elements in the HTML are auto-upgraded by the browser because their definitions are already registered (imported in `main.ts`).

```typescript
// Source: Lit docs — lit.dev/docs/templates/directives/
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

@customElement('devliot-article-page')
export class DevliotArticlePage extends LitElement {
  @property({ type: String }) slug = '';
  @state() private _html = '';

  async updated(changed: Map<string, unknown>) {
    if (changed.has('slug') && this.slug) {
      const res = await fetch(`/devliot/articles/${this.slug}.html`);
      this._html = res.ok ? await res.text() : '<p>Article not found.</p>';
    }
  }

  firstUpdated() {
    // Post-render: inject heading anchor links
    this._injectHeadingAnchors();
  }

  render() {
    return html`<article>${unsafeHTML(this._html)}</article>`;
  }
}
```

**Key insight:** `fetch()` path must match Vite's `base: '/devliot/'`. Articles are served as static files from the `public/` folder or via Vite's static asset handling in dev, and bundled into `dist/` at build time.

**Article HTML file location:** `src/articles/` with Vite config to copy to dist. Vite does NOT automatically copy `src/` subdirectories — articles must be placed in `public/articles/` or Vite's `assetsInclude` / `publicDir` must be configured. The simplest approach: put articles in `public/articles/` (Vite copies everything in `public/` verbatim). [ASSUMED — need to verify at implementation time whether `src/articles/` or `public/articles/` is cleaner for the Vite build.]

### Pattern 2: devliot-code — Synchronous Shiki Highlighting

Shiki 4's `codeToHtml()` is async. The component must manage loading state and render placeholder until highlighting completes.

```typescript
// Source: shiki.style/guide/install
import { codeToHtml } from 'shiki';

// In connectedCallback or updated():
const highlighted = await codeToHtml(this.code, {
  lang: this.lang || 'text',
  theme: 'github-light',
});
// Inject into shadow DOM via unsafeHTML
```

**Language badge:** Shiki's `codeToHtml()` wraps output in `<pre class="shiki ..."><code>`. A custom transformer or post-processing can prepend a language badge `<span>` inside the `<pre>`. Alternatively, render the badge as a separate element in the component's template, absolutely positioned.

**Line numbers:** Shiki has no built-in line number transformer [VERIFIED: @shikijs/transformers docs]. The standard approach is CSS counters on `.line` elements that Shiki emits. Pattern:

```css
/* Source: prass.tech/blog/astro-syntax-highlighting/ */
pre.shiki {
  counter-reset: step;
}
pre.shiki .line::before {
  content: counter(step);
  counter-increment: step;
  display: inline-block;
  width: 2ch;
  margin-right: var(--space-md);
  color: var(--color-text-muted);
  text-align: right;
  user-select: none;
}
```

**Copy button:** Clipboard API (`navigator.clipboard.writeText()`). Add a `<button>` in the component template, positioned absolute top-right, visible on `:hover`. Show "Copied!" text for ~2 seconds via a `@state()` boolean.

### Pattern 3: devliot-math — KaTeX Rendering

```typescript
// Source: katex.org/docs/api
import katex from 'katex';
import 'katex/dist/katex.min.css'; // In global index.html or component — see pitfalls

const mathHtml = katex.renderToString(this.textContent ?? '', {
  throwOnError: false,
  displayMode: this.hasAttribute('display'),
});
// Render via unsafeHTML(mathHtml)
```

**KaTeX CSS loading strategy (Claude's Discretion):** The safest approach for this project is to add the KaTeX stylesheet in `index.html` as a `<link>` tag (global). This avoids the CSS-in-shadow-DOM problem entirely. KaTeX uses classes that must be styled globally. Alternative: import via `import 'katex/dist/katex.min.css'` in `main.ts` — Vite bundles it into the global stylesheet. [ASSUMED — recommend the `main.ts` import approach as it keeps styling co-located with usage.]

### Pattern 4: devliot-diagram — Mermaid with Light DOM (Critical Workaround)

**Mermaid is incompatible with Shadow DOM** due to `getBoundingClientRect()` calls on elements appended to `document.body` that are inaccessible from within a shadow root [VERIFIED: github.com/mermaid-js/mermaid/issues/6306, status: Approved, unresolved].

**Solution:** Override `createRenderRoot()` in `devliot-diagram` to disable Shadow DOM:

```typescript
// Pattern: light DOM rendering to bypass Mermaid Shadow DOM bug
override createRenderRoot() {
  return this; // renders to light DOM; no style encapsulation
}
```

Then render styles via a `<style>` tag in the template (or rely on article.css global styles).

**Mermaid API (v11):**

```typescript
// Source: mermaid.js.org/config/usage.html
import mermaid from 'mermaid';
mermaid.initialize({ startOnLoad: false });

const { svg } = await mermaid.render(`mermaid-${uniqueId}`, this.definition);
this.innerHTML = svg; // Direct DOM mutation since no shadow root
```

**Lazy loading pattern:**

```typescript
// In connectedCallback(), set up IntersectionObserver
// In firstUpdated(), register the observer on this element
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    observer.disconnect();
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({ startOnLoad: false });
    const { svg } = await mermaid.render(`d-${this._id}`, this._definition);
    this.innerHTML = svg;
  }
}, { rootMargin: '200px' });
observer.observe(this);
```

### Pattern 5: devliot-chart — Chart.js with Canvas

Chart.js works fine in Shadow DOM. Provide a `<canvas>` element in the template, get its 2D context, instantiate `Chart`.

```typescript
// Source: chartjs.org/docs/latest/getting-started/usage.html
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// In firstUpdated() after lazy load:
const canvas = this.shadowRoot!.querySelector('canvas')!;
const config = JSON.parse(this.configAttr);
new Chart(canvas.getContext('2d')!, config);
```

**Grayscale palette (Claude's Discretion):** Default Chart.js colors are blue-focused. For grayscale, override `borderColor` and `backgroundColor` in each dataset within the JSON config. Provide authoring guidance in demo article: use `#333333`, `#666666`, `#999999`, `#cccccc` as the dataset colors.

**Tree-shaking:** For this phase, `Chart.register(...registerables)` is acceptable (registers all chart types). Optimization can be deferred. [ASSUMED — registerables is simpler and bundle impact is minor for a blog.]

### Pattern 6: Heading Anchor Links (Post-render DOM Walk)

Since the article content is injected as HTML (not Lit template), heading anchors cannot use Lit's event binding directly. Instead, `devliot-article-page.updated()` walks the shadow DOM to find all `h2`–`h6` elements, assigns IDs, and attaches click handlers.

```typescript
// In updated(), after _html state changes:
private _injectHeadingAnchors() {
  const article = this.shadowRoot!.querySelector('article');
  if (!article) return;
  article.querySelectorAll('h2, h3, h4, h5, h6').forEach((heading) => {
    const id = heading.textContent!
      .toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    heading.id = id;
    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#/article/${this.slug}#${id}`; // hash-router URL format
    anchor.textContent = '#';
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.origin + anchor.href);
      // Update URL hash for actual navigation
      window.location.hash = `/article/${this.slug}`;
      // Scroll to heading
      heading.scrollIntoView({ behavior: 'smooth' });
    });
    heading.prepend(anchor);
  });
}
```

**Note on hash URL format:** The existing router uses `#/article/:slug`. Anchors within an article are a separate concern — the URL hash is already consumed by the router. Deep-linking to a heading requires `window.location.hash` to include the heading fragment. This conflicts with the router's hash usage. **Recommended approach (Claude's Discretion):** The anchor click copies the full URL to clipboard (the page URL, with a `?section=id` query param or just the heading ID appended as `#heading-id`). At page load, `devliot-article-page` reads `window.location.href` for a `#heading-id` fragment after the slug and scrolls to it. [ASSUMED — needs implementation decision at plan time; document as Open Question.]

### Pattern 7: Figure Auto-Numbering

Use CSS counters on `<figure>` / `<figcaption>` elements in `article.css`. No JavaScript needed.

```css
/* In article.css — applied within the article shadow DOM */
article {
  counter-reset: figures;
}

figure {
  counter-increment: figures;
  margin: var(--space-xl) 0;
}

figcaption::before {
  content: 'Figure ' counter(figures) ': ';
  font-weight: var(--font-weight-semibold);
}
```

Authors write: `<figcaption>Description of the figure</figcaption>`. The CSS renders: "Figure 1: Description of the figure". [VERIFIED: onlyrss.org/posts/auto-numbering-of-figures-with-CSS-counters.html — pure CSS approach confirmed]

### Anti-Patterns to Avoid

- **One Lit component per article:** Creates tight coupling between content and code. D-01 explicitly rejected this. Never create `devliot-article-hello-world.ts`.
- **Eager loading of Mermaid and Chart.js:** Both libraries are heavy (Mermaid ~2MB, Chart.js ~200KB). Loading them on every page load defeats the performance goal. Always use IntersectionObserver + dynamic import.
- **Using `mermaid.render()` inside Shadow DOM:** Will throw `TypeError: Cannot read properties of null (reading 'getBoundingClientRect')`. See Pitfall 1.
- **Recreating Chart instances on every render:** Chart.js requires `chart.destroy()` before creating a new chart on the same canvas. Store the instance and destroy it in `disconnectedCallback`.
- **Calling `codeToHtml()` synchronously:** It is async. The component must show a loading state or render a `<pre>` placeholder until the promise resolves.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom tokenizer / regex | Shiki `codeToHtml()` | TextMate grammar accuracy; 200+ languages; zero edge cases |
| LaTeX rendering | MathML generation | KaTeX `renderToString()` | Handles operator precedence, spacing, delimiters correctly |
| Diagram rendering | SVG-from-scratch | Mermaid `mermaid.render()` | Flowcharts, sequences, state machines all handled |
| Chart rendering | Canvas drawing code | Chart.js `new Chart()` | Responsive, accessible, tooltip, legend built-in |
| Line numbers | JS injection into code | CSS counter on `.line` | Zero JS, correct alignment, no DOM mutation needed |
| Figure numbering | JS DOM walk to count | CSS `counter-increment` | Automatic, correct order, no hydration needed |
| Copy to clipboard | `document.execCommand` | `navigator.clipboard.writeText()` | Modern async API, no flash of selection, permissions-aware |

**Key insight:** Every one of these problems has well-maintained libraries solving edge cases that take months to encounter in production (overflow, RTL math, nested diagrams). The hand-rolled version will fail on the third real article.

---

## Common Pitfalls

### Pitfall 1: Mermaid + Shadow DOM = TypeError (CRITICAL)

**What goes wrong:** `TypeError: Cannot read properties of null (reading 'getBoundingClientRect')` thrown during `mermaid.render()`.
**Why it happens:** Mermaid internally uses `document.body.appendChild()` for DOM measurement. Inside a Shadow DOM, the appended element cannot be queried or measured from the shadow root context.
**How to avoid:** Override `createRenderRoot()` in `devliot-diagram` to return `this` (light DOM rendering). The diagram's SVG is then injected directly into the element's light DOM.
**Warning signs:** Error thrown in Mermaid internals (`addHtmlSpan`), no SVG rendered, element content shows raw Mermaid text.
**Source:** [VERIFIED: github.com/mermaid-js/mermaid/issues/6306 — Status: Approved, unfixed as of 2026-04-11]

### Pitfall 2: KaTeX CSS Not Loading (Blank/Unstyled Math)

**What goes wrong:** Math renders as bare HTML with no visual structure; boxes overflow or overlap.
**Why it happens:** `katex.renderToString()` produces HTML that depends on `katex.css` for correct font metrics and spacing. If the stylesheet is not loaded globally, the output is unstyled.
**How to avoid:** Import `import 'katex/dist/katex.min.css'` in `main.ts` (Vite bundles it globally). Do NOT try to load it inside a Shadow DOM `<style>` — KaTeX's font paths are relative and won't resolve correctly.
**Warning signs:** Math HTML rendered but visually broken; `.katex` class elements have no font styling.

### Pitfall 3: Article Fetch URL Mismatch (404 on Articles)

**What goes wrong:** `fetch('/devliot/articles/my-article.html')` returns 404 in production.
**Why it happens:** Vite's `base: '/devliot/'` means all assets are served under that prefix. Articles in `src/articles/` are NOT automatically served — they must be in `public/` for Vite to include them verbatim.
**How to avoid:** Place article files in `public/articles/` (not `src/articles/`). In dev, Vite serves `public/` at the root. In production, `dist/` will contain `articles/` after build.
**Warning signs:** Articles load in `npm run dev` but 404 after `npm run build && npm run preview`.

### Pitfall 4: Chart.js Canvas Reuse Error

**What goes wrong:** `Error: Canvas is already in use. Chart with ID X must be destroyed before the canvas with ID Y can be reused.`
**Why it happens:** Chart.js holds a reference to the canvas element. If the Lit component updates and a new `Chart` is instantiated on the same canvas, the old instance conflicts.
**How to avoid:** Store the Chart instance in a class field (`private _chart?: Chart`). In `disconnectedCallback()`, call `this._chart?.destroy()`. In the initialization function, destroy before creating.
**Warning signs:** Console error on second render; no chart visible after update.

### Pitfall 5: Heading Anchors Lost After State Update

**What goes wrong:** Clicking on an article that's already displayed re-fetches HTML (same slug), and the anchor click handlers injected in `firstUpdated()` are gone.
**Why it happens:** `firstUpdated()` runs once. If `_html` state changes (re-fetch), the DOM is replaced and the handlers disappear.
**How to avoid:** Call `_injectHeadingAnchors()` in `updated()` whenever `_html` changes, not just in `firstUpdated()`. Guard with a check that the article exists in the shadow DOM.

### Pitfall 6: Shiki wasm File Not Found in Production

**What goes wrong:** Shiki fails to highlight code in production (`TypeError: Failed to fetch dynamically imported module`).
**Why it happens:** Shiki loads a WASM file for the TextMate grammar engine. In Vite production builds, WASM assets must be explicitly handled.
**How to avoid:** Vite handles `.wasm` assets natively when imported via `?url` or as dynamic imports. Use Shiki's standard npm import (`import { codeToHtml } from 'shiki'`) and Vite will bundle the WASM correctly. Do NOT use CDN imports in production.
**Warning signs:** Works in `npm run dev`, fails after `npm run build`.

### Pitfall 7: IntersectionObserver Not Disconnected

**What goes wrong:** Memory leak; observer fires repeatedly even after the diagram/chart has rendered.
**Why it happens:** `IntersectionObserver` keeps watching unless explicitly disconnected.
**How to avoid:** Call `observer.disconnect()` immediately inside the callback, before the dynamic import. Also call `observer.disconnect()` in `disconnectedCallback()` as cleanup.

---

## Code Examples

Verified patterns from official sources:

### Shiki codeToHtml (async, github-light)

```typescript
// Source: shiki.style/guide/install
import { codeToHtml } from 'shiki';

const html = await codeToHtml('const x = 1;', {
  lang: 'typescript',
  theme: 'github-light',
});
// html: '<pre class="shiki github-light" ...><code>...</code></pre>'
```

### KaTeX renderToString

```typescript
// Source: katex.org/docs/api
import katex from 'katex';

// Inline math:
const inline = katex.renderToString('E = mc^2', { throwOnError: false });

// Block math:
const block = katex.renderToString('\\int_0^\\infty e^{-x} dx', {
  throwOnError: false,
  displayMode: true,
});
```

### Mermaid render() (outside Shadow DOM)

```typescript
// Source: mermaid.js.org/config/usage.html
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });
const { svg, bindFunctions } = await mermaid.render('my-diagram-id', `
  graph TD
    A --> B
`);
container.innerHTML = svg;
if (bindFunctions) bindFunctions(container);
```

### Chart.js with JSON config

```typescript
// Source: chartjs.org/docs/latest/getting-started/usage.html
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const chart = new Chart(canvas.getContext('2d')!, {
  type: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [{
      data: [1, 2, 3],
      backgroundColor: '#333333',
      borderColor: '#1a1a1a',
    }],
  },
});
```

### IntersectionObserver lazy load

```typescript
// Pattern: load library only when element enters viewport
// Source: Lit lifecycle docs — lit.dev/docs/components/lifecycle/
private _observer?: IntersectionObserver;

override connectedCallback() {
  super.connectedCallback();
  this._observer = new IntersectionObserver(
    async (entries) => {
      if (entries[0].isIntersecting) {
        this._observer!.disconnect();
        await this._render(); // dynamic import + render
      }
    },
    { rootMargin: '200px' }
  );
}

override firstUpdated() {
  this._observer!.observe(this);
}

override disconnectedCallback() {
  super.disconnectedCallback();
  this._observer?.disconnect();
}
```

### CSS Counter Line Numbers for Shiki

```css
/* Source: prass.tech/blog/astro-syntax-highlighting/ — verified pattern */
pre.shiki {
  counter-reset: step;
  padding-left: 3.5rem; /* space for line number column */
}

pre.shiki .line::before {
  content: counter(step);
  counter-increment: step;
  display: inline-block;
  width: 2.5rem;
  margin-left: -3rem;
  margin-right: var(--space-sm);
  color: var(--color-text-muted);
  text-align: right;
  user-select: none;
}
```

### unsafeHTML directive import

```typescript
// Source: lit.dev/docs/templates/directives/
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Usage in render():
return html`<article>${unsafeHTML(this._articleHtml)}</article>`;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prism.js highlighting | Shiki 4 | 2023–2024 | TextMate accuracy; VS Code parity |
| MathJax 2 | KaTeX 0.16.x | ~2018, stable | Synchronous; 4x smaller |
| `mermaid.init()` | `mermaid.render()` + `mermaid.run()` | Mermaid v10 | `init()` deprecated in v10 |
| Chart.js global CDN | ESM import + `Chart.register()` | Chart.js v3 | Tree-shakeable, bundler-friendly |
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | ~2018, widely supported 2022 | Async; no selection flash |

**Deprecated/outdated:**
- `mermaid.init()`: Deprecated in Mermaid v10, removed in future. Use `mermaid.run()` or `mermaid.render()` [VERIFIED: mermaid.js.org/config/usage.html]
- `highlight.js`: Heavier, less accurate TypeScript/JSX — per CLAUDE.md, Shiki is the standard
- Prism v1: Maintenance-only — per CLAUDE.md, Shiki is the standard

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Article HTML files should go in `public/articles/` (not `src/articles/`) for correct Vite serving | Pattern 1 | Articles 404 in production; fix requires moving files and updating fetch paths |
| A2 | KaTeX CSS should be imported in `main.ts` globally (not per-component) | Pattern 3 | Math renders unstyled if CSS not loaded; easy fix once identified |
| A3 | `Chart.register(...registerables)` is acceptable (no tree-shaking) | Pattern 5 | Minor bundle size increase (~200KB); acceptable for a blog |
| A4 | Heading anchor click copies URL to clipboard; does not attempt to set URL hash (hash is consumed by router) | Pattern 6 | No functional breakage; UX question only — user may expect URL to change |
| A5 | @observablehq/plot is installed but not demonstrated in Phase 3 (Chart.js alone covers ART-07) | Standard Stack | ART-07 is satisfied without Plot; Plot deferred unless demo article explicitly needs it |

---

## Open Questions

1. **Heading anchors vs hash router conflict**
   - What we know: The router uses `window.location.hash` entirely (e.g., `#/article/my-slug`). Heading anchors traditionally use `#heading-id` fragment.
   - What's unclear: Can both coexist? Appending `#heading-id` after the router hash (`#/article/my-slug#heading-id`) requires the router to parse and handle two-part hashes, or the anchor just copies the URL without navigation.
   - Recommendation: For Phase 3, anchor click = clipboard copy only (no URL change). The heading gets an `id` attribute for manual deep-linking. The router does not need to change.

2. **Vite asset handling for article HTML files**
   - What we know: `public/` files are copied verbatim to `dist/`. `src/` files require explicit import to be bundled.
   - What's unclear: `D-03` says `src/articles/` — this conflicts with Vite's asset pipeline for fetched (non-imported) files.
   - Recommendation: Use `public/articles/` instead and update D-03 to reflect this. Treat `src/articles/` as the authoring location if needed, but document the `public/` distinction.

3. **Shiki language set**
   - What we know: Shiki 4 ships all languages; `codeToHtml()` lazy-loads on demand.
   - What's unclear: In a bundled Vite build, which languages are bundled vs fetched at runtime?
   - Recommendation: Use `codeToHtml()` shorthand (lazy loads on demand). For production, common languages (typescript, javascript, java, python, bash, json, html, css) will be fetched on first use and cached. No explicit language set needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + dev server | Yes | v22.14.0 | — |
| Playwright | E2E tests | Yes | 1.59.1 | — |
| npm (shiki) | ART-02 | Not installed | 4.0.2 available | — |
| npm (katex) | ART-03 | Not installed | 0.16.45 available | — |
| npm (mermaid) | ART-06 | Not installed | 11.14.0 available | — |
| npm (chart.js) | ART-07 | Not installed | 4.5.1 available | — |
| npm (@observablehq/plot) | Charts (optional) | Not installed | 0.6.17 available | chart.js covers ART-07 |

**Missing dependencies with no fallback:**
- `shiki`, `katex`, `mermaid`, `chart.js` — all must be installed before implementation waves begin.

**Missing dependencies with fallback:**
- `@observablehq/plot` — Chart.js alone satisfies ART-07 for Phase 3.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | `playwright.config.ts` (exists) |
| Quick run command | `npm run test-e2e` |
| Full suite command | `npm run test-e2e -- --project=chromium` |
| Base URL | `http://localhost:5173/devliot/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ART-01 | Article HTML rendered at `/article/:slug` URL | e2e | `npm run test-e2e -- --grep "ART-01"` | ❌ Wave 0 |
| ART-02 | Code block renders with syntax highlighting + copy button copies code | e2e | `npm run test-e2e -- --grep "ART-02"` | ❌ Wave 0 |
| ART-03 | Inline and block LaTeX renders without `.katex-error` class | e2e | `npm run test-e2e -- --grep "ART-03"` | ❌ Wave 0 |
| ART-04 | Image with figcaption shows "Figure 1:" prefix | e2e | `npm run test-e2e -- --grep "ART-04"` | ❌ Wave 0 |
| ART-05 | Heading has `.heading-anchor` link visible on hover | e2e | `npm run test-e2e -- --grep "ART-05"` | ❌ Wave 0 |
| ART-06 | Mermaid diagram SVG renders inside `devliot-diagram` | e2e | `npm run test-e2e -- --grep "ART-06"` | ❌ Wave 0 |
| ART-07 | Chart.js canvas with chart renders inside `devliot-chart` | e2e | `npm run test-e2e -- --grep "ART-07"` | ❌ Wave 0 |

**Note on Playwright + Shadow DOM:** Playwright's `locator()` and `getByRole()` pierce Shadow DOM by default (open mode). `devliot-diagram` uses light DOM — no special handling needed. All other components use Shadow DOM; standard Playwright locators work. [VERIFIED: playwright.dev/docs/locators]

**Note on lazy-loaded components (ART-06, ART-07):** Playwright must scroll the component into view (or set viewport to include it) before asserting render completion. Use `locator.scrollIntoViewIfNeeded()` + `waitFor({ state: 'visible' })`.

### Sampling Rate

- **Per task commit:** `npm run test-e2e -- --grep "ART-0[12]"` (core rendering)
- **Per wave merge:** `npm run test-e2e` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/article-components.spec.ts` — covers ART-01 through ART-07
- [ ] `public/articles/demo-article.html` — demo article fixture used by all tests
- [ ] `public/articles/demo-article.json` — demo metadata
- [ ] `public/articles/index.json` — article registry
- [ ] Package install: `npm install shiki katex mermaid chart.js @observablehq/plot`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Static blog, no auth |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | All content public |
| V5 Input Validation | Partial | Article HTML is developer-controlled (not user input); `unsafeHTML` safe for author-written content |
| V6 Cryptography | No | No secrets in this phase |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via article HTML | Tampering | `unsafeHTML` is safe because article `.html` files are in the git repo (developer-controlled). If user-submitted articles are ever added, DOMPurify must be introduced. Document this as a future gate. |
| Chart config JSON injection | Tampering | `JSON.parse(this.getAttribute('config'))` — attribute is set by the article author in the HTML file. No user input path. Safe for v1. |
| Clipboard API permission denial | Spoofing | `navigator.clipboard.writeText()` requires a user gesture (click). Already satisfied by copy button. Fallback: show the URL in a tooltip/prompt if clipboard fails. |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: npm registry] — `npm view` dist-tags confirmed for shiki@4.0.2, katex@0.16.45, mermaid@11.14.0, chart.js@4.5.1, @observablehq/plot@0.6.17
- [VERIFIED: github.com/mermaid-js/mermaid/issues/6306] — Mermaid Shadow DOM incompatibility, Status: Approved, unresolved
- [VERIFIED: shiki.style/packages/transformers] — no built-in line number transformer in @shikijs/transformers
- [CITED: mermaid.js.org/config/usage.html] — `mermaid.render()` API, `mermaid.initialize({ startOnLoad: false })` pattern
- [CITED: katex.org/docs/api] — `katex.renderToString()`, `katex.render()` signatures
- [CITED: lit.dev/docs/templates/directives/] — `unsafeHTML` import path and behavior
- [CITED: playwright.dev/docs/locators] — Shadow DOM piercing behavior confirmed

### Secondary (MEDIUM confidence)

- [CITED: shiki.style/guide/install] — `codeToHtml()` async API, lazy-load behavior
- [CITED: katex.org/docs/browser.html] — CSS loading requirement confirmed
- [CITED: chartjs.org/docs/latest/getting-started/usage.html] — `Chart.register(registerables)` pattern
- [CITED: prass.tech/blog/astro-syntax-highlighting/] — CSS counter line numbers for Shiki `.line` elements
- [CITED: onlyrss.org/posts/auto-numbering-of-figures-with-CSS-counters.html] — CSS counter figure numbering

### Tertiary (LOW confidence / ASSUMED)

- A1–A5 in Assumptions Log above — based on training knowledge of Vite behavior, not verified against Vite 8 specific docs this session

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions registry-verified
- Architecture patterns: HIGH — based on official API docs
- Mermaid Shadow DOM pitfall: HIGH — verified open issue on official repo
- Line numbers (CSS counter): MEDIUM — cited from third-party blog, matches known Shiki behavior
- Vite article file location: LOW (A1) — ASSUMED, needs confirmation at implementation

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (30 days — libraries stable; Mermaid Shadow DOM issue may be fixed in a patch release, check before implementing `devliot-diagram`)
