# Phase 4: Navigation & Discovery - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Readers can find articles by browsing a filtered list, clicking tags, viewing newest-first chronological order, and searching full text. All navigation happens on the existing home page and header — no new page types.

</domain>

<decisions>
## Implementation Decisions

### Article Listing Layout
- **D-01:** Compact list on the home page — one line per article showing date, tag/category, title, and tags below. Dense and scannable, fits the minimalist brand.
- **D-02:** Hero section (ASCII logo + tagline) stays above the article list. First impression stays branded.
- **D-03:** Articles ordered newest first (reverse chronological).

### Category & Tag Navigation
- **D-04:** Tags and categories are the same thing — one flat set of filter chips derived from article tags. No separate "category" concept.
- **D-05:** Filter chips appear above the article list (All | IA | Java | Tutorial...). Clicking a chip filters the list in-place. No page change, no new route needed.
- **D-06:** Clicking a tag on an article page or in the listing applies the same filter (navigates to home with that tag active).

### Search
- **D-07:** Search input lives in the sticky header — always accessible from any page, not just home. Search icon expands to input on click.
- **D-08:** Search covers title + full article body text + tags. Full-text search via FlexSearch.
- **D-09:** Search index built at build time from all article HTML content. Loaded lazily at runtime.

### Empty & Edge States
- **D-10:** Empty filter/search results show "No articles found." — simple text, consistent with existing error state pattern ("Article not found.").

### Claude's Discretion
- Search result display format (inline dropdown vs filtered list)
- FlexSearch index generation approach (build script vs Vite plugin)
- Filter chip active state styling (within grayscale palette)
- Debounce timing for search input

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project
- `.planning/PROJECT.md` — Core value, constraints, tech stack decisions
- `.planning/REQUIREMENTS.md` — NAV-01 through NAV-04 acceptance criteria
- `CLAUDE.md` §Technology Stack — FlexSearch chosen for client-side search

### Prior Phase Context
- `.planning/phases/03-article-components/03-CONTEXT.md` — Article rendering decisions
- `.planning/phases/02-design-system/02-CONTEXT.md` — Brand identity, grayscale palette

### Existing Code
- `src/devliot-app.ts` — HashRouter configuration, current routes
- `src/pages/devliot-home-page.ts` — Current home page (hero only, needs article listing)
- `src/components/devliot-header.ts` — Sticky header (search will live here)
- `public/articles/index.json` — Article registry with slug, title, date, category, tags

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/articles/index.json` — Article registry already has all metadata needed for listing and filtering (slug, title, date, category, tags)
- `HashRouter` in `src/utils/hash-router.js` — Supports pattern-based routing, easy to add new routes if needed
- `devliot-header.ts` — Sticky header component where search will be added
- CSS design tokens in `reset.css` — All spacing, typography, color tokens available

### Established Patterns
- Shadow DOM components with `?inline` CSS imports
- `unsafeCSS()` for styles, `@customElement` decorators
- Grayscale-only palette (--color-accent: #333333)
- Article page fetches from `articles/{slug}/index.html`

### Integration Points
- `devliot-home-page.ts` — Replace hero-only content with hero + article listing
- `devliot-header.ts` — Add search input/icon
- `devliot-app.ts` — May need new routes for tag filtering (or handle via query params)
- `index.json` — Source of truth for article list, read at runtime

</code_context>

<specifics>
## Specific Ideas

- Articles stored in prefixed subdirectories (e.g., `public/articles/01-demo-article/`)
- Tags and categories merged into one concept — simplifies the data model and UI
- Compact list style chosen explicitly over cards — density is valued

</specifics>

<deferred>
## Deferred Ideas

- **Article sources/references** — Bibliography or reference links at the bottom of articles. Belongs in Phase 5 (Article Metadata) or a dedicated content phase.
- **Article co-authors** — Name (or pseudo) + link to GitHub/LinkedIn/other profile per article. Belongs in Phase 5 alongside other per-article metadata.

</deferred>

---

*Phase: 04-navigation-discovery*
*Context gathered: 2026-04-14*
