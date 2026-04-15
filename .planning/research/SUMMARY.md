# Research Summary — Milestone v2.0

## Executive Summary

devliot v2.0 adds five features to a working v1.0 codebase with **zero new runtime dependencies**. All five are implemented using existing Lit primitives, standard Web APIs (ResizeObserver, history.pushState), CSS properties, and Node.js build scripts.

The most complex feature is **deep-linkable anchors**, which extends existing v1.0 infrastructure. The critical constraint is URL update strategy: `history.replaceState` must target `window.location.search` (the `?section=` query param), never `window.location.hash` — writing to the hash fires the HashRouter's `hashchange` listener, re-mounts the article, and destroys all rendered Shiki/Mermaid/KaTeX output. Scroll offset must use `window.scrollTo()` with a measured header height, not `scrollIntoView()`, because Safari does not consistently apply `scroll-padding-top` in programmatic scroll contexts.

Two architectural prerequisites front-load the work: extending `index.json` with `authors` and `bibliography` schema fields (before component work), and establishing the `ResizeObserver` → `--header-height` CSS variable pipeline in `devliot-app.ts` (before header heights diverge with the UI refresh). The sitemap is trivial — ~25 lines of Node.js following the existing `build-og-pages.mjs` pattern — but must list OG page URLs, not hash fragment URLs, which Google strips to the root.

## Stack Additions

**None.** Implementation uses the existing stack in full:
- Lit 3.3 (`@property`, `ResizeObserver`, Shadow DOM)
- Standard Web APIs (`history.replaceState`, `window.scrollTo`, `URLSearchParams`)
- CSS custom properties (`--header-height` exposed via ResizeObserver)
- Plain Node.js for sitemap generation
- Schema.org JSON-LD injected into existing `build-og-pages.mjs`

## Feature Table Stakes

### Deep-linkable anchors (h2 + h3)
- Click on heading anchor → URL updates via `history.replaceState`, anchored segment in `?section={id}`
- Opening/pasting URL with `?section={id}` → navigate to article AND scroll to anchor
- Scroll lands below sticky header (not hidden under it) — via `window.scrollTo` + live `--header-height`
- Keyboard Tab focus on headings also respects offset (CSS `scroll-padding-top` fallback on `html`)
- Browser back/forward through section history works (`popstate` listener)

### UI refresh
- Header background: white (no gray)
- Footer background: white (no gray)
- Home page header: search only (no logo, no menu icon)
- Article page header: logo only (no search)
- Header delimited from body (1px border or scroll-activated shadow — no colored accent)

### Per-article bibliography
- Declared in `index.json` per article (`bibliography: [{ id, type, title, authors, url, year, ... }]`)
- Numbered `[N]` citations in article body, linked to `<ol>` "References" at bottom
- Each reference item has a back-link to the citation(s) that point to it
- Shadow DOM anchor navigation wired via JS click handlers (not raw `<a href="#id">`)

### Per-article author(s)
- Declared in `index.json` (`authors: [{ name, url }]`, multiple allowed)
- Byline displayed in article header alongside date + reading time
- Emitted as schema.org `BlogPosting` / `Person` JSON-LD in OG pages for SEO

### Sitemap XML
- `/sitemap.xml` generated at build by new `scripts/build-sitemap.mjs`
- Lists site root + one entry per article (OG page URL: `/articles/{slug}/og.html`)
- Uses only `<loc>` + `<lastmod>` (Google/Bing ignore `<changefreq>` and `<priority>`)
- `robots.txt` updated with `Sitemap:` directive

## Key Architectural Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Deep-link URL state | `?section=` query param via `history.replaceState` | Writing to hash would fire HashRouter and remount article, destroying Shiki/KaTeX/Mermaid output |
| Scroll offset mechanism | `window.scrollTo({ top: target - headerHeight })` + `ResizeObserver` → `--header-height` CSS var | `scrollIntoView()` doesn't honor sticky header; CSS `scroll-padding-top` alone is inconsistent on Safari |
| Authors & bibliography data | `public/articles/index.json` (registry) | Article HTML files are content-only; metadata lives in the registry alongside existing fields (date, tags, readingTime) |
| Author display location | Inline in metadata bar (date/reading-time row) | Matches Substack/Medium convention; no new visual region needed |
| Bibliography rendering | `<devliot-references>` Lit component with typed dispatch | Article types (article/book/web) need different format; component isolates this |
| Shadow DOM biblio anchors | JS click handlers, not `<a href="#id">` | Hash fragments resolve against document root, not shadow root |
| Sitemap URL strategy | OG page URLs (`/articles/{slug}/og.html`) only | Hash fragments stripped by Google; OG pages are the canonical crawlable entry points |
| Header visual separation | 1px `#e5e5e5` bottom border (or scroll-activated shadow) | White-on-white fusion breaks layout clarity; monochrome constraint forbids colored accent |

