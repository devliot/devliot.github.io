# Phase 10: Per-article Bibliography - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Render bibliography entries from the `BibliographyEntry[]` metadata established in Phase 6 as a formatted "Références" section at the bottom of each article, and transform inline `[id]` plain-text markers in article HTML into numbered `[N]` clickable links with bidirectional scrolling between inline citations and their reference entries. Articles without a `bibliography` array render normally with no references section.

**In scope:** REF-02 (numbered references section rendering), REF-03 (inline citation links + back-links).

**Out of scope:** REF-01 (bibliography declaration in `index.json`) was completed in Phase 6. No schema changes — the `BibliographyEntry` type and demo data already exist.

</domain>

<decisions>
## Implementation Decisions

### References section presentation (REF-02)

- **D-01:** The references section is separated from the article body by a **horizontal rule** (1px `border-top`, same pattern as `.article-tags`) followed by an **h2-level heading** "Références".
- **D-02:** Section heading is **"Références"** (French) — consistent with the French UI language established in Phase 8 ("Rechercher un article…") and Phase 9 ("par X et Y").
- **D-03:** Each reference entry uses a **compact single-line format**: `[N] Authors — Title. Publisher, Year.` Fields adapt per type but stay dense — no card blocks or multi-line layouts.
- **D-04:** When a reference has a `url`, the **title text is the clickable link** (opens in new tab). No raw URL displayed. References without a `url` render the title as plain text.
- **D-05:** The references section renders **between the `<article>` element and the `.article-tags` nav** in the article page component.
- **D-06:** Articles **without** a `bibliography` array (or with an empty array) render normally with **no references section** — no heading, no separator, no placeholder.

### Type-specific formatting

- **D-07:** All three types (`article`, `book`, `web`) use the same compact format structure. The difference is which optional fields appear:
  - **article:** Authors — Title. Year. (URL on title if present)
  - **book:** Authors — Title. Publisher, Year. (URL on title if present)
  - **web:** Title. (URL on title — almost always present for web refs)
- **D-08:** Author names in references render as provided in the data (e.g. "Vaswani, A." or "Bringhurst, Robert") — no reformatting. When multiple authors, join with ", " and "et al." is not auto-generated (use it in the data if desired).

### Inline citation style (REF-03)

- **D-09:** Inline `[id]` markers in the article HTML body are transformed into **bracketed number links `[N]`** at normal text size (not superscript). The number corresponds to the 1-based index of the bibliography entry in the array.
- **D-10:** Citation links use **`--color-text-muted`** color with **underline on hover only** — visually distinct from content links (which use `--color-accent` + permanent underline).
- **D-11:** The transformation happens **post-render** (DOM manipulation after `unsafeHTML` injection), following the same pattern as `_injectHeadingAnchors()` in Phase 7.

### Bidirectional linking (REF-03)

- **D-12:** Clicking an inline `[N]` citation **smooth-scrolls** down to the corresponding reference entry in the "Références" section. Consistent with Phase 7 heading anchor scroll behavior.
- **D-13:** Each reference entry has a **↩ back-link** after the entry text that smooth-scrolls back up to the inline citation in the article body.
- **D-14:** Both scroll directions use `scrollIntoView({ behavior: 'smooth' })` and respect `scroll-margin-top` for the sticky header offset (existing CSS from Phase 7).

### Graceful degradation

- **D-15:** An `[id]` marker in the article body that does **not** match any bibliography entry `id` is left as plain text — no broken link, no error. Silent miss.
- **D-16:** A bibliography entry that has **no** corresponding `[id]` marker in the article body still renders in the references section — the ↩ back-link is simply absent for that entry.

### Claude's Discretion

