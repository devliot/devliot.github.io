# Deferred Items — Phase 06 Data Schema Extension

## Pre-existing Test Failure (out of scope)

**Test:** `tests/article-metadata.spec.ts:100 — META-01: OG page contains redirect script to hash URL`

**Status:** Pre-existing failure on main branch before Plan 06-02 changes. Verified by running the test on the main branch directly.

**Root cause:** Test expects single-quoted string `window.location.replace('/#/article/01-demo-article')` but `build-og-pages.mjs` generates double-quoted `window.location.replace("/#/article/01-demo-article")`. Quote style mismatch between test expectation and actual build output.

**Impact:** Zero — functional behavior is identical. The redirect script works correctly; only the quote style differs.

**Scope:** This is unrelated to Phase 06 schema changes (Article types, ArticleRegistry). Plan 06-02 modifies only TypeScript type annotations in `devliot-home-page.ts` and `devliot-article-page.ts`.

**Resolution:** Fix `build-og-pages.mjs` to use single quotes, or update the test to use double quotes. Should be addressed in a dedicated fix plan (not Phase 06 scope).
