<!-- GSD:project-start source:PROJECT.md -->
## Project

**devliot**

A custom-built static technical blog powered by Lit.js web components, deployed on GitHub Pages. It publishes instructional articles covering code (AI, Java, etc.), mathematical formulas, images, and data visualizations. The site is handcrafted — no framework, no CMS — just lightweight web components serving rich technical content.

**Core Value:** Readers can consume well-formatted technical articles where code, math, diagrams, and charts render beautifully and are easy to follow.

### Constraints

- **Tech stack**: Lit.js — non-negotiable, the author knows it and wants to use it
- **Hosting**: GitHub Pages — free, tied to the repo
- **Content format**: HTML in Lit components — no Markdown preprocessing
- **Build**: Must produce static output compatible with GitHub Pages
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Library
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `lit` | 3.3.1 | Web component authoring | Non-negotiable per project constraints. Lit 3 is ES2021, drops IE11, is stable and interop with Lit 2. No breaking changes from 2→3 for typical usage. |
| TypeScript | 5.x (via Vite) | Type safety | Standard for Lit projects. Decorators (`@customElement`, `@property`) require `useDefineForClassFields: false` in tsconfig — this is a Lit-specific gotcha. |
### Build Tool
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `vite` | 8.x (current) | Dev server + production build | Vite ships a `lit` and `lit-ts` template via `create-vite`. Lit's official docs recommend Rollup for production, and Vite uses Rollup/Rolldown under the hood. Handles HMR, TypeScript transpilation (via esbuild, 20-30x faster than tsc), asset hashing, and static output for GitHub Pages. Vite 8 (April 2026) integrates Rolldown for ~70% faster builds. |
### Deployment
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Pages + GitHub Actions | — | Hosting + CI/CD | Non-negotiable per project constraints. Vite's official guide has a canonical workflow: push to main → `npm run build` → upload `dist/` → deploy via `actions/deploy-pages@v5`. |
### Client-Side Routing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@lit-labs/router` | 0.1.x | SPA navigation (category pages, article routes) | Built by the Lit team, uses URLPattern API which reached Baseline 2025 (all major browsers). Vaadin Router — previously the go-to — was abandoned in November 2024 in favor of this. Lightweight, controller-based, idiomatic to Lit. |
### Syntax Highlighting
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `shiki` | 4.0.2 | Code block syntax highlighting | Shiki is the current industry standard (adopted by VitePress, Nuxt Content, Astro). Uses TextMate grammars — same accuracy as VS Code. Ships zero JS to the client when used at build time. Supports lazy-loading themes/languages on demand in the browser (~200KB total for typical usage). Prism is stagnant (v2 abandoned). Highlight.js is heavier and less accurate. |
### Math Rendering
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `katex` | 0.16.45 | LaTeX math formula rendering | KaTeX is synchronous, ~347KB page weight, and fast. MathJax 3 has closed the performance gap but is larger and async-first. For a blog rendering `\( ... \)` and `\[ ... \]` in HTML, KaTeX's synchronous API is the simpler integration. MathJax is only worth the trade-off if equations use `\label`/`\eqref` cross-referencing or MathML input — overkill for instructional articles. |
### Diagrams
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `mermaid` | 11.14.0 | Flowcharts, sequence diagrams, architecture diagrams, state machines | Non-negotiable per project requirements. v11 is the current stable. Supports all required diagram types plus Wardley Maps and TreeView added in 11.14.0. |
### Data Visualization (Charts)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `chart.js` | 4.5.1 | Bar charts, line charts, scatter plots, histograms | For standard charts in instructional articles (data distributions, learning curves, benchmark comparisons), Chart.js is the right choice: canvas-based (faster rendering than SVG for many data points), tree-shakeable, simple declarative config, no D3 expertise required. |
| `@observablehq/plot` | 0.6.17 | Grammar-of-graphics style charts (histograms, distributions) | Observable Plot is the high-level API from the D3 team. A histogram in D3 is 50 lines; in Plot it's 1. Use Plot when Chart.js's pre-defined chart types are too rigid — e.g., marginal distributions, custom statistical plots. |
### Client-Side Search
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `flexsearch` | 0.7.x | Full-text search across articles | FlexSearch is the fastest client-side search library available (faster than lunr, fuse.js). At build time, generate a JSON search index from article content; at runtime, load it lazily and query with FlexSearch. Lunr is simpler but noticeably slower on larger article counts. |
## Complete Dependency Summary
# Core
# Build tool
# Routing
# Syntax highlighting
# Math rendering
# Diagrams (lazy-loaded)
# Charts
# Search index
## TypeScript Configuration Note
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
