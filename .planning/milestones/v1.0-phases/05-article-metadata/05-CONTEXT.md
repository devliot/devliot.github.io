# Phase 5: Article Metadata - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Each article gets complete metadata for social sharing (Open Graph / Twitter Card tags) and reading context (estimated reading time, publication date). Build-time generation ensures crawlers see per-article metadata despite the SPA architecture. No new page types, no new navigation — just metadata enrichment of existing articles.

</domain>

<decisions>
## Implementation Decisions

### Open Graph / Twitter Card tags
- **D-01:** Build-time per-article HTML pages — at build time, generate a dedicated HTML file per article containing OG and Twitter Card meta tags in `<head>`. Social media crawlers see per-article title, description, and image without executing JavaScript.
- **D-02:** Article descriptions are hand-written — add a `description` field to `index.json` per article. Authors write a short summary (~160 chars) for each article. This is used for `og:description` and `twitter:description`.
- **D-03:** Per-article static OG image — each article provides its own `og-image.png` (or similar) in its directory. An `image` field in `index.json` references it. Used for `og:image` and `twitter:image`.

### Metadata display on article page
- **D-04:** Metadata line above article content — a subtle line showing publication date and reading time (e.g. "April 11, 2026 · 5 min read") rendered by `devliot-article-page` above the article body, below the title area.
- **D-05:** Long date format: "April 11, 2026" — human-readable, unambiguous, standard for English-language blogs.

### Reading time
- **D-06:** Estimated reading time calculated and displayed per article (e.g. "5 min read"). Calculation approach is Claude's discretion (build-time in index.json or runtime from article HTML).

### Claude's Discretion
- Build-time HTML generation approach (Vite plugin, build script, or post-build step)
- URL scheme for per-article OG pages (how they integrate with hash routing + GitHub Pages)
- Reading time calculation method (word count at build time vs runtime)
- OG image dimensions and fallback handling
- Twitter Card type (`summary` vs `summary_large_image`)
- Metadata line styling within grayscale palette
- `index.json` schema additions (description, image fields)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project
- `.planning/PROJECT.md` — Core value, constraints, tech stack decisions
- `.planning/REQUIREMENTS.md` — META-01, META-02, META-03 acceptance criteria
- `CLAUDE.md` §Technology Stack — Vite build tooling, deployment constraints

### Prior Phase Context
- `.planning/phases/04-navigation-discovery/04-CONTEXT.md` — Navigation decisions, article listing, index.json usage
- `.planning/phases/03-article-components/03-CONTEXT.md` — Article rendering architecture, generic renderer, content types
- `.planning/phases/02-design-system/02-CONTEXT.md` — Grayscale palette, typography (Inter/Fira Code), responsive breakpoints

### Existing Code
- `src/pages/devliot-article-page.ts` — Article renderer, already fetches index.json for tags/category metadata
- `public/articles/index.json` — Article registry (slug, title, date, category, tags) — needs description and image fields added
- `index.html` — SPA entry point, currently has no OG tags
- `src/pages/devliot-home-page.ts` — Home page with article listing (already shows dates)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `devliot-article-page.ts` — Already fetches `index.json` for metadata (tags, category). Can be extended to also read date, description, and display reading time.
- `public/articles/index.json` — Article registry with slug, title, date, category, tags. Needs `description` and `image` fields added.
- CSS design tokens in `reset.css` — Spacing, typography, color tokens available for metadata line styling.

### Established Patterns
- Shadow DOM components with `?inline` CSS imports and `unsafeCSS()`
- Grayscale-only palette (`--color-accent: #333333`)
- Article content fetched from `articles/{slug}/index.html`
- Vite build produces static output to `dist/`

### Integration Points
- `devliot-article-page.ts` — Add metadata line (date + reading time) above article content
- `public/articles/index.json` — Extend schema with `description` and `image` fields
- Vite build config — Add build step to generate per-article OG HTML pages
- `index.html` — May need generic fallback OG tags for non-article URLs

</code_context>

<specifics>
## Specific Ideas

- User chose hand-written descriptions over auto-extraction — values control over convenience for social sharing text.
- Per-article images chosen over a single default — richer social cards, accepts the per-article authoring cost.
- Long date format ("April 11, 2026") explicitly chosen for readability — matches the instructional/educational tone of the blog.

</specifics>

<deferred>
## Deferred Ideas

- **Article sources/references** — bibliography or reference links at the bottom of articles. Deferred to v2.
- **Article co-authors** — name/pseudo + link to GitHub/LinkedIn per article. Deferred to v2.

</deferred>

---

*Phase: 05-article-metadata*
*Context gathered: 2026-04-14*
