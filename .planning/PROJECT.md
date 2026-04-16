# devliot

## What This Is

A custom-built static technical blog powered by Lit.js web components, deployed on GitHub Pages. It publishes instructional articles covering code (AI, Java, etc.), mathematical formulas, images, and data visualizations. The site is handcrafted — no framework, no CMS — just lightweight web components serving rich technical content. v1.0 shipped with full article rendering (Shiki, KaTeX, Mermaid, Chart.js), navigation/search, and social sharing metadata.

## Core Value

Readers can consume well-formatted technical articles where code, math, diagrams, and charts render beautifully and are easy to follow.

## Current Milestone: v2.0 Deep links, épuration UI, attribution & discovery

**Goal:** Rendre les articles partageables à la section près, alléger visuellement le site, et préparer le blog à l'attribution (auteurs, sources) et à la découverte (sitemap).

**Target features:**
- Deep-linkable anchors (h2 + h3) — click updates URL; loading a URL with an anchor navigates and scrolls with header-height offset
- UI refresh — white header/footer, home = search-only, article = logo-only
- Per-article bibliography — declarative references list rendered at article bottom
- Per-article authors — author/coauthors metadata declared and displayed
- Sitemap XML — `/sitemap.xml` generated at build for SEO

## Requirements

### Validated

- [x] Static site built with Lit.js web components — v1.0 Phase 1
- [x] Vite build with TypeScript — v1.0 Phase 1
- [x] Deployment via GitHub Pages + GitHub Actions — v1.0 Phase 1
- [x] Hash-based SPA routing — v1.0 Phase 1
- [x] Responsive layout (mobile/tablet/desktop) — v1.0 Phase 2
- [x] DEVLIOT brand logo (ASCII art) — v1.0 Phase 2
- [x] Minimalist, content-focused design with monochrome palette — v1.0 Phase 2
- [x] Articles written in HTML within Lit components — v1.0 Phase 3
- [x] Code syntax highlighting with copy button (Shiki) — v1.0 Phase 3
- [x] Mathematical formulas rendering (KaTeX) — v1.0 Phase 3
- [x] Image support with captions (figure/figcaption) — v1.0 Phase 3
- [x] Heading anchor links (deep links) — v1.0 Phase 3
- [x] Mermaid diagrams (flowcharts, architecture, sequences) — v1.0 Phase 3
- [x] Chart.js data visualization (bar, line, scatter) — v1.0 Phase 3
- [x] Navigation by category (filter chips) — v1.0 Phase 4
- [x] Chronological article listing (newest first) — v1.0 Phase 4
- [x] Tag system across articles — v1.0 Phase 4
- [x] Full-text client-side search (FlexSearch) — v1.0 Phase 4
- [x] Open Graph / Twitter Card tags per article — v1.0 Phase 5
- [x] Reading time per article (238 WPM) — v1.0 Phase 5
- [x] Publication date displayed — v1.0 Phase 5
- [x] Deep-linkable anchors for h2/h3 with header-aware scroll (ANCH-01..05) — v2.0 Phase 7
- [x] Path-based SPA routing (`/article/{slug}?section={id}`, no hash fragment) — v2.0 Phase 7
- [x] White header/footer + page-specific header content (UI-01..04) — v2.0 Phase 8

### Active

v2.0 requirements (detailed in REQUIREMENTS.md, mapped to phases in ROADMAP.md):
- Per-article bibliography section
- Per-article author(s) metadata + display
- Build-time sitemap XML generation

**Progress:**
- Phase 6: Data Schema Extension — complete (2026-04-15). Centralised Article/Author/BibliographyEntry/ArticleRegistry types in `src/types/article.ts`; demo article populated with authors + typed bibliography; consumer files wired with explicit type imports. Rendering deferred to Phases 9 (author byline) and 10 (bibliography).
- Phase 7: Deep-linkable Anchors — complete (2026-04-15). PathRouter replaces HashRouter; h2/h3 anchors with `history.pushState`, ResizeObserver-driven sticky-header offset, popstate back/forward, silent miss-strip, GitHub Pages SPA fallback via `dist/404.html`. All 47 Playwright tests green.
- Phase 8: UI Refresh — complete (2026-04-15). Header and footer migrated to white background; header is now context-aware via reflected `variant` attribute (home = collapsible search affordance, article = DEVLIOT logo); scroll-activated monochrome shadow on header; hamburger button removed; French search labels (`Rechercher un article…`); new `--color-border` token in palette. Phase 7's `--header-height` ResizeObserver pipeline preserved unchanged. 54/54 Playwright tests green.

