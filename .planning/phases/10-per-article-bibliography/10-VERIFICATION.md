---
phase: 10-per-article-bibliography
verified: 2026-04-16T17:00:00Z
status: human_needed
score: 8/8
overrides_applied: 0
human_verification:
  - test: "Navigate to /article/01-demo-article and visually inspect the 'Références' section at the bottom"
    expected: "Border-top separator visible, h2 heading 'Références', three numbered entries in compact single-line format. First entry ([1]) has a clickable title link. Second entry ([2]) shows publisher 'Hartley & Marks'. Third entry ([3]) has no author prefix."
    why_human: "Visual layout, typography fidelity, and link appearance cannot be fully confirmed via programmatic CSS property checks alone — the test asserts computed color values but rendering quality (line wrapping, spacing, readability) requires visual inspection."
  - test: "In the same article, inspect the article body for inline citation links [3], [1], [2] in that document order"
    expected: "Three inline citations appear as muted-color bracketed numbers. Clicking [3] jumps to 'Lit - Simple. Fast. Web Components.' in the references section. Each reference entry has a ↩ back-link that returns focus to the corresponding inline citation."
    why_human: "Bidirectional scroll behavior correctness under real browser conditions with smooth-scroll timing and sticky-header offset is best confirmed by a human using the actual dev server, not just programmatic viewport position assertions."
---

# Phase 10: Per-article Bibliography — Verification Report

**Phase Goal:** Articles can cite numbered references that render as a formatted list at the bottom of the article, with inline citations linking to their entries and back
**Verified:** 2026-04-16T17:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An article with a `bibliography` array in `index.json` displays a "References" section at the bottom with entries numbered `[1]`, `[2]`, ... | VERIFIED | `_renderReferences()` method in `devliot-article-page.ts` renders `<section class="references"><h2>Références</h2><ol class="ref-list">` with `id="ref-${n}"` on each `<li>`. Playwright test "REF-02: three numbered entries [1], [2], [3]" — PASS. |
| 2 | Each reference entry renders in a format appropriate to its type (article, book, or web), including title, authors, year, and a clickable URL where provided | VERIFIED | Type-specific rendering: web entries omit author prefix, book entries include publisher, article entries include year. Title link uses `target="_blank" rel="noopener noreferrer"` when `entry.url` present. Tests REF-02 article/book/web format and URL link — all PASS. |
| 3 | An inline citation `[N]` in the article body is a link that scrolls to reference `[N]` in the references section | VERIFIED | `_injectCitationLinks()` TreeWalker transformation creates `<a class="citation-link" href="#ref-N" id="cite-N">` elements with `scrollIntoView({ behavior: 'instant' })` click handler. Tests REF-03 inline citation count/text, scroll behavior — all PASS. |
| 4 | Each reference entry has a back-link that scrolls to the inline citation in the article body | VERIFIED | After citation injection, `_injectCitationLinks()` appends `<a class="ref-backlink">↩</a>` to ref entries that have a matching `#cite-N` element (D-16 guard). Test "REF-03: each referenced entry has back-link" — 3 backlinks present, PASS. |

**Score:** 4/4 roadmap success criteria verified

### Plan Must-Haves (Plan 01 + Plan 02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| P1-1 | Article with bibliography data displays "References" section with numbered entries [1], [2], [3] | VERIFIED | 15/15 Playwright tests pass; `_renderReferences()` confirmed in source |
| P1-2 | Each reference entry renders in correct compact format per type (article/book/web) | VERIFIED | Type-branch logic in `_renderReferences()` confirmed; format tests PASS |
| P1-3 | Reference title with a URL is a clickable link opening in a new tab | VERIFIED | `target="_blank" rel="noopener noreferrer"` confirmed in source and Playwright |
| P1-4 | Articles without bibliography data render normally with no references section | VERIFIED | Early return `if (!this._bibliography || this._bibliography.length === 0) return html``\`\`` and `this._bibliography = []` in reset block |
| P2-1 | Inline [id] marker in article body is transformed into a numbered [N] clickable link | VERIFIED | `_injectCitationLinks()` with TreeWalker; test confirms 3 markers transformed |
| P2-2 | Clicking inline [N] citation smooth-scrolls to corresponding reference entry | VERIFIED | Click handler uses `scrollIntoView({ behavior: 'instant' })` to `#ref-N`; scroll test PASS |
| P2-3 | Each reference entry with matching inline citation has a back-link that smooth-scrolls to the citation | VERIFIED | Back-link appended by `_injectCitationLinks()` after DOM walk; test PASS |
| P2-4 | [id] marker with no bibliography match remains as plain text | VERIFIED | `idToN.get(id) !== undefined` guard; test asserts no original markers remain |

