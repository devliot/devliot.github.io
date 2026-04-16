# Phase 9: Per-article Authors - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Render an author byline in the article header using the `Author[]` metadata established in Phase 6, and generate static JSON-LD `BlogPosting` structured data per article at build time for SEO. The byline is a separate line below the existing date/reading-time metadata. Articles without declared authors fall back to a default "Devliot" author. No new data schema changes — the `Author` type and `authors` array already exist.

**In scope:** AUTHOR-02 (byline rendering), AUTHOR-03 (JSON-LD structured data).

**Out of scope:** Author profile pages, author avatars, author bio, author filtering/listing. AUTHOR-01 (authors in `index.json`) was completed in Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Byline format (AUTHOR-02)

- **D-01:** Byline uses the French format **`par X et Y`**. For a single author: `par Eliott`. For two: `par Eliott et Sample Coauthor`. For three or more: `par X, Y et Z` (comma-separated with `et` before the last).
- **D-02:** The byline renders on a **separate line below** the existing date + reading-time metadata line. It gets its own `<p>` (or equivalent) element — not appended to the `.article-meta` line.
- **D-03:** Author names with a `url` field are rendered as **clickable `<a>` links** pointing to that URL. Authors without a `url` field are rendered as **plain text** (no link, no special styling). Links open in a new tab (`target="_blank" rel="noopener"`).

### Graceful degradation

- **D-04:** Articles **without** an `authors` array (or with an empty array) display a **default byline: `par Devliot`** linking to `https://github.com/devliot`. There is never a missing byline — every article shows at least the default author.
- **D-05:** The default author is NOT injected into `index.json` — it's a render-time fallback in the component. The data source stays clean.

### JSON-LD structured data (AUTHOR-03)

- **D-06:** JSON-LD is generated **at build time** as a static `<script type="application/ld+json">` block — not injected at client render time. A build script reads `index.json` and generates the markup.
- **D-07:** The JSON-LD block is placed in a **dedicated `og.html` file** per article: `public/articles/{slug}/og.html`. Keeps content HTML and SEO markup separate.
- **D-08:** The JSON-LD schema is `schema.org/BlogPosting` with these fields:
  - `@type`: `BlogPosting`
  - `headline`: article title
  - `datePublished`: article date
  - `author`: `Person[]` with `name` and optional `url` (from `authors` array; falls back to Devliot default per D-04)
  - `description`: article description (from `index.json`, if present)
  - `image`: article OG image URL (from `index.json`, if present)
  - `publisher`: `Organization` with `name: "DEVLIOT"` and `url: "https://devliot.github.io"` (or the configured site URL)

### Claude's Discretion

- Exact styling of the byline line (font-size, color, spacing relative to the metadata line above). Should use existing design tokens (`--color-text-muted`, `--font-size-body` or smaller).
- Build script implementation: standalone Node script, Vite plugin, or npm script. Should integrate with the existing `npm run build` pipeline.
- Whether the build script also generates JSON-LD for the default Devliot author on articles without declared authors, or omits the `author` field entirely for those.
- Exact `og.html` structure beyond the `<script>` block (minimal HTML head, or full page with OG meta tags).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 handoffs (data contract)
- `src/types/article.ts` — `Author`, `Article`, `ArticleRegistry` interfaces. `authors?: Author[]` is already optional on `Article`.
- `.planning/phases/06-data-schema-extension/06-CONTEXT.md` — D-01 through D-03 define the Author type and its optionality. D-14 defines the demo article fixture with two authors.

### Current article rendering
- `src/pages/devliot-article-page.ts` — Lines 200-218: current `render()` method with `.article-meta` line (date + reading time). Lines 97-114: metadata fetch from `index.json`. The byline insertion point is immediately after the `.article-meta` paragraph.
- `src/styles/article.css` — Existing `.article-meta` styles. New byline styles go here.

### Demo article data
- `public/articles/index.json` — Demo article entry with `authors: [{name: "Eliott", url: "https://github.com/devliot"}, {name: "Sample Coauthor"}]`
- `public/articles/01-demo-article/index.html` — Article HTML content (no OG tags currently)

### Existing OG infrastructure
- `public/articles/01-demo-article/meta.json` — Article metadata for OG (slug, title, date, category, tags — no authors currently)

### Tests to keep green
- `tests/article-components.spec.ts` — Article page rendering assertions
- `tests/deep-linkable-anchors.spec.ts` — Must stay green (scroll-margin-top depends on article header height)

### Project constraints
- `CLAUDE.md` — Lit 3, monochrome only, Playwright E2E preferred
- `.planning/PROJECT.md` — Monochrome palette, no colored accents

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Author` interface** (`src/types/article.ts`): `{ name: string; url?: string }` — ready to consume, no changes needed.
- **`.article-meta` CSS class** (`src/styles/article.css`): Styles for the date/reading-time line. The byline line should follow the same typographic patterns (muted color, smaller font).
- **Metadata fetch in `devliot-article-page.ts`** (lines 97-114): Already fetches `index.json` and extracts `_tags`, `_category`, `_date`, `_readingTime`. Needs to also extract `_authors` from `meta.authors`.

### Established Patterns
- **CSS-in-file with `?inline` imports** — article styles use `import articleStyles from '../styles/article.css?inline'` + `unsafeCSS()`.
- **Conditional rendering** — existing pattern: `${this._date ? html`...` : ''}`. Byline follows the same: always render (fallback to default author per D-04).
- **French metadata language** — search placeholder, aria-labels already in French. Byline prefix `par` is consistent.

### Integration Points
- **`devliot-article-page.ts render()`** — New byline `<p>` element inserted after `.article-meta` (line 208), before `<article>` (line 210).
- **Build pipeline** — New script generates `og.html` per article. Needs to run as part of `npm run build` or as a post-build step.

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants French byline format: "par Eliott et Sample Coauthor" — not English "by".
- User explicitly wants clickable author links to their defined URL.
- Default author is "Devliot" linking to `https://github.com/devliot` — this is the site owner's identity.
- The user chose build-time JSON-LD over client-rendered — prioritizes crawler reliability over implementation simplicity.
- The user chose a dedicated `og.html` over injecting into `index.html` — keeps content and SEO markup separate.

</specifics>

<deferred>
## Deferred Ideas

- **Home page logo malformation** — User reported "Le logo de la page principale est malformé." This is a bug in the Phase 8 home-variant header (which removed the logo from the home page per D-04/D-06). Needs investigation — may be a CSS issue or a rendering glitch in another page's header. Track as a bug fix, not part of Phase 9.
- **Author profile pages** — Clicking an author could lead to a page listing all their articles. Belongs in a future phase.
- **Author avatars** — No avatar support in the `Author` type. Future phase if needed.

No Reviewed Todos — todo system returned 0 matches for phase 9.

</deferred>

---

*Phase: 09-per-article-authors*
*Context gathered: 2026-04-16*
