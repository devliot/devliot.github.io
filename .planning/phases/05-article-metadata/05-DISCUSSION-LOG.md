# Phase 5: Article Metadata - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 05-article-metadata
**Areas discussed:** OG tag strategy, Metadata display, OG image source, Phase 4 deferrals

---

## OG tag strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Build-time per-article pages | Generate a small HTML file per article with OG tags in `<head>`. Crawlers see per-article metadata. | ✓ |
| Generic site-level tags only | Inject one set of OG tags into index.html. All links show same generic card. | |
| You decide | Let Claude pick the approach. | |

**User's choice:** Build-time per-article pages
**Notes:** Critical for META-01 — SPA crawlers can't execute JS, so build-time generation is necessary for per-article social cards.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-extract from article body | Extract first ~160 chars of text from article HTML at build time. | |
| Add description field to index.json | Hand-written description per article in the registry. | ✓ |
| You decide | Let Claude pick. | |

**User's choice:** Add description field to index.json
**Notes:** User prefers manual control over OG descriptions rather than auto-extraction.

---

## Metadata display

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata line above article content | Subtle line showing "April 11, 2026 · 5 min read" above article body. | ✓ |
| Below article title, inside article HTML | Injected after the first `<h1>` by the renderer. | |
| You decide | Let Claude pick placement. | |

**User's choice:** Metadata line above article content
**Notes:** Standard blog pattern, clean and unobtrusive.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Long format: "April 11, 2026" | Human-readable, unambiguous. | ✓ |
| Short format: "11 Apr 2026" | Compact, European/technical style. | |
| ISO format: "2026-04-11" | Developer-friendly, sortable. | |
| You decide | Let Claude pick. | |

**User's choice:** Long format: "April 11, 2026"
**Notes:** None.

---

## OG image source

| Option | Description | Selected |
|--------|-------------|----------|
| Single default DEVLIOT image | One branded image for all articles. Zero per-article effort. | |
| Per-article static image | Each article provides its own og-image.png. Richer social cards. | ✓ |
| You decide | Let Claude pick. | |

**User's choice:** Per-article static image
**Notes:** Accepts per-article authoring cost for richer social sharing.

---

## Phase 4 deferrals

| Option | Description | Selected |
|--------|-------------|----------|
| Article sources/references | Bibliography section at bottom of articles. | |
| Article co-authors | Author name + profile link per article. | |
| Defer both to v2 | Keep Phase 5 focused on META-01/02/03 only. | ✓ |

**User's choice:** Defer both to v2
**Notes:** Phase 5 stays focused on the three META requirements. Sources/references and co-authors move to v2 backlog.

---

## Claude's Discretion

- Build-time HTML generation approach (Vite plugin, build script, or post-build step)
- URL scheme for per-article OG pages
- Reading time calculation method
- OG image dimensions and fallback handling
- Twitter Card type
- Metadata line styling
- index.json schema additions

## Deferred Ideas

- Article sources/references — deferred to v2
- Article co-authors — deferred to v2
