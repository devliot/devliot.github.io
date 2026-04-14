# devliot

## What This Is

A custom-built static technical blog powered by Lit.js web components, deployed on GitHub Pages. It publishes instructional articles covering code (AI, Java, etc.), mathematical formulas, images, and data visualizations. The site is handcrafted — no framework, no CMS — just lightweight web components serving rich technical content. v1.0 shipped with full article rendering (Shiki, KaTeX, Mermaid, Chart.js), navigation/search, and social sharing metadata.

## Core Value

Readers can consume well-formatted technical articles where code, math, diagrams, and charts render beautifully and are easy to follow.

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

### Active

(None — all v1.0 requirements shipped. Next milestone will define new requirements.)

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

Shipped v1.0 MVP on 2026-04-14.
- 2,716 source LOC (TypeScript, CSS, HTML, ESM scripts)
- Tech stack: Lit 3.3.1, Vite 8, Shiki 4, KaTeX 0.16, Mermaid 11, Chart.js 4, FlexSearch 0.7
- 41 Playwright E2E tests across 5 test files
- 1 demo article (`01-demo-article`) showcasing all content types

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
| Hash-based routing over path-based | GitHub Pages SPA compat without 404.html hacks | Good — simple, reliable |
| FlexSearch over Lunr | Fastest client-side search, build-time indexing | Good — instant results |
| Build-time OG HTML over serverless | No runtime dependency, crawlers get static HTML | Good — zero infrastructure |
| Monochrome grayscale palette | Content-focused, no color distractions | Good — clean aesthetic |

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
*Last updated: 2026-04-14 after v1.0 milestone*