## Top Pitfalls

1. **Hash-router × anchor conflict** — writing to `window.location.hash` triggers HashRouter remount. Always use `history.replaceState` on `window.location.search`.
2. **`scrollIntoView()` ignores sticky header** — title hidden under header. Use `window.scrollTo({ top: ... - headerHeight })`.
3. **Shadow DOM anchor navigation** — `href="#id"` resolves against document, not shadow root. Use JS click handlers.
4. **Sitemap hash URLs** — Google strips everything after `#`. Sitemap must list real file paths.
5. **White header visual fusion** — without separator, header blends into body. 1px border minimum.
6. **Header height re-measurement** — header height differs between home and article pages (different content). `ResizeObserver` must re-observe on page change.
7. **`popstate` through section history** — back/forward between `?section=a` and `?section=b` should re-scroll. Add `popstate` listener alongside existing `hashchange`.
8. **Mobile Safari viewport shift** — dynamic viewport (`100dvh`) vs static affects header height mid-scroll; anchor landing may drift a few pixels on scroll. Recompute on `resize`.
9. **Bibliography numbering** — if using CSS counter-increment, removing a reference shifts all subsequent numbers; inline citations must match. Either manually manage IDs or auto-generate matching markup.
10. **OG page double-indexation** — OG pages are technically crawlable pages with their own metadata. Sitemap listing them is fine for SEO but may create duplicate-URL perception if not `<link rel="canonical">`'d to the hash route.

## Cross-Feature Dependencies

```
Data schema (index.json authors + bibliography)
  ├──> Per-article authors (rendering)
  └──> Per-article bibliography (rendering)

ResizeObserver → --header-height pipeline
  ├──> Deep-linkable anchors (scroll offset)
  └──> UI refresh (variable header content)

UI refresh (header variants per page)
  └──> Impacts header height measurement (recompute on page change)

Build pipeline
  ├──> Sitemap XML (independent, append to pipeline)
  └──> JSON-LD in OG pages (modifies existing build-og-pages.mjs)
```

## Suggested Phase Ordering

| # | Phase | Rationale |
|---|-------|-----------|
| 6 | Data schema extension | Authors + bibliography fields in `index.json` + TS interfaces. Blocks phases 9 & 10. Low risk, low LOC. |
| 7 | Deep-linkable anchors | Establishes `ResizeObserver` → `--header-height` pipeline. Biggest architectural change. |
| 8 | UI refresh | Page-aware header content + white background + separation. Benefits from existing pipeline from phase 7. |
| 9 | Per-article authors | Byline render + JSON-LD in OG pages. Small, isolated. |
| 10 | Per-article bibliography | Most rendering complexity; uses schema from phase 6 and shadow-DOM click pattern. |
| 11 | Sitemap XML | Independent build artifact, append to pipeline. Last for low risk; could also run earlier. |

## Confidence

**HIGH** overall:
- Stack decisions: HIGH (zero new deps, verified against codebase)
- Architecture: HIGH (integration points source-verified)
- Feature patterns: HIGH (MDN/W3C/Google Search Central cross-checked)
- Pitfalls: HIGH for 1-5 (source-verified), MEDIUM for 6-10 (multi-source community consensus)

Gaps to resolve at implementation:
- Exact header height on home vs article page (measured at phase 7/8)
- `<devliot-references>` shadow vs light DOM (decided at phase 10)
- Whether sitemap lists OG pages, root, or both (minor; phase 11)

## Ready for Requirements

Proceed to REQUIREMENTS.md definition with 5 features mapped to 6 phases.
