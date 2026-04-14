# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-14
**Phases:** 5 | **Plans:** 14 | **Timeline:** 7 days

### What Was Built
- Complete static technical blog with Lit.js web components on GitHub Pages
- Full article rendering pipeline: Shiki syntax highlighting, KaTeX math, Mermaid diagrams, Chart.js charts, image figures, heading anchors
- Navigation and discovery: category/tag filter chips, reverse-chronological listing, FlexSearch full-text search
- Social sharing metadata: build-time OG HTML generation, reading time, publication date
- 41 Playwright E2E tests across 5 test files

### What Worked
- Phase-by-phase incremental delivery: each phase produced a browser-verifiable result
- Lazy-loading strategy for heavy libraries (Mermaid, Chart.js) kept initial bundle small
- Build-time preprocessing (search index, reading time, OG pages) avoided runtime complexity
- Playwright E2E tests caught regressions across phases reliably
- Two-phase build script pattern (enrich before Vite, generate after Vite) solved the emptyOutDir conflict cleanly

### What Was Inefficient
- SUMMARY.md one-liner extraction didn't work at milestone completion — frontmatter format wasn't consistent across phases
- REQUIREMENTS.md traceability table stayed "Pending" throughout — CLI didn't auto-update status
- Some phase transitions could have moved requirements to "Validated" in PROJECT.md earlier

### Patterns Established
- Monochrome grayscale palette (#333333) — no colored accents
- Playwright E2E over manual browser verification
- Build scripts in `scripts/` as ESM (.mjs) reading from `public/articles/index.json`
- CSS custom properties for all design tokens in `src/styles/tokens.css`
- Shadow DOM components with `unsafeCSS` for imported stylesheets

### Key Lessons
1. Build pipeline ordering matters: pre-Vite enrichment + post-Vite generation is a reusable pattern for any build-time content processing
2. HTML escaping must match output context — HTML escaping in a JS string context is a real vulnerability (caught by code review)
3. UTC midnight timezone shift is a real pitfall for date-only strings — always append T12:00:00

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 7 days | 5 | Initial process — discuss/plan/execute per phase |

### Cumulative Quality

| Milestone | Tests | Test Files | E2E Coverage |
|-----------|-------|------------|-------------|
| v1.0 | 41 | 5 | All requirements have E2E tests |

### Top Lessons (Verified Across Milestones)

1. (First milestone — lessons will be cross-validated as more milestones ship)
