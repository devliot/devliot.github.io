# Phase 5: Article Metadata - Research

**Researched:** 2026-04-14
**Domain:** Open Graph / Twitter Card meta tags, reading time estimation, SPA static HTML generation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Build-time per-article HTML pages — at build time, generate a dedicated HTML file per article containing OG and Twitter Card meta tags in `<head>`. Social media crawlers see per-article title, description, and image without executing JavaScript.
- **D-02:** Article descriptions are hand-written — add a `description` field to `index.json` per article. Authors write a short summary (~160 chars) for each article. Used for `og:description` and `twitter:description`.
- **D-03:** Per-article static OG image — each article provides its own `og-image.png` (or similar) in its directory. An `image` field in `index.json` references it. Used for `og:image` and `twitter:image`.
- **D-04:** Metadata line above article content — a subtle line showing publication date and reading time (e.g. "April 11, 2026 · 5 min read") rendered by `devliot-article-page` above the article body, below the title area.
- **D-05:** Long date format: "April 11, 2026" — human-readable, unambiguous, standard for English-language blogs.
- **D-06:** Estimated reading time calculated and displayed per article (e.g. "5 min read"). Calculation approach is Claude's discretion.

### Claude's Discretion
- Build-time HTML generation approach (Vite plugin, build script, or post-build step)
- URL scheme for per-article OG pages (how they integrate with hash routing + GitHub Pages)
- Reading time calculation method (word count at build time vs runtime)
- OG image dimensions and fallback handling
- Twitter Card type (`summary` vs `summary_large_image`)
- Metadata line styling within grayscale palette
- `index.json` schema additions (description, image fields)

### Deferred Ideas (OUT OF SCOPE)
- Article sources/references (bibliography or reference links at the bottom of articles). Deferred to v2.
- Article co-authors (name/pseudo + link to GitHub/LinkedIn per article). Deferred to v2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| META-01 | Open Graph / Twitter Card tags per article — pasting URL into validator shows correct title, description, image | D-01 through D-03: build-time static HTML pages with OG tags in `<head>` is the standard approach for SPAs on static hosting |
| META-02 | Estimated reading time displayed per article (e.g. "5 min read") | D-06: calculated at build time from HTML word count (strip tags, count words, divide by WPM) and stored in `index.json` |
| META-03 | Publication date displayed on article page in human-readable format (e.g. "April 11, 2026") | D-04/D-05: `devliot-article-page` reads `date` from `index.json`, formats with `Intl.DateTimeFormat`, renders in metadata line |
</phase_requirements>

## Summary

Phase 5 enriches the blog with two categories of metadata: (1) social sharing tags (OG/Twitter Card) so link previews render correctly, and (2) contextual reading metadata (date + reading time) displayed inline on article pages.

The core technical challenge is that social media crawlers do not execute JavaScript. This site uses hash-based routing (`/#/article/slug`), so every URL resolves to the same `index.html`. Crawlers see only the generic `<head>` — no per-article title, description, or image. The locked decision (D-01) solves this by generating a dedicated static HTML file per article at build time, placed at a path crawlers can fetch (e.g., `/devliot/articles/01-demo-article/og.html`). These files contain the correct OG/Twitter Card meta tags plus a JS redirect to the actual hash URL for human visitors.

Reading time (D-06) should be computed at build time: strip HTML tags from `articles/{slug}/index.html`, count words, divide by 238 WPM (research-backed median for technical reading), round up to the nearest minute. Store `readingTime` in `index.json` so no runtime computation is needed. Date formatting (D-05) is pure runtime: use `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })` on the ISO date string already in `index.json`.

