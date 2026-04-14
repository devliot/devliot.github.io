---
phase: "04-navigation-discovery"
plan: "02"
subsystem: "navigation"
tags: ["lit", "filter-chips", "article-list", "tag-navigation", "hash-router"]
dependency_graph:
  requires: ["04-01"]
  provides: ["home-article-list", "tag-filter", "article-tag-nav"]
  affects: ["src/pages/devliot-home-page.ts", "src/pages/devliot-article-page.ts"]
tech_stack:
  added: []
  patterns:
    - "Hash-based query param tag filter (window.location.hash + URLSearchParams)"
    - "Lit map directive for reactive list rendering"
    - "CSS grid 3-column article row with mobile collapse"
    - "aria-pressed on filter chips for accessibility"
    - "hashchange listener in connectedCallback / disconnectedCallback"
key_files:
  created: []
  modified:
    - "src/pages/devliot-home-page.ts"
    - "src/styles/home.css"
    - "src/pages/devliot-article-page.ts"
    - "src/styles/article.css"
decisions:
  - "Tag filter state stored in URL hash query (?tag=X) so back-button and direct links work"
  - "Home page reads tag from window.location.hash directly (no access to HashRouter owned by devliot-app)"
  - "Category field unified with tags array as one filter chip set (D-04)"
  - "Metadata fetch on article page is non-critical — silent failure, tags simply don't render"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 04 Plan 02: Article Listing with Filter Chips and Tag Navigation Summary

**One-liner:** Home page article list with URL-driven filter chips and clickable tag navigation from article pages to home.

## What Was Built

### Task 1: Home page article list with filter chips

Rewrote `src/pages/devliot-home-page.ts` from a hero-only component to the full home page experience:

- **Article interface** defined with `slug`, `title`, `date`, `category`, `tags` fields
- **Reactive state**: `_articles: Article[]` and `_activeTag: string | null`
- **Data fetch**: `connectedCallback` fetches `${BASE_URL}articles/index.json`, then reads `?tag=` from the URL hash to set the initial active filter
- **hashchange listener**: registered on connect, removed on disconnect — keeps `_activeTag` in sync when browser back/forward navigation changes the hash
- **`_allTags` getter**: merges `category` + `tags` from all articles into a deduplicated, alphabetically sorted array
- **`_filteredArticles` getter**: filters by active tag (matching `article.tags.includes(tag) || article.category === tag`), sorted newest first by ISO date string comparison
- **`_setActiveTag` method**: updates `_activeTag` state and `window.location.hash` simultaneously so URL and UI stay in sync
- **Filter chip strip**: `role="group"`, `aria-label="Filter by tag"`, "All" chip + one chip per tag, `aria-pressed` on each
- **Article rows**: CSS grid layout (90px date | 80px category | 1fr title), tag buttons below title in grid row 2
- **Empty state**: `No articles found.` in `.empty-state` shown when filter yields zero results and articles are loaded
- **Mobile layout**: `@media (max-width: 767px)` collapses grid to single column, title first

Updated `src/styles/home.css` with all required styles: `.filter-strip`, `.filter-chips`, `.chip`, `.chip--active`, `.chip:hover`, `.chip:focus-visible`, `.article-list`, `.article-rows`, `.article-row` (grid), `.article-row__date/category/title/tags`, `.tag-link`, `.empty-state`, and mobile breakpoint.

### Task 2: Tag click navigation from article page

Modified `src/pages/devliot-article-page.ts`:

- Added `@state() private _tags: string[] = []` and `@state() private _category = ''`
- Added metadata fetch in `_loadArticle` after the article HTML fetch — fetches `index.json`, finds the matching slug, extracts `tags` and `category`. Failure is caught silently (non-critical)
- Added `_navigateToTag(tag: string)` that sets `window.location.hash = /#/?tag=${encodeURIComponent(tag)}`
- Updated `render()` to show a `<nav class="article-tags" aria-label="Article tags">` below the article when tags or category exist, with `<button class="tag-link">` for each

Updated `src/styles/article.css` with `.article-tags` (flex, border-top separator) and `.article-tags .tag-link` styles including hover and focus-visible states.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — article list is wired to `public/articles/index.json` (real data). Tags and filter state are fully functional.

## Threat Flags

None — no new network endpoints or auth paths introduced. Tag values from URL hash are used only as equality predicates against pre-loaded article data (no injection vector). Lit template auto-escaping applies to all interpolated tag text.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/pages/devliot-home-page.ts | FOUND |
| src/styles/home.css | FOUND |
| src/pages/devliot-article-page.ts | FOUND |
| src/styles/article.css | FOUND |
| commit 5123733 (Task 1) | FOUND |
| commit 8e88179 (Task 2) | FOUND |