- Exact CSS for the references section (font sizes, spacing, indentation of wrapped lines). Should follow existing `--font-size-label` / `--font-size-body` patterns.
- Whether `[id]` → `[N]` transformation uses regex replacement on the HTML string before injection, or DOM traversal after injection. Both are valid — choose based on reliability with nested HTML.
- Whether the references section is rendered inline in `devliot-article-page.ts render()` or extracted as a private `_renderReferences()` method (similar to `_renderByline()`).
- `id` attribute naming for citation and reference anchors (e.g. `cite-1` / `ref-1`, `cite-vaswani-2017` / `ref-vaswani-2017`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 handoffs (data contract)
- `src/types/article.ts` — `BibliographyEntry`, `Author`, `Article` interfaces. `bibliography?: BibliographyEntry[]` is optional on `Article`.
- `.planning/phases/06-data-schema-extension/06-CONTEXT.md` — D-04 through D-16 define the bibliography schema, id constraints, type union, inline citation form.

### Requirements
- `.planning/REQUIREMENTS.md` §"Bibliography (per-article references)" — REF-01, REF-02, REF-03
- `.planning/ROADMAP.md` §Phase 10 — goal and four success criteria

### Current article rendering
- `src/pages/devliot-article-page.ts` — `_loadArticle()` fetches `index.json` (line 99-117); `render()` method (line 227-246) with insertion point between `<article>` and `.article-tags`; `_injectHeadingAnchors()` (line 124-157) as the pattern for post-render DOM manipulation; `_renderByline()` (line 169-191) as the pattern for extracted render methods.
- `src/styles/article.css` — `.article-meta`, `.article-byline`, `.article-tags` styles. New `.references` styles go here.

### Demo article data
- `public/articles/index.json` — Demo article with 3 bibliography entries (one per type: article, book, web)
- `public/articles/01-demo-article/index.html` — Contains `[vaswani-2017]`, `[bringhurst-2004]`, `[lit-docs]` inline markers (lines 3, 24, 58)

### Phase 7 scroll patterns
- `src/pages/devliot-article-page.ts` — `_scrollToSectionFromUrl()` and heading anchor click handler as reference for smooth scroll + `scroll-margin-top` integration

### Tests
- `tests/` — All existing Playwright test files must stay green. New bibliography tests to be added.

### Project constraints
- `CLAUDE.md` — Lit 3, monochrome only, Playwright E2E preferred
- `.planning/PROJECT.md` — Monochrome palette (#333333), no colored accents, zero new runtime deps

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`BibliographyEntry` interface** (`src/types/article.ts`): Fully typed with `id`, `type`, `title` required + optional `authors`, `url`, `year`, `publisher`, `pages`, `note`. Ready to consume.
- **`_injectHeadingAnchors()` pattern** (`devliot-article-page.ts:124-157`): Post-render DOM manipulation that queries elements inside `<article>`, creates anchors, attaches click handlers with `scrollIntoView`. The inline citation transformation follows this exact pattern.
- **`_renderByline()` pattern** (`devliot-article-page.ts:169-191`): Extracted private render method returning `html` template. References section rendering can follow the same structure.
- **`.article-tags` separator** (`src/styles/article.css:172-179`): `border-top: 1px solid #eeeeee` + padding/margin pattern. References section uses the same separator style.

### Established Patterns
- **CSS-in-file with `?inline` imports** — article styles use `import articleStyles from '../styles/article.css?inline'`.
- **Post-render DOM manipulation** — heading anchors injected in `updated()` lifecycle via `updateComplete.then()`. Citation links follow the same lifecycle hook.
- **Metadata fetched from `index.json`** — `_loadArticle()` already reads the registry and extracts fields. Needs to also extract `bibliography`.
- **French UI language** — "par X et Y", "Rechercher un article…". Section heading follows: "Références".

### Integration Points
- **`devliot-article-page.ts render()`** — New references section between `<article>` and `.article-tags` nav.
- **`devliot-article-page.ts _loadArticle()`** — Extract `meta.bibliography` alongside existing `meta.authors`, `meta.tags`, etc.
- **`devliot-article-page.ts updated()`** — Add citation link injection after heading anchor injection.
- **`src/styles/article.css`** — New `.references`, `.ref-entry`, `.citation-link`, `.ref-backlink` styles.

</code_context>

<specifics>
## Specific Ideas

- The compact `[N] Authors — Title. Publisher, Year.` format is deliberately academic but lightweight — matches the monochrome, content-focused aesthetic.
- Citation links are intentionally muted (`--color-text-muted`, hover-only underline) to avoid visual noise in the article body. They should feel like footnote markers, not primary navigation.
- The ↩ back-link is the Wikipedia/academic convention — readers will recognize it instantly.
- "Références" matches the established French UI language. The article content itself may be in any language, but chrome/UI elements are French.
- The `[id]` → `[N]` numbering follows array order in `bibliography[]` — Phase 6 D-13 established this: "the array order determines inline render order."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-per-article-bibliography*
*Context gathered: 2026-04-16*