**Primary recommendation:** Extend the existing `build-search-index.mjs` pattern into a second Node.js build script (`scripts/build-og-pages.mjs`) that reads `index.json`, computes reading time, updates `index.json` with `readingTime`, and writes one static HTML file per article into `dist/articles/{slug}/og.html`. Extend `devliot-article-page.ts` to render the metadata line using data already fetched from `index.json`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `Intl.DateTimeFormat` | Built-in | Date formatting | Zero-dependency, handles locale, formats "April 11, 2026" natively. No library needed. |
| Node.js `fs` + string template | Built-in | Static OG HTML generation at build time | Already used by `build-search-index.mjs`. Consistent with established project pattern. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `reading-time` (npm) | 1.5.0 | NPM library for reading time computation | Optional — functionality is trivial enough to implement inline (strip tags, count words, divide by WPM). Use only if the planner prefers a dependency over 5 lines of code. [VERIFIED: npm registry] |
| `html-to-text` (npm) | 9.0.5 | Strip HTML tags for word counting | Optional — `replace(/<[^>]+>/g, ' ')` already used in `build-search-index.mjs`. Same project pattern applies. [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Build-time static OG HTML pages | Serverless function / edge worker | Serverless is out of scope (GitHub Pages static-only constraint) |
| Build-time static OG HTML pages | Dynamic `document.title` + meta injection (client-side) | Crawlers don't execute JS — does not satisfy META-01 |
| Build-time word count in `index.json` | Runtime word count in `devliot-article-page.ts` | Runtime requires an extra DOM read cycle after article HTML loads; build-time is cleaner and zero cost at runtime |

**Installation:** No new packages required. The implementation uses:
- Built-in Node.js `fs`, `path`
- Existing `public/articles/index.json`
- Existing `public/articles/{slug}/index.html`
- Existing Lit + TypeScript toolchain

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── build-search-index.mjs     # existing — search data
└── build-og-pages.mjs         # new — OG HTML + reading time

public/
└── articles/
    ├── index.json              # extended with description, image, readingTime fields
    └── 01-demo-article/
        ├── index.html          # article body (unchanged)
        ├── og-image.png        # new — per-article OG image (author-provided)
        └── meta.json           # existing (currently unused — slug/title/date/category/tags duplicated here)

dist/                           # Vite build output (not committed)
└── articles/
    └── 01-demo-article/
        └── og.html             # generated — crawler-visible, redirects humans to hash URL

src/pages/
└── devliot-article-page.ts     # extended — reads date, readingTime; renders metadata line

src/styles/
└── article.css                 # extended — .article-meta styles
```

### Pattern 1: Build-time OG HTML Page Generation

**What:** A Node.js script that reads `index.json`, writes one minimal HTML file per article into `dist/articles/{slug}/og.html` containing all OG/Twitter Card meta tags plus a JS redirect to `/#/article/{slug}`.

**When to use:** Any time a static host cannot execute server-side code but social sharing requires per-URL meta tags.

**Why `dist/` directly (not `public/`):** These files must be in the build output. Writing to `public/` would include them in git. Since `dist/` is gitignored and regenerated on every build, the script runs after `vite build` completes. The existing build script pattern writes to `public/` first (which Vite then copies). For OG pages, writing to `dist/` post-Vite-build is cleaner.

**Example:**
```javascript
// scripts/build-og-pages.mjs
// Source: established project pattern from build-search-index.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = '/devliot/';
const DIST = 'dist';

const registry = JSON.parse(readFileSync('public/articles/index.json', 'utf8'));

for (const article of registry.articles) {
  const { slug, title, description = '', image = '' } = article;

  const absoluteImage = image
    ? `https://devliot.github.io${BASE_URL}${image}`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="https://devliot.github.io${BASE_URL}#/article/${slug}" />
  ${absoluteImage ? `<meta property="og:image" content="${absoluteImage}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${absoluteImage ? `<meta name="twitter:image" content="${absoluteImage}" />` : ''}
  <script>window.location.replace('${BASE_URL}#/article/${slug}');</script>
</head>
<body></body>
</html>`;

  const dir = join(DIST, 'articles', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'og.html'), html, 'utf8');
}
```

**package.json build script update:**
```json
"build": "node scripts/build-search-index.mjs && tsc && vite build && node scripts/build-og-pages.mjs"
```

Note: `build-og-pages.mjs` runs AFTER `vite build` because it writes to `dist/` directly.

### Pattern 2: Reading Time at Build Time

**What:** After Vite build (or before, writing back to `public/articles/index.json`), strip HTML tags from the article body, count words, divide by WPM.

**Recommended approach:** Compute `readingTime` inside `build-og-pages.mjs` (reuse the same script) and also patch `public/articles/index.json` with the computed `readingTime` values. This way `devliot-article-page.ts` gets it from the same JSON fetch it already makes.

**Alternative:** Write reading time into `index.json` inside `build-search-index.mjs` (which already reads each article's HTML). This keeps data generation together.

**Example:**
```javascript
// Inside build-og-pages.mjs or build-search-index.mjs
function computeReadingTime(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(w => w.length > 0).length;
  const minutes = Math.ceil(words / 238);
  return minutes;
}
```

**WPM standard:** 238 WPM is the research-backed median for adult technical reading (per Rayner et al. 2016, commonly used by Medium and dev.to). [ASSUMED — cross-referenced with multiple implementations; exact value varies 200–265 across sources]

### Pattern 3: Runtime Date Formatting

**What:** `Intl.DateTimeFormat` converts the ISO date string (`"2026-04-11"`) stored in `index.json` to "April 11, 2026" at runtime in the Lit component.

**When to use:** Any time you have an ISO date string and need a locale-specific, human-readable output. Zero runtime cost, no library.

**Example:**
```typescript
// Inside devliot-article-page.ts
// Source: MDN Intl.DateTimeFormat (built-in Web API)
private _formatDate(iso: string): string {
  // Append T12:00:00 to avoid UTC midnight timezone shift
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
```

**Critical pitfall:** `new Date('2026-04-11')` is parsed as UTC midnight. In time zones west of UTC (e.g. UTC-5), this renders as April 10. Always append `T12:00:00` (or `T00:00:00` local) to anchor the date to local noon. [VERIFIED: MDN Date parsing]

### Pattern 4: Metadata Line in devliot-article-page.ts

**What:** A single `<p class="article-meta">` rendered between the `<article>` body and the tag nav, using data already available from the `index.json` fetch.

**When to use:** After `_loadArticle()` populates metadata from `index.json`, extend the `@state` properties to include `_date` and `_readingTime`.

**Example:**
```typescript
// State additions to devliot-article-page.ts
@state() private _date = '';
@state() private _readingTime = 0;

// In _loadArticle() index.json branch:
if (meta) {
  this._tags = meta.tags || [];
  this._category = meta.category || '';
  this._date = meta.date || '';
  this._readingTime = meta.readingTime || 0;
}

// In render():
${this._date ? html`
  <p class="article-meta">
    ${this._formatDate(this._date)}
    ${this._readingTime > 0 ? html`&nbsp;·&nbsp;${this._readingTime} min read` : ''}
  </p>
` : ''}
```

### Pattern 5: index.json Schema Extension

**What:** Add `description`, `image`, and `readingTime` fields to each article entry.

**Current schema:**
```json
{
  "articles": [
    {
      "slug": "01-demo-article",
      "title": "Article Components Demo",
      "date": "2026-04-11",
      "category": "Tutorial",
      "tags": ["demo", "components", "reference"]
    }
  ]
}
```

**Extended schema:**
```json
{
  "articles": [
    {
      "slug": "01-demo-article",
      "title": "Article Components Demo",
      "date": "2026-04-11",
      "category": "Tutorial",
      "tags": ["demo", "components", "reference"],
      "description": "A 160-char author-written summary for OG/Twitter Card sharing.",
      "image": "articles/01-demo-article/og-image.png",
      "readingTime": 5
    }
  ]
}
```

`image` is a relative path from the site root (prefixed with `BASE_URL` when constructing absolute URLs for OG tags). `readingTime` is injected by the build script; authors do not write it manually.

### Anti-Patterns to Avoid

- **Client-side document.head manipulation for OG tags:** Setting `document.querySelector('meta[property="og:title"]')` at runtime does not help crawlers. Social bots do not execute JavaScript. [VERIFIED: research consensus]
- **`new Date(isoString)` without time component:** Parsed as UTC; renders wrong date in negative-UTC time zones. Always use `new Date(`${iso}T12:00:00`)`.
- **Writing OG pages to `public/`:** These would be committed to git and could drift out of sync. Write to `dist/` post-build.
- **Using `og:url` pointing to the crawler page itself:** The canonical URL should point to the SPA hash URL (`/#/article/slug`), not the OG page URL. The OG page is a sharing artifact, not the canonical address.
- **`summary` Twitter Card type instead of `summary_large_image`:** With `summary`, Twitter shows a small thumbnail. With `summary_large_image` (requires image >= 300×157), the card is visually prominent. Given D-03 provides per-article images at 1200×630, `summary_large_image` is correct. [VERIFIED: Twitter/X card documentation via research]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date formatter | `Intl.DateTimeFormat` (built-in) | Handles locale, month names, edge cases. One line. |
| HTML tag stripping for word count | Custom regex parser | `replace(/<[^>]+>/g, ' ')` (already in codebase) | Already in `build-search-index.mjs`. Reuse. |
| Reading time library | Custom NPM install | Inline 3-line function | `reading-time@1.5.0` is correct but unnecessary for this use case. |
| OG page HTML generation | Vite SSR / prerender plugin | Node.js script writing to `dist/` | Matches existing `build-search-index.mjs` pattern. No new tooling. |

**Key insight:** This phase adds minimal new code surface. Every problem maps to a built-in or an existing project pattern.

## Common Pitfalls

### Pitfall 1: Hash URLs and Social Crawlers

**What goes wrong:** The article URL is `https://devliot.github.io/devliot/#/article/01-demo-article`. When a crawler fetches this, the fragment (`#...`) is not sent to the server. The server returns `index.html`, which has no OG tags. The card shows "DEVLIOT" as the title with no description or image.

**Why it happens:** HTTP specification: fragments are browser-only, never sent in requests. The server always sees the bare path (`/devliot/`).

**How to avoid:** Generate a separate HTML file at a real path, e.g. `/devliot/articles/01-demo-article/og.html`, that contains the correct OG tags. When sharing, share this URL (or instruct authors to use it). Alternatively, social sharing URLs could link directly to `og.html` which redirects humans to the hash SPA.

**Warning signs:** When pasting the hash URL into card validators (opengraph.to, LinkedIn inspector), the preview shows generic site title/description.

**Note on URL strategy:** The locked decision (D-01) specifies generating the OG pages at build time. The planner must decide whether the shareable URL is `og.html` or `/#/article/slug`. Since most users share the browser URL (the hash URL), the practical approach is: OG page lives at `/devliot/articles/{slug}/og.html`, but the `og:url` tag points to the hash URL for canonical purposes. Card validators should be run against `og.html` URLs.

### Pitfall 2: Date Parsing UTC vs Local

**What goes wrong:** `new Date('2026-04-11').toLocaleDateString()` renders as "April 10, 2026" in UTC-5.

**Why it happens:** ISO date strings without time are parsed as UTC midnight per ECMAScript spec. In UTC-5, that is April 10 at 7pm local.

**How to avoid:** Always parse as `new Date('2026-04-11T12:00:00')`. This anchors the date to local noon, correct in all UTC offsets between UTC-12 and UTC+12.

**Warning signs:** Unit tests on a UTC machine pass, but the rendered date is one day off for users in the Americas.

### Pitfall 3: Missing `image` or `description` Field — Graceful Degradation

**What goes wrong:** If an article in `index.json` lacks `description` or `image`, the build script crashes with a property access error, or OG tags emit `content=""` which some platforms treat as broken.

**Why it happens:** New fields added to schema but author forgot to fill them in.

**How to avoid:** Build script must guard: `const desc = article.description || ''`. Omit `og:image` tag entirely when no image path is present rather than emitting an empty `content` attribute. Test with the demo article before deploying.

**Warning signs:** Build log shows undefined in OG HTML output. Card validators show missing image warning.

### Pitfall 4: Absolute vs Relative OG Image URLs

**What goes wrong:** `og:image` with a relative URL (`/devliot/articles/...`) is not fetched by some crawlers (Facebook requires absolute URLs per their documentation).

**Why it happens:** OG spec requires absolute URLs for `og:image`.

**How to avoid:** In the build script, construct the absolute image URL: `https://devliot.github.io${BASE_URL}${article.image}`. The `BASE_URL` is `/devliot/` (from vite.config.ts). [CITED: Open Graph Protocol specification]

### Pitfall 5: Build Script Order

**What goes wrong:** `build-og-pages.mjs` runs before `vite build`, writes to `dist/` — then `vite build` cleans `dist/` and overwrites everything.

**Why it happens:** Vite clears `outDir` at the start of every build.

**How to avoid:** The script MUST run after `vite build`. Correct order: `node scripts/build-search-index.mjs && tsc && vite build && node scripts/build-og-pages.mjs`. [VERIFIED: Vite build config docs — `build.emptyOutDir` defaults to `true`]

## Code Examples

Verified patterns from official sources:

### Intl.DateTimeFormat — "April 11, 2026"
```typescript
// Source: MDN Web Docs — Intl.DateTimeFormat (built-in Web API)
function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d); // "April 11, 2026"
}
```

### Reading Time Computation
```javascript
// Source: established codebase pattern (build-search-index.mjs)
function computeReadingTime(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(w => w.length > 0).length;
  return Math.ceil(words / 238); // returns integer minutes
}
```

### Minimal OG HTML Template
```html
<!-- Generated by build-og-pages.mjs for each article -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>{title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:url" content="https://devliot.github.io/devliot/#/article/{slug}" />
  <meta property="og:image" content="https://devliot.github.io/devliot/articles/{slug}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="https://devliot.github.io/devliot/articles/{slug}/og-image.png" />
  <script>window.location.replace('/devliot/#/article/{slug}');</script>
</head>
<body></body>
</html>
```

### OG Image Specification
```
Dimensions: 1200 × 630 pixels (universal aspect ratio 1.91:1)
Format: PNG preferred for graphics/text; JPEG for photos
Filename: og-image.png (per directory, e.g. articles/01-demo-article/og-image.png)
Max size: < 8MB (Facebook limit); aim < 500KB for fast loading
```
[VERIFIED: Multiple sources confirm 1200×630 as the universal OG image size for Facebook, LinkedIn, Twitter/X]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Twitter's official Card Validator tool | Third-party validators (opengraph.to, ogpreview.app) | 2022 (Twitter deprecated official tool) | Must use third-party validators for testing |
| `twitter:card: summary` (small thumbnail) | `twitter:card: summary_large_image` (prominent hero image) | Standard since ~2014, universally adopted | Requires 1200×630 image; dramatically improves CTR |
| Static `og:title` in SPA root `index.html` | Per-route static HTML files or SSR | 2019–2022 (as SPAs matured) | The root `index.html` approach fails for multi-article sites |

**Deprecated/outdated:**
- Twitter official Card Validator: Deprecated 2022 — use opengraph.to or ogpreview.app instead.
- `og:image:width` / `og:image:height` tags: Still valid but not required when using standard 1200×630. Modern crawlers detect dimensions automatically.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 238 WPM is the best baseline for reading time estimation (vs. 200 or 265 used by some tools) | Architecture Patterns — Pattern 2 | ±1 min on average; acceptable; reading time is an estimate regardless |
| A2 | GitHub Pages serves files from `dist/` root, so `/devliot/articles/01-demo-article/og.html` is a valid crawlable URL | Architecture Patterns — Pattern 1 | If path is wrong, OG pages are not reachable; verify after first deploy |

## Open Questions

1. **Where should authors be directed to share: hash URL or og.html URL?**
   - What we know: hash URL is what the browser shows; og.html is what crawlers need
   - What's unclear: workflow for authors — do they manually share `og.html`? Or is the hash URL sufficient?
   - Recommendation: The planner should include a note in the demo article's `og.html` that it auto-redirects. Card validators should be tested against `og.html`. The hash URL remains the canonical user-facing URL.

2. **Should `index.html` (SPA root) gain generic fallback OG tags?**
   - What we know: Currently no OG tags in root `index.html`. The CONTEXT.md mentions this as a consideration.
   - What's unclear: Whether the planner should include a task for fallback OG tags on `index.html`
   - Recommendation: Yes — add minimal fallback `og:title: "DEVLIOT"`, `og:description`, `og:type: website` to `index.html`. Low effort, handles any non-article URL shared socially.

3. **Should `readingTime` be computed by `build-search-index.mjs` (which already reads article HTML) or by the new `build-og-pages.mjs`?**
   - What we know: `build-search-index.mjs` already strips HTML and reads every article. `build-og-pages.mjs` would need to do the same.
   - What's unclear: Whether to merge or keep scripts separate
   - Recommendation: Compute reading time inside `build-og-pages.mjs` and write it back to `public/articles/index.json` before Vite build copies it to `dist/`. This makes `build-og-pages.mjs` responsible for all OG enrichment. Run order: `build-og-pages.mjs` (enriches `index.json`) → `build-search-index.mjs` (reads enriched `index.json`) → `vite build` → `build-og-pages.mjs` writes OG HTML to `dist/`. Actually, simpler: run `build-og-pages.mjs` FIRST (writing `readingTime` back to `public/articles/index.json`), then `build-search-index.mjs`, then `vite build`, then the OG HTML generation step (which can be a second pass of the same script or a separate script). See Wave 0 for clean sequencing.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build scripts | ✓ | v22.14.0 | — |
| npm | Package management | ✓ | 10.9.2 | — |
| `public/articles/index.json` | OG page + reading time generation | ✓ | — | — |
| `public/articles/{slug}/index.html` | Reading time computation | ✓ | — (demo article exists) | — |
| Playwright + Chromium | E2E tests | ✓ | @playwright/test 1.59.1 | — |

No missing dependencies. All tools available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | `playwright.config.ts` |
| Quick run command | `npm run test-e2e -- --project=chromium` |
| Full suite command | `npm run test-e2e -- --project=chromium` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| META-01 | `dist/articles/01-demo-article/og.html` exists and contains `og:title` with correct value | smoke (file check + DOM parse) | `npm run test-e2e -- --project=chromium` | ❌ Wave 0 |
| META-01 | `og:description` content matches `index.json` description | smoke | Same | ❌ Wave 0 |
| META-01 | `og:image` content is an absolute URL | smoke | Same | ❌ Wave 0 |
| META-01 | `twitter:card` = `summary_large_image` | smoke | Same | ❌ Wave 0 |
| META-02 | Article page shows "X min read" text above article body | e2e (Playwright) | Same | ❌ Wave 0 |
| META-03 | Article page shows "April 11, 2026" (long format) for demo article | e2e (Playwright) | Same | ❌ Wave 0 |
| META-03 | Date format matches `Intl.DateTimeFormat` long format, not ISO | e2e (Playwright) | Same | ❌ Wave 0 |

**Note on META-01 testing:** Playwright operates on the live dev server (hash-based SPA). Testing OG page content requires either: (a) navigating directly to `http://localhost:5173/devliot/articles/01-demo-article/og.html` and asserting `<meta>` tags in `document.head`, or (b) running against the built `dist/` with `vite preview`. Option (a) is simpler since Vite dev server serves `public/` content. However, OG pages are generated into `dist/` (post-build), so the test must use `vite preview` for META-01 assertions. Option (b) requires adjusting the playwright baseURL for that test, or running a separate `preview` test command.

**Recommended approach:** META-01 Playwright tests should use `npm run preview` (port 4173) and assert `document.head` meta tags by navigating to the og.html path. META-02 and META-03 can use the standard dev server.

### Sampling Rate
- **Per task commit:** `npm run test-e2e -- --project=chromium`
- **Per wave merge:** `npm run test-e2e -- --project=chromium`
- **Phase gate:** Full Playwright suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/article-metadata.spec.ts` — covers META-01, META-02, META-03
- [ ] OG pages test likely needs `vite preview` (port 4173) — either modify `playwright.config.ts` to support multiple base URLs, or use `page.goto('http://localhost:4173/...')` with absolute URL in OG tests

*(If META-01 tests against the preview build, the CI workflow will also need `npm run build` before test execution. The planner should note this in the Wave 0 task.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Escape HTML special chars in OG template (`<`, `>`, `"`, `&`) |
| V6 Cryptography | no | — |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via article title/description in OG HTML template | Tampering | HTML-escape all author-provided strings before injecting into OG HTML (`escapeHtml()` function in build script) |
| Path traversal via slug in OG page output path | Tampering | Slug is already validated with `SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/` in `devliot-article-page.ts`; apply same guard in build script |

**Note:** The build scripts run in a trusted build environment, not in user request context. XSS risk is low (build-time, no user input). Still, HTML-escaping titles and descriptions in the generated OG HTML is correct practice and trivial to implement.

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- MDN Web Docs — Date parsing behavior: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
- Open Graph Protocol specification: https://ogp.me/
- Twitter/X Card documentation: https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- Vite build config (`emptyOutDir`): https://vite.dev/config/build-options

### Secondary (MEDIUM confidence)
- OG image dimensions (1200×630 universal): https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide
- SPA OG tags challenge and static HTML workaround: https://medium.com/@_jonas/dynamic-social-previews-for-your-spa-and-htmlrewriter-8423cdebd7e6
- Twitter deprecated its official Card Validator (2022): https://socialrails.com/free-tools/x-tools/card-validator

### Tertiary (LOW confidence)
- 238 WPM as reading speed baseline: various blog posts (dev.to, w3collective, Medium) — not from a single authoritative source; acceptable for ±1 min estimation

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — no new libraries needed; all solutions use built-ins or existing patterns
- Architecture: HIGH — patterns verified against existing codebase, locked decisions are clear
- Pitfalls: HIGH — UTC date pitfall and Vite emptyOutDir are documented Web API / Vite behavior
- OG URL strategy: MEDIUM — correct approach well-established; testing against card validators required post-deploy

**Research date:** 2026-04-14
**Valid until:** 2026-10-14 (OG/Twitter Card spec is very stable; Vite build API stable; Intl built-in)
