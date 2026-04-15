# Phase 6: Data Schema Extension - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the article registry schema (`public/articles/index.json`) and the TypeScript interfaces that read it so that articles can carry an `authors` array and a `bibliography` array. The schema must be enforced across every TypeScript file that consumes `index.json`. No rendering, no UI, no build-script output changes — this is the data contract that Phases 9 (author byline + JSON-LD) and 10 (bibliography rendering + inline citations) will consume.

Success criteria (from ROADMAP.md):
1. Adding an `authors` array to an article entry in `index.json` produces no TypeScript errors at build time
2. Adding a `bibliography` array to an article entry in `index.json` produces no TypeScript errors at build time
3. The demo article compiles cleanly with both fields present

</domain>

<decisions>
## Implementation Decisions

### Article-level Authors (AUTHOR-01)

- **D-01:** `authors` is optional on an article entry — v1.0 articles without the field must still compile and render unchanged.
- **D-02:** `authors` is always an `Author[]` array, even for a single author. No `string | Author | Author[]` union. Matches REQUIREMENTS.md AUTHOR-01 and research SUMMARY.md guidance (supports co-authors without a schema change).
- **D-03:** The `Author` type is `{ name: string; url?: string }`. `name` required, `url` optional.

### Bibliography Entry Fields (REF-01)

- **D-04:** `bibliography` is optional on an article entry — v1.0 articles without the field must still compile and render unchanged.
- **D-05:** Every bibliography entry has exactly two REQUIRED fields: `id` and `title`. Everything else is optional. (Lenient default — authoring-friendly, rendering in Phase 10 handles missing fields gracefully.)
- **D-06:** Optional fields exposed on the TS type: `authors`, `url`, `publisher`, `pages`, `note`, `year` (year implied as common-case but not required — see D-05).
- **D-07:** `id` is constrained to slug-style — regex `^[a-z0-9-]+$`. Enforced at the TypeScript level (branded type or documented pattern) and validated by the planner/executor when authoring the demo.

### Citation Author Shape

- **D-08:** The `authors` field inside a bibliography entry reuses the same `Author` type as article-level authors (`{ name: string; url?: string }[]`). One shared `Author` type, used in both contexts. Keeps the schema coherent and lets a future phase link citation authors to their profile page.
- **D-09:** `authors` on a bibliography entry is optional — authorless citations (some web references, anonymous sources) are valid.

### Per-Type Strictness

- **D-10:** `type` is a TS literal union `'article' | 'book' | 'web'` — a flexible tag, not a discriminated union. All optional fields are exposed on every type; which ones are populated is a convention per type, not a TS constraint. (Chosen over a strict discriminated union for authoring ergonomics: no TS errors while drafting a web ref without `publisher`.)
- **D-11:** `type` is required on every bibliography entry. Forces a conscious decision and gives Phase 10 an unambiguous render branch.
- **D-12:** Supported types in v2.0 are exactly three: `article`, `book`, `web`. No `other` catch-all.

### Inline Citation Form

- **D-13:** Inline citations in the article HTML body use the form `[id]` where `id` matches a bibliography entry's `id` field (e.g. `[vaswani-2017]`). Phase 6 treats these as plain text; Phase 10 will render them as linkable, numbered `[N]` anchors.

### Demo Article Content

- **D-14:** The demo article (`01-demo-article`) carries `authors: [{name: 'Eliott', url: 'https://github.com/devliot'}, {name: 'Sample Coauthor'}]` — exercises the multi-author array so Phase 9's byline rendering has a real fixture.
- **D-15:** The demo article carries three real bibliography entries, one per supported type (`article`, `book`, `web`). Exact citation content is Claude's discretion — must be topic-appropriate for an article-components demo (e.g. a real Lit doc page for `web`, a real typography or web-standards book for `book`, a real arXiv paper or technical article for `article`).
- **D-16:** The demo article HTML body receives `[id]` plain-text markers referencing bibliography entries. Phase 6 does NOT render them — Phase 10 does. They exist in Phase 6 as an integration target and as a visible smoke test that the inline-citation form is valid under the final schema.

### Claude's Discretion

