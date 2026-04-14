---
phase: 04-navigation-discovery
plan: 01
subsystem: routing-search
tags: [hash-router, flexsearch, search-index, query-params]
dependency_graph:
  requires: []
  provides: [hash-router-query-params, search-data-json, flexsearch-installed]
  affects: [src/utils/hash-router.ts, scripts/build-search-index.mjs, public/search-data.json, package.json]
tech_stack:
  added: [flexsearch@0.8.x]
  patterns: [hash-fragment-query-params, build-time-search-index]
key_files:
  created:
    - scripts/build-search-index.mjs
  modified:
    - src/utils/hash-router.ts
    - package.json
    - package-lock.json
    - .gitignore
decisions:
  - "public/search-data.json added to .gitignore as generated build artifact"
  - "FlexSearch installed as runtime dependency (used at client runtime for querying)"
metrics:
  duration: ~8min
  completed: 2026-04-14T12:28:51Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 04 Plan 01: HashRouter Query Params + FlexSearch Infrastructure Summary

**One-liner:** HashRouter extended to parse `?tag=Java`-style query params from hash fragments, FlexSearch installed, and build-time search index generation producing `public/search-data.json` from stripped article HTML.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend HashRouter with query param parsing | 1196a76 | src/utils/hash-router.ts |
| 2 | Install FlexSearch, create build script, generate search-data.json | 132edc9 | package.json, package-lock.json, scripts/build-search-index.mjs, .gitignore |

## What Was Built

### Task 1: HashRouter Query Param Parsing

`src/utils/hash-router.ts` now splits the hash fragment on `?` before route matching:

- `private currentQuery = new URLSearchParams()` stores parsed query params
- `_onHashChange` extracts path part (before `?`) and query part (after `?`) separately
- Route matching receives only the path portion — existing routes (`/`, `/article/:slug`) are unaffected
- `getQuery(): URLSearchParams` is exposed publicly for consumers to read filter/search params
- Navigation to `/#/?tag=Java` routes to home (`/`) with `getQuery().get('tag')` returning `"Java"`

### Task 2: FlexSearch + Build Script

- `flexsearch@0.8.212` added to `dependencies` in `package.json`
- `scripts/build-search-index.mjs` reads `public/articles/index.json`, strips HTML tags from each article's `index.html`, and writes `public/search-data.json` with entries containing `{ slug, title, date, category, tags, body }`
- Build script integrated into `npm run build`: `node scripts/build-search-index.mjs && tsc && vite build`
- `public/search-data.json` added to `.gitignore` (generated artifact, not source)
- Verified: 1 article indexed, body length 2323 characters of stripped text

## Verification Results

- `npx tsc --noEmit`: passed (0 errors)
- `node scripts/build-search-index.mjs`: produces valid search-data.json with all required keys
- `npm run build`: completed successfully (search script + tsc + vite build all pass)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The search data generation is fully wired. FlexSearch runtime indexing will be implemented in a subsequent plan.

## Threat Flags

No new security-relevant surface beyond what was modeled in the plan's threat register.

## Self-Check: PASSED

- [x] `src/utils/hash-router.ts` exists and contains `getQuery()`, `currentQuery`, `raw.indexOf('?')`, `new URLSearchParams(queryPart)`
- [x] `scripts/build-search-index.mjs` exists as valid ESM with `import { readFileSync, writeFileSync } from 'fs'`
- [x] `public/search-data.json` generated with 1 entry containing all required keys
- [x] Commit 1196a76 exists (Task 1)
- [x] Commit 132edc9 exists (Task 2)
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run build` completes without errors
