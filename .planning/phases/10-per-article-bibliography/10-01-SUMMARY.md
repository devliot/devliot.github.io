---
phase: 10-per-article-bibliography
plan: "01"
subsystem: article-rendering
tags: [bibliography, references, playwright, lit, css]
dependency_graph:
  requires:
    - phase-06-data-schema-extension  # BibliographyEntry type + demo data
    - phase-09-per-article-authors     # _renderByline() pattern reused
  provides:
    - references-section-rendering     # REF-02 complete
    - test-scaffold-ref02-ref03        # 15 Playwright tests scaffolded
    - citation-backlink-css            # .citation-link, .ref-backlink styles pre-deployed
  affects:
    - src/pages/devliot-article-page.ts
    - src/styles/article.css
    - tests/per-article-bibliography.spec.ts
tech_stack:
  added: []
  patterns:
    - "_renderReferences() extracted render method (follows _renderByline() pattern)"
    - "bibliography reset guard in _loadArticle() (prevents stale data on navigation)"
    - "Lit html template per-type formatting (article/book/web)"
key_files:
  created:
    - path: tests/per-article-bibliography.spec.ts
      description: "15 Playwright E2E tests for REF-02 (9 tests, GREEN) and REF-03 (6 tests, RED until Plan 02)"
  modified:
    - path: src/pages/devliot-article-page.ts
      description: "BibliographyEntry import, _bibliography state, reset/extraction in _loadArticle, _renderReferences() method, render() insertion"
    - path: src/styles/article.css
      description: ".references, .ref-list, .ref-entry, .citation-link, .ref-backlink styles appended"
decisions:
  - "D-02 honored: heading text 'Références' (French UI language established in Phase 8)"
  - "D-03 honored: compact single-line format [N] Authors — Title. Publisher, Year."
  - "D-04 honored: title is the clickable link when url present, target=_blank rel=noopener noreferrer"
  - "D-05 honored: references section inserted between <article> and .article-tags"
  - "D-06 honored: returns empty html`` when bibliography is absent or empty"
  - "D-07 honored: web type omits author prefix; book adds publisher; article omits publisher"
  - "CSS for Plan 02 (.citation-link, .ref-backlink) pre-deployed so Plan 02 needs no CSS changes"
metrics:
  duration: "5m 46s"
  completed: "2026-04-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 10 Plan 01: Per-article Bibliography — References Section Summary

**One-liner:** Numbered "Références" section rendered at article bottom with per-type compact format (article/book/web) and full Playwright test scaffold for REF-02 and REF-03.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create Playwright test scaffold for REF-02 and REF-03 | c821880 | tests/per-article-bibliography.spec.ts (199 lines, 15 tests) |
| 2 | Implement references section rendering and CSS | 99ee873 | src/pages/devliot-article-page.ts, src/styles/article.css |

## What Was Built

**Task 1 — Test scaffold (15 tests):**

REF-02 block (9 tests, all GREEN after Task 2):
- References section visible with "Références" heading
- Three numbered entries [1], [2], [3]
- Article-type format: Authors — Title. Year
- Book-type format: Authors — Title. Publisher, Year
- Web-type format: Title only (no author prefix)
- Title with URL renders as new-tab link with `rel="noopener"`
- References section positioned between `<article>` and `.article-tags`
- Muted styling: 14px, `rgb(102, 102, 102)`
- Border-top separator: 1px solid

REF-03 block (6 tests, intentionally RED until Plan 02 implements `_injectCitationLinks()`):
- Inline [N] citation links in article body
- Citation link muted color
- Clicking citation scrolls to reference entry
- Each referenced entry has ↩ back-link
- Clicking back-link scrolls to inline citation
- [id] markers not matching bibliography stay as plain text

**Task 2 — Implementation:**

`src/pages/devliot-article-page.ts` — 4 modification sites:
1. `import type { ArticleRegistry, Author, BibliographyEntry }` — added BibliographyEntry
2. `@state() private _bibliography: BibliographyEntry[] = []` — new reactive state
3. `this._bibliography = []` in reset block — prevents stale data on article navigation
4. `this._bibliography = meta.bibliography || []` in metadata extraction
5. `${this._renderReferences()}` in `render()` between `<article>` and `.article-tags`
6. New `_renderReferences()` method — section with h2 "Références", ol.ref-list, li#ref-N.ref-entry per type

`src/styles/article.css` — appended CSS for:
- `.references` — border-top separator, padding/margin
- `.references h2` — 20px semibold heading
- `.ref-list` — flex column, no list-style
- `.ref-entry` — 14px muted label style, `scroll-margin-top` for sticky header
- `.ref-entry a` — accent color underline for title links
- `.citation-link` — muted color, hover-only underline (for Plan 02)
- `.ref-backlink` — muted color, margin-left (for Plan 02)
- `.citation-link[id]` — scroll-margin-top for back-link target (for Plan 02)

## Verification Results

- `npx tsc --noEmit` — exits 0 (no TypeScript errors)
- `npx playwright test --grep "REF-02"` — 9/9 passed
- `npx playwright test` (full suite) — 61 passed, 18 pre-existing failures (META-01 production build tests, AUTHOR-03 production build tests, NAV-04 search empty state, REF-03 intentionally RED)
- No new regressions introduced

## Deviations from Plan

None — plan executed exactly as written.

The plan spec included `.ref-entry a` using `--color-accent` for links, which was included as specified. The monochrome palette constraint from CLAUDE.md notes `--color-accent` is used in `.heading-anchor` and blockquote already, so this is consistent with existing patterns.

## Known Stubs

None — all bibliography data flows from `index.json` through the `_bibliography` state and renders correctly. The 3 demo article entries cover all three types (article, book, web).

## Self-Check: PASSED

Files exist:
- FOUND: tests/per-article-bibliography.spec.ts
- FOUND: src/pages/devliot-article-page.ts (modified)
- FOUND: src/styles/article.css (modified)

Commits exist:
- FOUND: c821880 (test scaffold)
- FOUND: 99ee873 (implementation)