- Where the shared `Author` / `BibliographyEntry` / `Article` types live (inline in each consumer vs. a new `src/types/article.ts` module). Planner decides based on how many files consume the types — currently at least `devliot-home-page.ts`, `devliot-article-page.ts`, and potentially the build scripts.
- Exact TypeScript mechanism for the slug-style `id` constraint (branded type, template literal type, or documentation + runtime validator).
- The three real citations used in the demo (topic selection, specific titles, URLs, years) — must be real, must match article content, one per type.
- Whether `year` is an optional top-level field or nested under a publication metadata sub-object. Default: top-level optional `year?: number`.
- Whether build scripts (`build-og-pages.mjs`, `build-search-index.mjs`) are updated in this phase to consume the new types or left untouched until Phase 9/10 needs them. Scope-wise Phase 6 only needs `tsc` green — so touching them is optional here.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/REQUIREMENTS.md` §"Per-article author(s)" — AUTHOR-01 defines `authors[]` with `name` + optional `url`
- `.planning/REQUIREMENTS.md` §"Bibliography (per-article references)" — REF-01 defines `bibliography[]` with id, type, title, authors, url, year
- `.planning/ROADMAP.md` §Phase 6 — goal and three success criteria
- `.planning/milestones/v2.0-ROADMAP.md` §Phase 6 — full phase breakdown and dependencies to Phases 9 & 10

### v2.0 research

- `.planning/research/SUMMARY.md` §"Key Architectural Decisions" — schema-as-first-phase rationale, `index.json` as the registry for authors + bibliography
- `.planning/research/STACK.md` §"Feature 3 — Per-article Bibliography" — `bibliography` array shape, rendering deferred to Phase 10
- `.planning/research/STACK.md` §"Feature 4 — Per-article Author(s)" — `authors: [{name, url}]` shape and rationale for array over string
- `.planning/research/FEATURES.md` §"Feature 3"/"Feature 4" — feature-level context for schema fields
- `.planning/research/PITFALLS.md` — schema-level pitfalls (optionality, backward compat)

### Project

- `.planning/PROJECT.md` §"Constraints" — zero new runtime deps; TypeScript must stay the validation layer
- `.planning/PROJECT.md` §"Key Decisions" — monochrome palette, HTML-over-Markdown (rules out frontmatter parsers)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `public/articles/index.json` — Existing article registry. Extend in place; preserve all v1.0 fields (`slug`, `title`, `date`, `category`, `tags`, `description`, `image`, `readingTime`).
- `src/pages/devliot-home-page.ts:6-12` — Inline `Article` interface, currently `{slug, title, date, category, tags}`. Should consume the new shared type once centralised.
- `src/pages/devliot-article-page.ts:82-96` — Inline metadata type assumed at fetch-time (`{slug, tags, category, date, readingTime}`). Should consume the same shared type.
- `scripts/build-og-pages.mjs` — Reads `public/articles/index.json` in Node (plain JS, not TS-checked). New fields flow through untouched; deeper integration lands in Phase 9.
- `scripts/build-search-index.mjs` — Reads `index.json` and emits `search-data.json`. No schema-aware logic; new fields pass through.

### Established Patterns

- **Article metadata lives in `index.json`** — not in article HTML frontmatter, not in separate per-article JSON files. Single registry.
- **Fields are optional by default on article entries** — every v1.0 article added new fields over time without migrations (`readingTime` was added in Phase 5, `image` in Phase 3). The extension pattern is: add as optional, handle missing in consumers.
- **TypeScript is the validation layer** — no Zod, no ajv, no JSON Schema. `tsc` green == schema valid. (v2.0 zero-new-deps constraint.)
- **Inline interfaces per consumer** — v1.0 never centralised shared types. Either continue the pattern (duplicate `Author` and `BibliographyEntry` across two files) or break it by introducing `src/types/article.ts` — planner decides based on scope.

### Integration Points

- `public/articles/index.json` → `devliot-home-page.ts._fetchArticles()` (listing)
- `public/articles/index.json` → `devliot-article-page.ts._loadArticle()` (metadata lookup by slug)
- `public/articles/index.json` → `scripts/build-og-pages.mjs` (OG page generation — will consume `authors` in Phase 9)
- `public/articles/index.json` → `scripts/build-search-index.mjs` (search index — unaffected in Phase 6)
- `public/articles/01-demo-article/index.html` → demo article body, receives `[id]` plain-text markers

### Downstream consumers of this phase's schema

- **Phase 9** (Per-article Authors) — reads `article.authors` for byline rendering and JSON-LD `BlogPosting`
- **Phase 10** (Per-article Bibliography) — reads `article.bibliography` for `<devliot-references>` rendering and `[id]` inline citation linking
- **Phase 11** (Sitemap XML) — unaffected; sitemap uses `slug` + `date` only

</code_context>

<specifics>
## Specific Ideas

- Bibliography `id` values should read well when written inline — `[vaswani-2017]`, `[lit-element-docs]`, `[kerning-on-the-web]`. Slug-style enforces this.
- The demo article should function as the integration smoke test for every v2.0 feature as it lands — so co-authors + three-type bibliography + inline `[id]` markers all belong together in Phase 6, even though rendering arrives phase-by-phase.
- `year` is a common field the author will want on most citations, but optional at the schema level to accommodate web references without a clear publication year.
- The `Author` type is shared between article-level and citation-level contexts — one definition, two uses, future-proof for richer author metadata (affiliation, orcid) if ever needed.

</specifics>

<deferred>
## Deferred Ideas

- **Runtime validation (JSON Schema / ajv / Zod)** — `tsc` is the validation layer for v2.0 per the zero-new-deps constraint. Revisit only if a future phase needs runtime guarantees.
- **Bibliography back-links / numbered `[N]` rendering** — Phase 10.
- **`[id]` inline citations becoming clickable links** — Phase 10.
- **Author byline display in the article header** — Phase 9.
- **JSON-LD `BlogPosting` with `author: Person[]`** — Phase 9.
- **`schema.org/citation` markup for bibliography entries** — explicit Out of Scope per REQUIREMENTS.md §"Out of Scope" ("Schema.org JSON-LD autre que BlogPosting … reportés").
- **Additional bibliography types beyond article/book/web** (talk, dataset, tweet, video) — not requested in v2.0; fold into a future phase if/when needed.
- **Ordering guarantees on bibliography** — the array order determines inline render order in Phase 10. No separate `order` field; reorder by editing the array.
- **Author affiliation, ORCID, avatar** — not in AUTHOR-01 scope. Future enrichment only.

</deferred>

---

*Phase: 06-data-schema-extension*
*Context gathered: 2026-04-15*
