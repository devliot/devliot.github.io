# Roadmap: devliot

## Milestones

- **v1.0 MVP** — Phases 1-5 (shipped 2026-04-14)
- **v2.0** — Phases 6-11 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) — SHIPPED 2026-04-14</summary>

- [x] Phase 1: Foundation (3/3 plans) — Lit.js + Vite + hash routing + GitHub Pages deploy
- [x] Phase 2: Design System (2/2 plans) — Monochrome brand, responsive layout, ASCII logo
- [x] Phase 3: Article Components (4/4 plans) — Shiki, KaTeX, Mermaid, Chart.js, figures, anchors
- [x] Phase 4: Navigation & Discovery (3/3 plans) — Filter chips, chronological listing, FlexSearch
- [x] Phase 5: Article Metadata (2/2 plans) — OG HTML, reading time, publication date

</details>

### v2.0 — Deep links, épuration UI, attribution & discovery

- [x] **Phase 6: Data Schema Extension** - Add authors and bibliography fields to index.json and TypeScript interfaces (completed 2026-04-15)
- [ ] **Phase 7: Deep-linkable Anchors** - Click-to-anchor URL updates and scroll-to-section on page load, with sticky-header offset
- [ ] **Phase 8: UI Refresh** - White header/footer, page-specific header content (home = search only, article = logo only)
- [ ] **Phase 9: Per-article Authors** - Author byline in article header and JSON-LD BlogPosting in OG pages
- [ ] **Phase 10: Per-article Bibliography** - Numbered references section at article bottom with inline citation back-links
- [ ] **Phase 11: Sitemap XML** - Build-time /sitemap.xml and robots.txt with Sitemap directive

## Phase Details

> Full per-phase detail lives in `.planning/milestones/v2.0-ROADMAP.md`. The sections below are inlined so `gsd-tools` can resolve each phase without crossing files. Keep both copies in sync when amending.

### Phase 7: Deep-linkable Anchors
**Goal**: Readers can share a direct link to any h2 or h3 section, and loading that link scrolls to the heading below the sticky header
**Depends on**: Phase 6
**Requirements**: ANCH-01, ANCH-02, ANCH-03, ANCH-04, ANCH-05
**Success Criteria** (what must be TRUE):
  1. Clicking the anchor icon on an h2 or h3 updates the browser address bar with `?section={id}` without reloading the page or triggering any router re-navigation
  2. Opening a URL that contains `?section={id}` navigates to the article and auto-scrolls to the correct heading
  3. The scrolled-to heading is fully visible below the sticky header (not obscured by it) on both home and article page header variants
  4. Pressing the browser back button after navigating between two different section anchors returns to the previous `?section=` state without reloading the page
  5. Deep-link anchors are present for h2 and h3 elements, and absent on h4 and below
**Plans:** 3 plans
Plans:
- [ ] 07-01-PLAN.md — Test scaffolding (RED stubs) + ResizeObserver --header-height pipeline + CSS scope/scroll-margin
- [ ] 07-02-PLAN.md — Anchor selector tightening (h2/h3) + pushState click handler (replaces clipboard)
- [ ] 07-03-PLAN.md — Initial-load scroll enhancement + popstate wiring + visual verification
**UI hint**: yes

### Phase 8: UI Refresh
**Goal**: The header and footer are white, and the header shows only context-relevant content — search on the home page, logo on article pages
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. The header background is white on all pages, separated from the body by a visible non-colored border or scroll-activated shadow
  2. The footer background is white on all pages with legible monochrome typography
  3. On the home page, the header contains the search bar and no logo or menu icon
  4. On any article page, the header contains the DEVLIOT logo and no search bar or menu icon
**Plans**: TBD
**UI hint**: yes

### Phase 9: Per-article Authors
**Goal**: Each article can credit one or more authors by name, displayed in the article header and embedded as structured data in OG pages for search engines
**Depends on**: Phase 6
**Requirements**: AUTHOR-01, AUTHOR-02, AUTHOR-03
**Success Criteria** (what must be TRUE):
  1. An article with an `authors` array in `index.json` displays a byline with author name(s) alongside the publication date and reading time in the article header
  2. An article without an `authors` field renders its metadata line normally with no broken layout or placeholder text
  3. The OG page for an article with authors contains a valid `<script type="application/ld+json">` block with `@type: BlogPosting` and an `author` property listing the declared authors
**Plans**: TBD
**UI hint**: yes

### Phase 10: Per-article Bibliography
**Goal**: Articles can cite numbered references that render as a formatted list at the bottom of the article, with inline citations linking to their entries and back
**Depends on**: Phase 6
**Requirements**: REF-01, REF-02, REF-03
**Success Criteria** (what must be TRUE):
  1. An article with a `bibliography` array in `index.json` displays a "References" section at the bottom with entries numbered `[1]`, `[2]`, ...
  2. Each reference entry renders in a format appropriate to its type (article, book, or web), including title, authors, year, and a clickable URL where provided
  3. An inline citation `[N]` in the article body is a link that scrolls to reference `[N]` in the references section
  4. Each reference entry has a back-link that scrolls to the inline citation in the article body
**Plans**: TBD
**UI hint**: yes

### Phase 11: Sitemap XML
**Goal**: Search engines can discover all articles through a standards-compliant sitemap, and crawlers are directed to it via robots.txt
**Depends on**: Phase 9
**Requirements**: SITE-01, SITE-02
**Success Criteria** (what must be TRUE):
  1. Running `npm run build` produces a `dist/sitemap.xml` listing the site root and one `<loc>` entry per article OG page, each with a `<lastmod>` date
  2. The sitemap XML is valid against the Sitemap Protocol 0.9 namespace — absolute URLs only, no hash fragment URLs
  3. `dist/robots.txt` contains a `Sitemap:` directive pointing to the canonical sitemap URL
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-04-10 |
| 2. Design System | v1.0 | 2/2 | Complete | 2026-04-11 |
| 3. Article Components | v1.0 | 4/4 | Complete | 2026-04-12 |
| 4. Navigation & Discovery | v1.0 | 3/3 | Complete | 2026-04-13 |
| 5. Article Metadata | v1.0 | 2/2 | Complete | 2026-04-14 |
| 6. Data Schema Extension | v2.0 | 2/2 | Complete    | 2026-04-15 |
| 7. Deep-linkable Anchors | v2.0 | 0/3 | Not started | - |
| 8. UI Refresh | v2.0 | 0/? | Not started | - |
| 9. Per-article Authors | v2.0 | 0/? | Not started | - |
| 10. Per-article Bibliography | v2.0 | 0/? | Not started | - |
| 11. Sitemap XML | v2.0 | 0/? | Not started | - |

---
*v1.0 details archived to `.planning/milestones/v1.0-ROADMAP.md`*
*v2.0 details in `.planning/milestones/v2.0-ROADMAP.md`*
