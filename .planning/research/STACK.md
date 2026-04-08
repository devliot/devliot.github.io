# Technology Stack

**Project:** devliot — Lit.js static technical blog
**Researched:** 2026-04-08

---

## Recommended Stack

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
| `@lit-labs/router` | 0.1.x | SPA navigation (category pages, article routes) | Built by the Lit team, uses URLPattern API which reached Baseline 2025 (all major browsers). Vaadin Router — previously the go-to — was abandoned in November 2024 in favor of this. Lightweight, controller-based, idiomatic to Lit. |

**Confidence:** MEDIUM — `@lit-labs/router` is still in Labs (may have breaking changes). URLPattern being Baseline 2025 de-risks the polyfill dependency, but treat this package as pre-stable. If routing becomes a problem, a minimal hash-router (plain History API) is ~50 lines.

**Do NOT use:** Vaadin Router — officially abandoned as of November 2024.

---

### Syntax Highlighting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `shiki` | 4.0.2 | Code block syntax highlighting | Shiki is the current industry standard (adopted by VitePress, Nuxt Content, Astro). Uses TextMate grammars — same accuracy as VS Code. Ships zero JS to the client when used at build time. Supports lazy-loading themes/languages on demand in the browser (~200KB total for typical usage). Prism is stagnant (v2 abandoned). Highlight.js is heavier and less accurate. |

**Confidence:** HIGH — Shiki docs confirm v4.0.2 with browser CDN support.

**Do NOT use:** Prism.js — v2 was abandoned; the project is in maintenance-only mode. Highlight.js — larger, less accurate for modern syntax like TypeScript generics.

**Usage pattern for this blog:**

Since articles are HTML authored in Lit components (no Markdown pipeline), syntax highlighting runs **at runtime in the browser** via Shiki's CDN/ESM mode. Import `codeToHtml` from the shiki ESM bundle and call it inside a Lit component's lifecycle. Languages and themes are loaded on demand, keeping initial load lean.

---

### Math Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `katex` | 0.16.45 | LaTeX math formula rendering | KaTeX is synchronous, ~347KB page weight, and fast. MathJax 3 has closed the performance gap but is larger and async-first. For a blog rendering `\( ... \)` and `\[ ... \]` in HTML, KaTeX's synchronous API is the simpler integration. MathJax is only worth the trade-off if equations use `\label`/`\eqref` cross-referencing or MathML input — overkill for instructional articles. |

**Confidence:** HIGH — KaTeX version confirmed via katex.org CDN docs.

**Do NOT use:** MathJax — it is heavier, async, and its accessibility advantages are irrelevant for a sighted developer audience in v1.

---

### Diagrams

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `mermaid` | 11.14.0 | Flowcharts, sequence diagrams, architecture diagrams, state machines | Non-negotiable per project requirements. v11 is the current stable. Supports all required diagram types plus Wardley Maps and TreeView added in 11.14.0. |

**Bundle size warning:** Mermaid is large. The full bundle is ~2-3MB unminified; gzipped it is more manageable but still significant. **Strategy: lazy-load Mermaid inside a Lit web component that only initializes when a `<mermaid-diagram>` element enters the viewport** (Intersection Observer). This pattern is documented and production-proven (see lmorchard.com, 2026).

`@mermaid-js/tiny` exists (~half the size) but drops Mindmap, Architecture diagrams, KaTeX, and lazy loading — not appropriate if all diagram types are needed.

**Confidence:** HIGH — version confirmed from GitHub releases (April 1, 2026 release).

---

### Data Visualization (Charts)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `chart.js` | 4.5.1 | Bar charts, line charts, scatter plots, histograms | For standard charts in instructional articles (data distributions, learning curves, benchmark comparisons), Chart.js is the right choice: canvas-based (faster rendering than SVG for many data points), tree-shakeable, simple declarative config, no D3 expertise required. |
| `@observablehq/plot` | 0.6.17 | Grammar-of-graphics style charts (histograms, distributions) | Observable Plot is the high-level API from the D3 team. A histogram in D3 is 50 lines; in Plot it's 1. Use Plot when Chart.js's pre-defined chart types are too rigid — e.g., marginal distributions, custom statistical plots. |

**Confidence:** MEDIUM — Chart.js version from GitHub releases (October 2024). Observable Plot version from GitHub releases (February 2025).

**Do NOT use:** D3.js directly — it is a low-level toolkit requiring 5-10x more code for standard charts. Use Observable Plot (built on D3) for the same expressiveness with a concise API. ApexCharts/ECharts — heavy, opinionated styling, unnecessary for a content-focused blog.

**Recommendation:** Start with Chart.js. Add Observable Plot only when you need a chart type Chart.js cannot express cleanly. Do not add both to the same article bundle — lazy-load whichever is used per page.

---

### Client-Side Search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `flexsearch` | 0.7.x | Full-text search across articles | FlexSearch is the fastest client-side search library available (faster than lunr, fuse.js). At build time, generate a JSON search index from article content; at runtime, load it lazily and query with FlexSearch. Lunr is simpler but noticeably slower on larger article counts. |

**Confidence:** MEDIUM — community consensus from npm-compare analysis and 2025 blog posts. FlexSearch's API has historically been unstable between minor versions; verify docs on install.

---

## Complete Dependency Summary

```bash
# Core
npm install lit

# Build tool
npm install -D vite typescript

# Routing
npm install @lit-labs/router

# Syntax highlighting
npm install -D shiki

# Math rendering
npm install katex

# Diagrams (lazy-loaded)
npm install mermaid

# Charts
npm install chart.js
npm install @observablehq/plot   # add only when needed

# Search index
npm install flexsearch
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
| Routing | @lit-labs/router | Vaadin Router | Abandoned November 2024 |
| Search | FlexSearch | Lunr.js | Slower on larger article counts |
| Build | Vite | Raw Rollup | No dev server, no HMR, more config boilerplate |

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
- Vaadin Router abandoned: https://github.com/vaadin/router (README)
- @lit-labs/router URLPattern Baseline 2025: https://github.com/lit/lit/blob/main/packages/labs/router/README.md
- FlexSearch vs Lunr: https://npm-compare.com/elasticlunr,flexsearch,fuse.js,lunr,search-index
- Comparing syntax highlighters 2025: https://chsm.dev/blog/2025/01/08/comparing-web-code-highlighters
