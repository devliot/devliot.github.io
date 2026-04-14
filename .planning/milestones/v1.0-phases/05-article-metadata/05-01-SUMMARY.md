---
phase: 05-article-metadata
plan: "01"
subsystem: build-infrastructure
tags: [og-metadata, build-pipeline, reading-time, social-sharing]
dependency_graph:
  requires: []
  provides: [article-og-html-pages, index-json-reading-time, fallback-og-tags]
  affects: [dist-output, public-articles-index]
tech_stack:
  added: []
  patterns: [build-time-html-generation, two-phase-build-pipeline, html-escaping-security]
key_files:
  created:
    - scripts/build-og-pages.mjs
    - public/articles/01-demo-article/og-image.png
  modified:
    - public/articles/index.json
    - package.json
    - index.html
decisions:
  - "Two-phase build script (--enrich before vite, --generate after vite) to prevent emptyOutDir from deleting OG HTML files"
  - "readingTime computed at 238 WPM using ceil(wordCount/WPM), injected into index.json at build time not authored manually"
  - "Placeholder OG image created as minimal 1x1 PNG since ImageMagick not available; author will replace with 1200x630 design"
  - "twitter:card=summary for root index.html (no site-wide image), summary_large_image for per-article pages with og-image.png"
metrics:
  duration: "~38 minutes"
  completed_date: "2026-04-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 3
requirements: [META-01, META-02]
---

# Phase 05 Plan 01: Article Metadata Data Layer and Build Infrastructure Summary

Build-time OG HTML page generation with per-article reading time computation, extended index.json schema, and fallback OG tags for the SPA root.

## What Was Built

### Task 1: Extended index.json schema + OG image placeholder

`public/articles/index.json` extended with two new fields for the demo article:
- `description`: hand-authored ~160-char summary used for `og:description` and `twitter:description`
- `image`: relative path `articles/01-demo-article/og-image.png` pointing to the OG image asset

`readingTime` intentionally omitted from manual authoring — it is injected by the build script at build time.

A minimal valid 1x1 PNG was created at `public/articles/01-demo-article/og-image.png` as a placeholder (ImageMagick not available). The file is a valid PNG (67 bytes) that satisfies the OG tag requirement. The author will replace it with a proper 1200x630 image.

### Task 2: build-og-pages.mjs (120 lines)

`scripts/build-og-pages.mjs` implements two CLI modes:

**`--enrich` mode (Operation A):**
1. Reads `public/articles/index.json`
2. For each article, reads `public/articles/{slug}/index.html`
3. Strips HTML tags, counts words, computes `Math.ceil(words / 238)` reading time
4. Injects `readingTime` integer into each article entry
5. Writes enriched `index.json` back to `public/articles/index.json`

Result for demo article: `readingTime: 2` (2 minutes at 238 WPM)

**`--generate` mode (Operation B):**
1. Reads (enriched) `index.json`
2. For each article, generates `dist/articles/{slug}/og.html` with:
   - `og:type=article`, `og:title`, `og:description` (omitted if empty), `og:url`, `og:image` (omitted if no image)
   - `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
   - `<script>window.location.replace(...);</script>` for human browser redirect to SPA
   - Absolute image URLs: `https://devliot.github.io/devliot/{article.image}`

Security mitigations applied per threat model:
- `escapeHtml()` escapes `&`, `<`, `>`, `"` in all author-provided strings (T-05-01)
- `SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/` validates slugs before path construction (T-05-02)

### Task 3: Updated build pipeline + fallback OG tags

`package.json` build command updated to:
```
node scripts/build-og-pages.mjs --enrich && node scripts/build-search-index.mjs && tsc && vite build && node scripts/build-og-pages.mjs --generate
```

Order rationale: `--enrich` before `vite build` ensures `readingTime` is in the `dist/` copy of `index.json`; `--generate` after `vite build` prevents Vite's `emptyOutDir: true` from deleting the OG HTML files.

`index.html` gains fallback OG/Twitter Card tags for the SPA root (non-article URLs):
- `og:type=website`, `og:title=DEVLIOT`, `og:description`, `og:url`
- `twitter:card=summary` (not `summary_large_image` — no site-wide image)

Full `npm run build` succeeds end-to-end.

## Verification Results

All plan verification criteria passed:
1. `node scripts/build-og-pages.mjs --enrich` injects `readingTime: 2` into index.json
2. `npm run build` completes without errors
3. `dist/articles/01-demo-article/og.html` contains `og:title`, `og:description`, `twitter:card`, `summary_large_image`
4. `index.html` has fallback `og:type`, `og:title`, `og:description`, `twitter:card` tags
5. OG image URL is absolute: `https://devliot.github.io/devliot/articles/01-demo-article/og-image.png`

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- ImageMagick was not available for the 1200x630 OG image. Per plan instructions, a minimal 1x1 PNG placeholder was created instead. The plan explicitly allows this: "If no image generation tool is available, create a minimal valid PNG file (even 1x1 pixel) as the placeholder."

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 92e37e0 | feat(05-01): extend index.json schema with description/image fields and add OG image placeholder |
| Task 2 | b9c7a64 | feat(05-01): create build-og-pages.mjs with reading time computation and OG HTML generation |
| Task 3 | 30d2d07 | feat(05-01): update build pipeline and add fallback OG tags to index.html |

## Known Stubs

- `public/articles/01-demo-article/og-image.png` is a 1x1 pixel gray placeholder. Social platforms will show a card without a preview image until replaced with a proper 1200x630 design.

## Threat Flags

No new security surface introduced beyond what the threat model covers. `build-og-pages.mjs` generates static HTML files at build time with no network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `scripts/build-og-pages.mjs` exists: FOUND
- `public/articles/01-demo-article/og-image.png` exists: FOUND
- `dist/articles/01-demo-article/og.html` exists after build: FOUND
- Commit 92e37e0 exists: FOUND
- Commit b9c7a64 exists: FOUND
- Commit 30d2d07 exists: FOUND
