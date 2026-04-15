---
phase: 07-deep-linkable-anchors
verified: 2026-04-15T15:00:00Z
status: passed
score: 5/5
overrides_applied: 0
re_verification: null
gaps: []
human_verification: []
---

# Phase 7: Deep-linkable Anchors — Verification Report

**Phase Goal:** Readers can share a direct link to any h2 or h3 section, and loading that link scrolls to the heading below the sticky header — with clean path-based URLs
**Verified:** 2026-04-15T15:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Clicking the anchor icon on h2/h3 updates the browser address bar with `?section={id}` without reloading the page or triggering router re-navigation | VERIFIED | `history.pushState({ section: id }, '', url.toString())` in `_injectHeadingAnchors` click handler; URL constructed via `new URL(window.location.href)` + `searchParams.set`; PathRouter popstate guard ignores query-only changes; Playwright ANCH-01 test green; human verification passed |
| SC-2 | Opening a URL with `?section={id}` navigates to the article and auto-scrolls to the correct heading | VERIFIED | `_scrollToSectionFromUrl()` reads `window.location.search`, finds `#${CSS.escape(section)}`, calls `scrollIntoView({behavior:'smooth'})`; Playwright ANCH-02 test green; human verification passed |
| SC-3 | The scrolled-to heading is fully visible below the sticky header (not obscured) on both home and article page header variants | VERIFIED | ResizeObserver in `devliot-app.ts firstUpdated()` measures real header height and publishes `--header-height` on `:root`; `scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)` on `h2, h3` in `article.css`; pipeline is variant-agnostic (Phase 8 header changes absorbed automatically); Playwright ANCH-03 test green; human verification confirmed ~12px gap |
| SC-4 | Pressing browser back after navigating between two different section anchors returns to previous `?section=` state without reloading | VERIFIED | `_onPopState` arrow method registered in `connectedCallback`, cleaned up in `disconnectedCallback`; PathRouter popstate guard does NOT re-render on query-only changes; pushState creates history entries; Playwright ANCH-04 test green; human verification passed |
| SC-5 | Deep-link anchors present on h2 and h3, absent on h4 and below | VERIFIED | `querySelectorAll('h2, h3')` in `_injectHeadingAnchors`; CSS hover-reveal scoped to `h2:hover .heading-anchor, h3:hover .heading-anchor` only; h4/h5/h6 have no selector in CSS and receive no injected anchor element; Playwright ANCH-05 test green; human verification confirmed |

**Score:** 5/5 truths verified

### Path-Routing Migration (D-11 through D-16 — phase scope expansion)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| D-11 | Article URLs use path format `/article/{slug}?section={id}`, no `#` fragment | VERIFIED | PathRouter reads `window.location.pathname`; all internal links use `/article/${slug}`; zero `/#/` references in `src/` or `tests/`; human verification confirmed |
| D-12 | HashRouter replaced by PathRouter; `hash-router.ts` deleted | VERIFIED | `src/utils/hash-router.ts` does not exist; `src/utils/path-router.ts` exists; `devliot-app.ts` imports PathRouter; no HashRouter references anywhere |
| D-13 | No redirect shim for old hash URLs | VERIFIED | No redirect code found in source; clean-cut per decision |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/deep-linkable-anchors.spec.ts` | Playwright E2E tests for ANCH-01..05 | VERIFIED | 6 tests listed via `--list`; all use path URL format `/article/01-demo-article`; assertions use `searchParams`, `pathname`, `boundingBox`, `goBack` |
| `src/devliot-app.ts` | ResizeObserver publishing `--header-height` | VERIFIED | `firstUpdated()` creates ResizeObserver observing `devliot-header`; uses `borderBoxSize?.[0]?.blockSize ?? offsetHeight`; sets `--header-height` on `document.documentElement`; `disconnectedCallback()` cleans up |
| `src/styles/article.css` | `scroll-margin-top` on h2/h3; hover-reveal scoped to h2/h3 | VERIFIED | `scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)` in `h2, h3` rule block; hover-reveal selector is `h2:hover .heading-anchor, h3:hover .heading-anchor, .heading-anchor:focus` only; no h4/h5/h6 hover rules; no `scroll-behavior` CSS |
| `src/pages/devliot-article-page.ts` | pushState click handler; replaceState on load; popstate listener | VERIFIED | `history.pushState` in click handler; `history.replaceState` on hit and miss in `_scrollToSectionFromUrl`; `_onPopState` registered in `connectedCallback`, removed in `disconnectedCallback`; `CSS.escape` on both querySelector paths |
| `src/utils/path-router.ts` | PathRouter ReactiveController | VERIFIED | Implements `ReactiveController`; reads `window.location.pathname`; popstate guard `newPath !== this.currentPath` prevents re-render on query-only changes (ANCH-04 safe) |
| `vite.config.ts` | `appType: 'spa'` | VERIFIED | `appType: 'spa'` present |
| `package.json` | Build script copies `index.html` to `404.html` | VERIFIED | `cp dist/index.html dist/404.html` appended to build script; `dist/404.html` exists |
| `scripts/build-og-pages.mjs` | OG redirects use path URLs | VERIFIED | Lines 71-72: `articleUrl` and `redirectUrl` use `/article/${slug}` without `#`; `dist/articles/01-demo-article/og.html` contains `window.location.replace("/article/01-demo-article")` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `devliot-app.ts` | `--header-height` on `:root` | ResizeObserver in `firstUpdated()` | WIRED | `setProperty('--header-height', ...)` confirmed in source |
| `article.css` h2/h3 rule | `--header-height` | `scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)` | WIRED | CSS rule confirmed in `h2, h3` block |
| `devliot-article-page.ts` click handler | `history.pushState` | anchor `addEventListener('click', ...)` | WIRED | `history.pushState({ section: id }, '', url.toString())` confirmed |
| `devliot-article-page.ts _scrollToSectionFromUrl` | `history.replaceState` | initial-load hit and miss paths | WIRED | Two `replaceState` calls confirmed (lines 190, 196) |
| `devliot-app.ts` | `src/utils/path-router.ts` | `import { PathRouter }` | WIRED | Import and instantiation confirmed |
| `devliot-home-page.ts` | `window.location.search` | `_fetchArticles` and `_onPopState` | WIRED | `new URLSearchParams(window.location.search)` confirmed; no `location.hash` references |
| `tests/deep-linkable-anchors.spec.ts` | `/article/01-demo-article` | URL assertions in all 6 tests | WIRED | Path format confirmed throughout test file |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `devliot-article-page.ts` `_injectHeadingAnchors` | heading `id` derived from `textContent` | Article DOM headings (real content) | Yes | FLOWING |
| `devliot-app.ts` ResizeObserver | `--header-height` | Live `borderBoxSize` of `devliot-header` DOM element | Yes | FLOWING |
| `_scrollToSectionFromUrl` | `section` param | `window.location.search` (real URL) | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 6 ANCH tests are listed in spec | `npx playwright test tests/deep-linkable-anchors.spec.ts --list` | 6 tests listed | PASS |
| PathRouter exists and implements ReactiveController | File read + grep | `export class PathRouter implements ReactiveController` | PASS |
| hash-router.ts deleted | `test -f src/utils/hash-router.ts` | File does not exist | PASS |
| No hash URLs in source | `grep -rn "/#/" src/ tests/` | Zero matches | PASS |
| TypeScript compiles clean | `npx tsc --noEmit` | No output (clean) | PASS |
| OG redirect uses path URL | Read `dist/articles/01-demo-article/og.html` | `replace("/article/01-demo-article")` | PASS |
| 404.html exists in dist | `test -f dist/404.html` | File exists | PASS |

