# devliot

## What This Is

A custom-built static technical blog powered by Lit.js web components, deployed on GitHub Pages. It publishes instructional articles covering code (AI, Java, etc.), mathematical formulas, images, and data visualizations. The site is handcrafted — no framework, no CMS — just lightweight web components serving rich technical content.

## Core Value

Readers can consume well-formatted technical articles where code, math, diagrams, and charts render beautifully and are easy to follow.

## Requirements

### Validated

- [x] Static site built with Lit.js web components — Validated in Phase 1: Foundation
- [x] Deployment via GitHub Pages — Validated in Phase 1: Foundation

### Active

- [ ] Static site built with Lit.js web components
- [ ] Articles written in HTML within Lit components
- [ ] Code syntax highlighting (Prism or Highlight.js)
- [ ] Mathematical formulas rendering (KaTeX or MathJax)
- [ ] Image support in articles
- [ ] Diagram support (Mermaid — flowcharts, architecture diagrams)
- [ ] Data visualization support (charts, curves, histograms)
- [ ] Navigation by category (IA, Java, Maths, etc.)
- [ ] Chronological article listing (newest first)
- [ ] Tag system across articles
- [ ] Search functionality within articles
- [ ] Minimalist, content-focused design
- [ ] Deployment via GitHub Pages

### Out of Scope

- CMS / admin panel — content is managed via code in the repo
- Comments system — v1 is read-only
- Newsletter / email subscriptions — not needed for initial release
- Authentication — public blog, no user accounts
- Interactive/executable code blocks — v1 is syntax highlight only
- Server-side rendering — fully static site
- Multi-language i18n — articles in one language at a time

## Context

- The author (Eliott) is experienced with Lit.js and wants to use it
- Articles are HTML authored directly in Lit components — no Markdown pipeline
- Target audience: developers and students learning AI, Java, mathematics, and related topics
- Hosted on GitHub — the repo itself is the content management system
- GitHub Pages handles deployment, likely with a build step to bundle Lit components

## Constraints

- **Tech stack**: Lit.js — non-negotiable, the author knows it and wants to use it
- **Hosting**: GitHub Pages — free, tied to the repo
- **Content format**: HTML in Lit components — no Markdown preprocessing
- **Build**: Must produce static output compatible with GitHub Pages

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Lit.js over frameworks (React, Vue, Astro) | Author's expertise + lightweight web components | — Pending |
| HTML over Markdown for articles | Full control over rendering, no conversion pipeline | — Pending |
| GitHub Pages over Netlify/Vercel | Simplicity, free, directly tied to repo | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after Phase 1 completion*
