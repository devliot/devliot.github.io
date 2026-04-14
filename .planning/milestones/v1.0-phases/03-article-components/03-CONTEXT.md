# Phase 3: Article Components - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Authors can write a complete technical article as an HTML file using custom elements for rich content (code, math, diagrams, charts), and every content type renders correctly within the existing Lit-based site shell. This phase builds the article rendering pipeline and all content-type components. No navigation, no search, no metadata pages — just rendering articles.

</domain>

<decisions>
## Implementation Decisions

### Article authoring model
- **D-01:** Generic renderer architecture — `devliot-article-page` fetches and renders external HTML files (not one Lit component per article). Articles live as plain `.html` files.
- **D-02:** Custom elements in article HTML — articles use `<devliot-code>`, `<devliot-math>`, `<devliot-diagram>`, `<devliot-chart>` etc. The renderer loads the HTML and Lit auto-upgrades the custom elements.
- **D-03:** Article files in `src/articles/` — each article has a `.html` content file and a companion `.json` metadata file (title, date, category, tags). An `index.json` registry lists all articles for routing.
- **D-04:** Include a demo article that exercises all content types (code, math, image, diagram, chart) — serves as an end-to-end proof and authoring reference.

### Code block behavior
- **D-05:** Shiki with GitHub Light theme — clean, neutral syntax highlighting on light backgrounds. Compatible with the grayscale site aesthetic (Shiki adds color for syntax only).
- **D-06:** Copy button: top-right corner, clipboard icon only, appears on hover. Shows "Copied!" feedback briefly after click.
- **D-07:** Language badge AND line numbers displayed on all code blocks.
- **D-08:** (Carried from Phase 2) Horizontal scroll, no line wrapping. Fira Code monospace font. Light/gray background.

### Math & diagram rendering
- **D-09:** KaTeX via `<devliot-math>` custom element — LaTeX content inside the element. `display` attribute for block math, inline by default.
- **D-10:** Mermaid diagrams and Chart.js charts are lazy-loaded — imported only when their custom element enters the viewport (IntersectionObserver). Keeps initial page load fast.
- **D-11:** Chart.js config passed as a JSON attribute on the `<devliot-chart>` element (`config='{ ... }'`). `type` attribute specifies chart type.

### Article typography & spacing
- **D-12:** Heading anchor links: hover-reveal `#` symbol to the left of headings. Clicking copies the anchor URL.
- **D-13:** Image captions: numbered figures with caption text — "Figure 1: Description" using `<figure>` / `<figcaption>`.
- **D-14:** Generous spacing between content blocks — 32-48px between major blocks (code, images, diagrams), 16-24px between paragraphs.

### Claude's Discretion
- Exact Shiki language set to bundle (balance coverage vs bundle size)
- Mermaid diagram container sizing and responsive behavior
- Chart.js color palette for grayscale compatibility
- KaTeX CSS loading strategy (global vs per-component)
- Article HTML fetching mechanism (static import vs fetch)
- Error states for failed renders (Mermaid syntax error, invalid LaTeX, etc.)
- Figure auto-numbering implementation approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/REQUIREMENTS.md` — ART-01 through ART-07 define what this phase must deliver
- `.planning/ROADMAP.md` §Phase 3 — Success criteria and phase goal
- `CLAUDE.md` §Technology Stack — Shiki 4.0.2, KaTeX 0.16.45, Mermaid 11.14.0, Chart.js 4.5.1, Observable Plot 0.6.17

### Prior phase context
- `.planning/phases/02-design-system/02-CONTEXT.md` — D-05 (light code backgrounds), D-07 (Fira Code), D-11 (horizontal scroll), design token names
- `src/styles/reset.css` — Current design tokens (colors, fonts, spacing) that article components must consume

### Existing article scaffold
- `src/pages/devliot-article-page.ts` — Current skeleton renderer (slug property, placeholder content)
- `src/styles/article.css` — Current minimal article styles
- `src/devliot-app.ts` — Router with `/article/:slug` pattern already wired

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `devliot-article-page.ts` — Already registered as `<devliot-article-page>` with a `slug` property and route wiring. Needs to be evolved into the generic HTML renderer.
- `article.css` — Basic article styling (heading, paragraph) using design tokens. Will be expanded with rich content styles.
- CSS custom properties from `reset.css` — `--font-family-mono`, `--color-surface-alt`, `--space-*` tokens available for all components.

### Established Patterns
- External CSS with `?inline` imports and `unsafeCSS()` — all new components must follow this pattern
- Shadow DOM on all components — CSS custom properties from `:root` pierce Shadow DOM
- Monochrome palette — grayscale only, no colored accent (`--color-accent: #333333`)

### Integration Points
- `src/devliot-app.ts` — Router already has `/article/:slug` route pointing to `devliot-article-page`
- `src/articles/` — Empty directory, ready for article HTML/JSON files
- `index.html` — May need additional stylesheet links for KaTeX CSS

</code_context>

<specifics>
## Specific Ideas

- User chose GitHub Light for Shiki — a well-known theme that adds color for syntax while keeping the overall feel clean. This is an intentional departure from strict monochrome for readability.
- Numbered figures ("Figure 1: ...") with caption text — a semi-academic style matching the technical/instructional nature of the blog.
- Generic renderer + HTML files was chosen over one-component-per-article for cleaner content separation — the author writes HTML, not TypeScript.
- Lazy loading for Mermaid and Chart.js was specifically chosen for performance — these libraries are heavy and most articles won't use them.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-article-components*
*Context gathered: 2026-04-11*