### Out of Scope

- CMS / admin panel — the repo is the CMS; git commit = publish
- Comments system — blog is read-only, no moderation overhead
- Newsletter / email subscriptions — RSS planned for v2; no GDPR burden
- Authentication / user accounts — public blog, no personalization
- Interactive/executable code blocks — sandbox complexity too high; link to external playgrounds
- Server-side rendering — fully static GitHub Pages site
- Multi-language i18n — single author, single language
- Analytics (GA4) — privacy-first, no cookies/consent
- Dynamic OG image generation — serverless complexity disproportionate; static images per article
- Infinite scroll / pagination — flat list sufficient until > 50 articles

## Current State

Shipped v1.0 MVP on 2026-04-14. v2.0 in progress — Phase 9 complete as of 2026-04-16.
- Tech stack: Lit 3.3.1, Vite 8, Shiki 4, KaTeX 0.16, Mermaid 11, Chart.js 4, FlexSearch 0.7
- 64 Playwright E2E tests across 7 test files (10 new per-article-authors tests added in Phase 9)
- Path-based SPA routing (`/article/{slug}?section={id}`) with `dist/404.html` fallback for GitHub Pages
- White shell chrome with context-aware header (home = collapsible search, article = DEVLIOT logo); scroll-activated monochrome shadow; hamburger removed
- Per-article author bylines ("par X et Y") with clickable links; JSON-LD BlogPosting structured data in OG pages
- 1 demo article (`01-demo-article`) showcasing all content types
- Next: Phase 10 Per-article Bibliography — render bibliography entries from typed metadata

Last updated: 2026-04-16

## Constraints

- **Tech stack**: Lit.js — non-negotiable, the author knows it and wants to use it
- **Hosting**: GitHub Pages — free, tied to the repo
- **Content format**: HTML in Lit components — no Markdown preprocessing
- **Build**: Must produce static output compatible with GitHub Pages

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Lit.js over frameworks (React, Vue, Astro) | Author's expertise + lightweight web components | Good — clean component model, fast builds |
| HTML over Markdown for articles | Full control over rendering, no conversion pipeline | Good — enables custom components inline |
| GitHub Pages over Netlify/Vercel | Simplicity, free, directly tied to repo | Good — zero cost, simple deploy |
| Shiki over Prism/Highlight.js | VS Code-grade accuracy, build-time rendering | Good — accurate highlighting, lazy-loaded |
| KaTeX over MathJax | Synchronous, lighter, simpler integration | Good — fast inline/block math |
| Hash-based routing over path-based (v1.0) | GitHub Pages SPA compat without 404.html hacks | Superseded in v2.0 Phase 7 — migrated to path-based routing for clean URLs |
| Path-based routing with `dist/404.html` SPA fallback (v2.0) | Clean URLs (`/article/{slug}?section={id}`), enables shareable deep-link anchors without `?section=` embedded inside hash fragment | Good — clean URL shape, 47/47 Playwright tests green |
| FlexSearch over Lunr | Fastest client-side search, build-time indexing | Good — instant results |
| Build-time OG HTML over serverless | No runtime dependency, crawlers get static HTML | Good — zero infrastructure |
| Monochrome grayscale palette | Content-focused, no color distractions | Good — clean aesthetic |
| Variant attribute on `devliot-header` (v2.0 Phase 8) | Single component with two render branches keeps state (search toggle) and lifecycle (scroll listener, ResizeObserver host) co-located instead of splitting into two components | Good — minimal app-level wiring (`<devliot-header variant="home\|article">`), Lit's `:host([variant=...])` keeps styling declarative |
| Scroll-activated header shadow over static border (v2.0 Phase 8) | The shadow is invisible at scrollY=0 and appears as a subtle separator only when content sits behind the sticky header — preserves the borderless look of the page-top while still cueing the boundary on scroll | Good — pure box-shadow + transition, no extra DOM, monochrome rgba |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 — Phase 9 complete (per-article authors: byline rendering + JSON-LD structured data)*
