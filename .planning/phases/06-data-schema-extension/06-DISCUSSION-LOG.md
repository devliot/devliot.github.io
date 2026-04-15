# Phase 6: Data Schema Extension - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 06-data-schema-extension
**Areas discussed:** Bibliography fields, Citation author shape, Per-type strictness, Demo article content

---

## Bibliography fields

### Q1 — Required fields on every bibliography entry

| Option | Description | Selected |
|--------|-------------|----------|
| id + title only | Minimum to render [N] in the list and match inline citations. Everything else optional. Most lenient — fastest to write. | ✓ |
| id + title + year | id + title + year always required. Authors/url/publisher remain optional. Year anchors the citation even when author or URL is missing. | |
| id + title + authors + year | Classic academic minimum. Three of the four expected citation fields required. URL optional. Most rigorous default. | |

**User's choice:** id + title only
**Notes:** Authoring-friendly default. Rendering in Phase 10 will handle missing fields gracefully.

### Q2 — Optional fields to expose on the TS type

| Option | Description | Selected |
|--------|-------------|----------|
| url | Link to the source. Clickable in rendered bibliography. | ✓ |
| publisher | For books: publisher name. For articles: journal/conference. | ✓ |
| pages | Page range (e.g. '221–234'). Useful for book/article citations. | ✓ |
| note | Free-text annotation. Rendered in italics at the end of the entry. | ✓ |

**User's choice:** url, publisher, pages, note (all four)
**Notes:** `year` added by Claude as an implicit optional on top of user-selected fields.

### Q3 — `id` value constraint

| Option | Description | Selected |
|--------|-------------|----------|
| Free string | Any string. Most flexible. Author chooses the style. | |
| Slug-style only | Lowercase, hyphens, alphanumeric (e.g. 'vaswani-2017'). TS pattern enforces it. | ✓ |
| Numeric string | '1', '2', '3' only. Ordering is manual and fragile if you reorder citations. | |

**User's choice:** Slug-style only (`^[a-z0-9-]+$`)

### Q4 — Inline citation form in article HTML

| Option | Description | Selected |
|--------|-------------|----------|
| [N] where N = id | Direct match between inline marker and bibliography id. | ✓ |
| [N] where N = array index | Clean prose but reorder = break citations. | |
| Dedicated <cite ref="id"> | Cleaner HTML separation, more verbosity. | |

**User's choice:** [id] where the bracketed value is the bibliography id (e.g. `[vaswani-2017]`)

---

## Citation author shape

### Q1 — Shape of `authors` inside a bibliography entry

| Option | Description | Selected |
|--------|-------------|----------|
| Same as article authors | Array of {name, url?}. One Author type reused in two places. | ✓ |
| Array of plain strings | ['Vaswani', 'Shazeer', 'Parmar']. Quickest to type. Loses url capability. | |
| Single display string | 'Vaswani et al.'. One field, author composes the string. | |

**User's choice:** Same as article authors
**Notes:** One shared `Author` type used in both contexts. Future-proof for linking a citation's author to their profile.

### Q2 — Required vs. optional on a bibliography entry

| Option | Description | Selected |
|--------|-------------|----------|
| Optional | Matches id+title-only default. Authorless refs get no author line. | ✓ |
| Required | Enforces rigor but conflicts with Q1 of Bibliography fields. | |

**User's choice:** Optional

---

## Per-type strictness

### Q1 — Flexible tag vs. discriminated union vs. drop type

| Option | Description | Selected |
|--------|-------------|----------|
| Flexible tag | Same optional fields across types. Convention chooses which fields to populate. | ✓ |
| Strict discriminated union | Book → publisher required, article → year required, web → url required. More ceremonial. | |
| Drop `type` entirely | Heuristic-based rendering in Phase 10. Schema simpler, rendering implicit. | |

**User's choice:** Flexible tag

### Q2 — Is `type` required?

| Option | Description | Selected |
|--------|-------------|----------|
| Required | Every citation declares its type. | ✓ |
| Optional (defaults to 'web') | Shortest for the common case of linking to a site. | |
| Optional (defaults to 'article') | Matches the academic default. | |

**User's choice:** Required

### Q3 — Supported types in v2.0

| Option | Description | Selected |
|--------|-------------|----------|
| article | Papers, journal articles, conference proceedings, preprints. | ✓ |
| book | Books and book chapters. | ✓ |
| web | Web resources — blog posts, documentation, online articles. | ✓ |
| other | Catch-all for talks, datasets, videos, tweets. | |

**User's choice:** article, book, web (three types, no `other` catch-all)

---

## Demo article content

### Q1 — `authors` content on the demo article

| Option | Description | Selected |
|--------|-------------|----------|
| Real: single author (you) | [{name: 'Eliott', url: 'https://github.com/devliot'}]. | |
| Real: co-author test | Two authors including one 'Sample Coauthor'. Exercises the array case. | ✓ |
| Placeholder | [{name: 'Demo Author'}]. Generic stub. | |

**User's choice:** Real: co-author test
**Notes:** Ensures Phase 9 byline rendering has a multi-author test fixture from the start.

### Q2 — `bibliography` content on the demo article

| Option | Description | Selected |
|--------|-------------|----------|
| 3 real entries, one per type | One article, one book, one web. Exercises each type for Phase 10. | ✓ |
| 1 sample entry, article type | Minimal fixture — proves schema compiles. | |
| Placeholder, one per type | Fake data. Replaced during Phase 10. | |

**User's choice:** 3 real entries, one per type
**Notes:** Real topic-appropriate citations — exact picks are Claude's discretion during execution.

### Q3 — Inline `[id]` markers in the demo article HTML body

| Option | Description | Selected |
|--------|-------------|----------|
| No, bibliography only | Schema-only scope, body untouched. Phase 10 adds markers + rendering together. | |
| Yes, add [id] markers | Sprinkle [id] markers now. Plain text until Phase 10 renders them. | ✓ |

**User's choice:** Yes, add [id] markers

---

## Claude's Discretion

- Where the shared `Author` / `BibliographyEntry` / `Article` types live — inline per-consumer vs. `src/types/article.ts`.
- Exact TypeScript mechanism for the slug-style `id` constraint (branded type, template literal type, or documentation + runtime helper).
- The three real citations on the demo article (topic, specific titles, URLs, years).
- Whether `year` is top-level optional or nested under a publication sub-object (default: top-level `year?: number`).
- Whether build scripts are updated in Phase 6 to import the shared types (not required for success criteria; planner decides).

## Deferred Ideas

- Runtime JSON schema / ajv / Zod validation — deferred (zero-new-deps).
- Bibliography `[N]` numbering / clickable inline citations / back-links — Phase 10.
- Author byline rendering in article header — Phase 9.
- JSON-LD `BlogPosting` emission — Phase 9.
- `schema.org/citation` markup — explicitly Out of Scope per v2.0 REQUIREMENTS.md.
- Additional bibliography types (talk, dataset, tweet, video) — future milestone if needed.
- Richer author metadata (affiliation, ORCID, avatar) — future enrichment.