All 47 Playwright tests passed on main after rebuild (confirmed by orchestrator context).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ANCH-01 | 07-02, 07-04 | Anchor click updates URL with `?section={id}` | SATISFIED | `history.pushState` in click handler; Playwright ANCH-01 green. Note: REQUIREMENTS.md says `replaceState` but this is a typo — D-02 and ROADMAP SC-1 both confirm `pushState` is correct for click events; `replaceState` is used on initial load (D-03) |
| ANCH-02 | 07-03, 07-04 | URL with `?section={id}` scrolls to heading on load | SATISFIED | `_scrollToSectionFromUrl()` in `updated()` lifecycle; Playwright ANCH-02 green |
| ANCH-03 | 07-01, 07-03, 07-04 | Scroll deposits heading below sticky header | SATISFIED | ResizeObserver + `scroll-margin-top` pipeline; Playwright ANCH-03 green |
| ANCH-04 | 07-03, 07-04 | Back/forward navigates between `?section=` states | SATISFIED | `_onPopState` + PathRouter pathname guard; Playwright ANCH-04 green |
| ANCH-05 | 07-01, 07-02, 07-04 | Anchors on h2/h3 only | SATISFIED | `querySelectorAll('h2, h3')`; CSS scope to h2/h3; Playwright ANCH-05 green |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `tests/article-components.spec.ts:153` | Stale comment "hash router" — should say "path router" | Info | Misleading comment only, no functional impact |
| `src/pages/devliot-article-page.ts:30` | `_scrollToSectionFromUrl()` called in `connectedCallback` before content loads (always no-op; effective call is in `updated()`) | Warning | Dead code path; in practice safe because `_html` is always empty at `connectedCallback` time, so `article` querySelector returns null before reaching section lookup. Could cause premature strip of valid `?section=` param if timing aligns unusually. Not a blocker for ANCH criteria. |
| `src/utils/path-router.ts` | No document-level `<a>` click interceptor — internal links cause full-page reloads (WR-03) | Warning | Article navigation via `<a href="/article/slug">` triggers full page reload instead of SPA navigation. However: (1) the SPA fallback (404.html) serves the app shell, (2) all ANCH behaviors work correctly after reload, (3) all 47 Playwright tests pass, (4) human verification confirmed 10/10 checks including article link navigation. This is a routing UX improvement for a future phase — it does not prevent phase goal achievement. |
| `src/pages/devliot-article-page.ts:131-136` | Empty heading text produces empty `id` and empty `?section=` (WR-01) | Warning | Defensive guard (`if (!id) return`) is absent. Real-world impact: zero, as the demo article has no emoji-only or empty headings. Not a blocker. |

### Human Verification Required

None — human verification was completed during Plan 07-03 (7 checks, all passed) and Plan 07-04 (10 checks, all passed) as documented in their respective SUMMARY.md files. All ANCH criteria were verified visually on the dev server at `http://localhost:5173`.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are verified against the codebase. The path-routing migration is complete. Three code-review warnings (WR-01, WR-02 via anti-patterns; WR-03 via missing SPA link interception) are advisory and do not prevent goal achievement — they are improvement opportunities for future phases.

One REQUIREMENTS.md wording inconsistency noted: ANCH-01 says `history.replaceState` but the correct implementation uses `history.pushState` on anchor click (consistent with D-02 and ROADMAP SC-1). The REQUIREMENTS.md entry has a typo; the implementation is correct.

---

_Verified: 2026-04-15T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