**Score:** 8/8 plan must-haves verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/per-article-bibliography.spec.ts` | Playwright E2E tests for REF-02 and REF-03, min 80 lines | VERIFIED | 199 lines, 15 tests, 2 describe blocks (REF-02, REF-03) |
| `src/pages/devliot-article-page.ts` | `_bibliography` state, `_loadArticle` extraction, `_renderReferences()`, `_injectCitationLinks()` | VERIFIED | All 4 methods and state present; `updated()` wired for both `_html` and `_bibliography` changes |
| `src/styles/article.css` | `.references`, `.ref-list`, `.ref-entry`, `.citation-link`, `.ref-backlink` styles | VERIFIED | All CSS classes confirmed at lines 202–265 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `devliot-article-page.ts` | `src/types/article.ts` | `import type { ..., BibliographyEntry }` | WIRED | Line 8: `import type { ArticleRegistry, Author, BibliographyEntry }` confirmed |
| `devliot-article-page.ts render()` | `_renderReferences()` | template call `${this._renderReferences()}` | WIRED | Line 406: `${this._renderReferences()}` between `<article>` and `.article-tags` |
| `devliot-article-page.ts _injectCitationLinks()` | article DOM text nodes | `createTreeWalker` | WIRED | `document.createTreeWalker(article, NodeFilter.SHOW_TEXT, ...)` with code/pre/devliot-code filter |
| `devliot-article-page.ts _injectCitationLinks()` | `#ref-N` elements | `scrollIntoView` on click | WIRED | `target?.scrollIntoView({ behavior: 'instant' })` in click handler |
| `devliot-article-page.ts updated()` | `_injectCitationLinks()` | `updateComplete.then()` call (dual trigger) | WIRED | Triggered on both `_html` change and `_bibliography` change; handles timing race |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `_renderReferences()` | `_bibliography` | `meta.bibliography \|\| []` from `index.json` fetch in `_loadArticle()` | Yes — 3 entries in demo article (article/book/web) | FLOWING |
| `_injectCitationLinks()` | `_bibliography` + article text nodes | Same `_bibliography` state; text nodes from `unsafeHTML(this._html)` | Yes — 3 inline markers in demo article HTML | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles cleanly | `npx tsc --noEmit` | Exit 0, no output | PASS |
| All 15 bibliography tests pass | `npx playwright test tests/per-article-bibliography.spec.ts --reporter=list` | 15/15 passed (7.2s) | PASS |
| REF-02 (9 tests): references section rendering | Subset of above | 9/9 PASS | PASS |
| REF-03 (6 tests): inline citations + back-links | Subset of above | 6/6 PASS | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REF-01 | Phase 6 (not Phase 10) | Article can declare bibliography in index.json | SATISFIED (Phase 6) | `BibliographyEntry` interface in `src/types/article.ts`; demo data in `index.json`; Phase 6 VERIFICATION.md confirms SATISFIED |
| REF-02 | 10-01 | "References" section renders as numbered list with per-type format | SATISFIED | `_renderReferences()` method; 9 REF-02 Playwright tests GREEN |
| REF-03 | 10-02 | Inline citations link to references; back-links link to citations | SATISFIED | `_injectCitationLinks()` method; 6 REF-03 Playwright tests GREEN |

**Note on REF-01:** The Phase 10 PLAN frontmatter lists REF-01 in its requirements, but REQUIREMENTS.md traceability table maps REF-01 to Phase 6, and Phase 10 CONTEXT.md explicitly states "REF-01 (bibliography declaration in index.json) was completed in Phase 6." Phase 6 VERIFICATION.md confirms REF-01 SATISFIED. Phase 10 consumes the REF-01 output (the type and data) but does not implement it — this is consistent.

**Orphaned requirements check:** REQUIREMENTS.md maps only REF-02 and REF-03 to Phase 10. Both are accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/debug-citations.spec.ts` | 1–42 | Untracked debugging artifact left in `tests/` directory; causes 1 failure in full suite run (`npx playwright test`) | Warning | Does not affect phase goal or deliverable tests; full suite shows "79 passed, 1 failed" where the failure is this untracked file only. Not committed. Should be deleted. |

No anti-patterns found in committed phase files (`devliot-article-page.ts`, `article.css`, `per-article-bibliography.spec.ts`).

### Human Verification Required

#### 1. Visual inspection of "Références" section

**Test:** Start the dev server (`npm run dev`). Navigate to `/article/01-demo-article`. Scroll to the bottom of the article.
**Expected:** A "Références" heading with a 1px border-top separator above it. Three numbered entries:
- `[1] Vaswani, Ashish, Shazeer, Noam, ... — Attention Is All You Need. 2017.` (title is a clickable link opening arxiv.org in a new tab)
- `[2] Bringhurst, Robert — The Elements of Typographic Style. Hartley & Marks, 2004.` (no link, just text)
- `[3] Lit - Simple. Fast. Web Components.` (no author prefix; title links to lit.dev in new tab)
All three entries below the tags nav bar.
**Why human:** Visual typography quality, spacing, line-wrapping under different viewport widths, and link styling (muted vs accent) require visual confirmation beyond computed CSS property checks.

#### 2. Bidirectional inline citation navigation

**Test:** On the same article page, locate three inline citation markers in the article body.
**Expected:** The text "[3]", "[1]", "[2]" appear in that order in the article body as muted-color links (not blue/accent colored). Clicking "[1]" should jump instantly to reference entry [1] in the "Références" section. Each reference entry shows a small ↩ link at the end. Clicking the ↩ on entry [1] should scroll back up to "[1]" in the article body.
**Why human:** Scroll offset correctness with the sticky header, and the visual appearance of muted citation links vs. regular content links are best verified by human inspection in a real browser session.

### Gaps Summary

No gaps. All 8 plan must-haves and all 4 roadmap success criteria are verified. The phase goal is achieved. Two human verification items remain for visual and interaction quality confirmation.

---

_Verified: 2026-04-16T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
