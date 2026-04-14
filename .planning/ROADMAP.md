# Roadmap: devliot

## Overview

Start with a working Lit.js static site that builds and deploys to GitHub Pages, then layer in the design identity and responsive layout, then build the full suite of article rendering components (code, math, diagrams, charts), then add navigation and discovery, and finally round off with per-article metadata. Each phase delivers something you can open in a browser and verify.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Working Lit.js site that builds and deploys to GitHub Pages via manual dispatch
- [ ] **Phase 2: Design System** - Brand identity and responsive layout applied across the site
- [ ] **Phase 3: Article Components** - Full article rendering (code, math, images, diagrams, charts)
- [ ] **Phase 4: Navigation & Discovery** - Category nav, tag system, chronological listing, full-text search
- [ ] **Phase 5: Article Metadata** - Open Graph tags, reading time, and publish date per article

## Phase Details

### Phase 1: Foundation
**Goal**: A working Lit.js site compiles, runs locally, and deploys to GitHub Pages via manual dispatch
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` serves the site locally with Lit.js components rendering
  2. Running `npm run build` produces a static output directory with no TypeScript errors
  3. Manually triggering the GitHub Actions workflow deploys the site to the live GitHub Pages URL
  4. Navigating to a hash-based route (e.g. `/#/article/hello`) resolves without a 404
**Plans:** 3 plans
Plans:
- [x] 01-01-PLAN.md — Scaffold Vite + Lit + TypeScript project with dependencies, tsconfig, and global CSS tokens
- [x] 01-02-PLAN.md — App shell, HashRouter controller, header/footer/page components with hash-based routing
- [x] 01-03-PLAN.md — GitHub Actions deployment workflow for GitHub Pages (manual dispatch)
**UI hint**: yes

### Phase 2: Design System
**Goal**: The site has a recognizable DEVLIOT brand identity and renders correctly on mobile, tablet, and desktop
**Depends on**: Phase 1
**Requirements**: BRAND-01, BRAND-02, INFRA-05
**Success Criteria** (what must be TRUE):
  1. The DEVLIOT logo is visible in the site header on all pages
  2. Typography is clean and content-focused — body text is readable at arm's length
  3. The site layout adapts correctly on a 375px mobile screen, a 768px tablet, and 1280px desktop
  4. No horizontal overflow or broken layout at any of the three breakpoints
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Install self-hosted fonts, update design tokens to DEVLIOT brand, set up Playwright E2E test infrastructure
- [x] 02-02-PLAN.md — ASCII art logo in header and hero, sticky header with hamburger, responsive layout, footer token fix
**UI hint**: yes

### Phase 3: Article Components
**Goal**: Authors can write a complete technical article using Lit components and every content type renders correctly
**Depends on**: Phase 2
**Requirements**: ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07
**Success Criteria** (what must be TRUE):
  1. A code block with syntax highlighting renders and a copy button copies the code to clipboard
  2. A LaTeX formula (inline and block) renders correctly via KaTeX without visible errors
  3. An image with a caption renders using figure/figcaption and the caption is visible below the image
  4. A heading in an article has a clickable anchor link that navigates directly to that heading via URL hash
  5. A Mermaid diagram and a Chart.js chart both render correctly inside an article
**Plans:** 4 plans
Plans:
- [x] 03-01-PLAN.md — Install dependencies, article page HTML renderer, heading anchors, figure CSS, spacing
- [x] 03-02-PLAN.md — devliot-code (Shiki syntax highlighting, copy button) and devliot-math (KaTeX formulas)
- [x] 03-03-PLAN.md — devliot-diagram (Mermaid, lazy, light DOM) and devliot-chart (Chart.js, lazy)
- [x] 03-04-PLAN.md — Demo article, article registry, Playwright E2E tests, visual verification
**UI hint**: yes

### Phase 4: Navigation & Discovery
**Goal**: Readers can find articles by browsing categories, tags, or searching, and always see the newest content first
**Depends on**: Phase 3
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. Clicking a category (e.g. "IA" or "Java") filters the article list to only articles in that category
  2. The article list on the home/index page shows articles in reverse chronological order (newest first)
  3. Clicking a tag on any article shows all articles sharing that tag
  4. Typing in the search box filters visible articles in real time (client-side, no server request)
**Plans:** 3 plans
Plans:
- [x] 04-01-PLAN.md — Extend HashRouter with hash query params, install FlexSearch, build-time search data generation
- [x] 04-02-PLAN.md — Home page article list with filter chips, tag navigation from article pages
- [x] 04-03-PLAN.md — Search input in header with FlexSearch integration, E2E tests for all NAV requirements
**UI hint**: yes

### Phase 5: Article Metadata
**Goal**: Each article has complete metadata for sharing and reading context
**Depends on**: Phase 4
**Requirements**: META-01, META-02, META-03
**Success Criteria** (what must be TRUE):
  1. Pasting an article URL into a Twitter/LinkedIn card validator shows the correct title, description, and image
  2. Every article page displays an estimated reading time (e.g. "5 min read")
  3. Every article page displays its publication date in a human-readable format
**Plans:** 2 plans
Plans:
- [ ] 05-01-PLAN.md — Build-time OG HTML generation, reading time computation, index.json schema extension, build pipeline update
- [ ] 05-02-PLAN.md — Metadata line in article page (date + reading time), Playwright E2E tests for META-01/02/03
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | - |
| 2. Design System | 2/2 | Complete | - |
| 3. Article Components | 4/4 | Complete | - |
| 4. Navigation & Discovery | 0/3 | Planned | - |
| 5. Article Metadata | 0/2 | Planned | - |
