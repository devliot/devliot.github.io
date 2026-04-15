---
phase: 06-data-schema-extension
plan: "02"
subsystem: data-schema
tags: [types, schema, article-registry, typescript, import-type]
dependency_graph:
  requires:
    - src/types/article.ts (Author, BibliographyEntry, Article, ArticleRegistry — created in Plan 06-01)
  provides:
    - src/pages/devliot-home-page.ts (Article import from centralised type module)
    - src/pages/devliot-article-page.ts (ArticleRegistry annotation at .json() boundary)
  affects:
    - Phase 09 (per-article authors byline) — Article.authors now type-enforced at fetch boundary
    - Phase 10 (bibliography rendering) — Article.bibliography now type-enforced at fetch boundary
tech_stack:
  added: []
  patterns:
    - import type (verbatimModuleSyntax-compatible type-only imports)
    - Explicit .json() type annotation for tsc enforcement at deserialization boundaries
key_files:
  created: []
  modified:
    - src/pages/devliot-home-page.ts
    - src/pages/devliot-article-page.ts
decisions:
  - "Use { articles: Article[] } inline annotation in home page (not ArticleRegistry) — avoids importing an additional type for a component that only needs the array (per plan)"
  - "Remove inline (a: { slug: string }) cast in article page find() callback — TypeScript infers Article from ArticleRegistry.articles array type"
metrics:
  duration: "~6 minutes"
  completed: "2026-04-15"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 2
---

# Phase 06 Plan 02: Type Consumer Wiring Summary

**One-liner:** Wired devliot-home-page.ts and devliot-article-page.ts to import from the centralised src/types/article.ts module, replacing an inline interface and two untyped .json() calls with explicit tsc-enforced type annotations.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire devliot-home-page.ts to centralised Article type | 12d8031 | src/pages/devliot-home-page.ts |
| 2 | Wire devliot-article-page.ts to centralised ArticleRegistry type | 9994a86 | src/pages/devliot-article-page.ts |
| 3 | Full build and Playwright regression | — (verification only) | — |

## Verification Results

- `npx tsc --noEmit` exits 0 after both changes
- `npm run build` exits 0 (all 5 pipeline steps: enrich, search-index, tsc, vite build, OG pages)
- `npx playwright test --project=chromium` — 40/41 pass; 1 pre-existing failure unrelated to this plan (see Deferred Items)
- `src/pages/devliot-home-page.ts` has no inline `interface Article` — uses `import type { Article }` from `src/types/article.ts`
- `src/pages/devliot-article-page.ts` has `const registry: ArticleRegistry = await regRes.json()`

## What Was Built

**`src/pages/devliot-home-page.ts`** — Two changes:
1. Removed inline `interface Article { slug, title, date, category, tags }` block (5 fields, 7 lines)
2. Added `import type { Article } from '../types/article.js'` after existing imports
3. Changed `const data = await res.json()` to `const data: { articles: Article[] } = await res.json()` — tsc now checks all field access on articles fetched from index.json

**`src/pages/devliot-article-page.ts`** — Two changes:
1. Added `import type { ArticleRegistry } from '../types/article.js'` after existing imports
2. Changed `const registry = await regRes.json()` to `const registry: ArticleRegistry = await regRes.json()` — tsc now enforces the full Article schema on `meta` field access (tags, category, date, readingTime)
3. Removed redundant `(a: { slug: string })` cast from `.find()` callback — inferred as `Article` from `ArticleRegistry.articles` array type

Both files now use `import type` (not `import`) per `verbatimModuleSyntax: true` tsconfig requirement.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both consumer files now have full type enforcement at .json() boundaries.

## Threat Flags

None. This plan modifies only TypeScript type annotations — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. T-06-04 disposition unchanged (compile-time assertion, not runtime validation — accepted per plan threat model).

## Self-Check: PASSED

- [x] `src/pages/devliot-home-page.ts` contains `import type { Article } from '../types/article.js'`
- [x] `src/pages/devliot-home-page.ts` does NOT contain `interface Article {`
- [x] `src/pages/devliot-home-page.ts` has `const data: { articles: Article[] } = await res.json()`
- [x] `src/pages/devliot-article-page.ts` contains `import type { ArticleRegistry } from '../types/article.js'`
- [x] `src/pages/devliot-article-page.ts` has `const registry: ArticleRegistry = await regRes.json()`
- [x] Commit `12d8031` exists (feat(06-02): wire devliot-home-page to centralised Article type)
- [x] Commit `9994a86` exists (feat(06-02): wire devliot-article-page to centralised ArticleRegistry type)
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run build` exits 0
- [x] 40/41 Playwright tests pass; 1 pre-existing failure documented in deferred-items.md
