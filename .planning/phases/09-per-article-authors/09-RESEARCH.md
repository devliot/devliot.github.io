# Phase 9: Per-article Authors - Research

**Researched:** 2026-04-16
**Domain:** Lit 3 component extension, build-time JSON-LD generation, schema.org structured data
**Confidence:** HIGH

---

## Summary

Phase 9 is a low-risk, well-scoped extension of existing infrastructure. AUTHOR-01 is already done (the `Author` type and `authors` array in `index.json` were established in Phase 6). The two remaining requirements are:

- AUTHOR-02: render a byline `<p class="article-byline">` in `devliot-article-page.ts`, always showing at least the default "Devliot" author.
- AUTHOR-03: extend the existing `build-og-pages.mjs` script to inject a `<script type="application/ld+json">` block with `@type: BlogPosting` into each `og.html` page at build time.

No new runtime dependencies are needed. No new TypeScript types are needed — `Author` is already defined. The byline design contract is fully specified in `09-UI-SPEC.md`. The build script already owns `og.html` generation and only needs a new section added to its template.

**Primary recommendation:** Extend `devliot-article-page.ts` with a `_authors` state property and a `_renderByline()` helper, then extend `build-og-pages.mjs` `generateOgPages()` to emit JSON-LD within the existing HTML template. Two surgical edits, no new files except the Playwright test file.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Byline format: `par X` (1 author), `par X et Y` (2), `par X, Y et Z` (3+). French `et` before last.
- **D-02:** Byline renders on a **separate line below** `.article-meta` — its own `<p>` element, not appended inline.
- **D-03:** Authors with a `url` field → `<a href="{url}" target="_blank" rel="noopener">{name}</a>`. Authors without → plain text.
- **D-04:** Articles without `authors` (or empty array) show **`par Devliot`** linking to `https://github.com/devliot`. Never a missing byline.
- **D-05:** Default author is **NOT** injected into `index.json` — render-time fallback only.
- **D-06:** JSON-LD generated **at build time** — static `<script type="application/ld+json">` in `og.html`, not client-rendered.
- **D-07:** JSON-LD placed in **`dist/articles/{slug}/og.html`** (the existing OG page per article).
- **D-08:** Schema: `@type: BlogPosting`, fields: `headline`, `datePublished`, `author: Person[]` (fallback to Devliot), `description` (if present), `image` (if present), `publisher: Organization { name: "DEVLIOT", url: "https://devliot.github.io" }`.

### Claude's Discretion

- Exact byline styling (font-size, color, spacing) — use existing tokens (`--color-text-muted`, `--font-size-label`). Already specified in `09-UI-SPEC.md`.
- Build script implementation: standalone Node script, Vite plugin, or npm script. The existing `build-og-pages.mjs` pattern should be extended (not a new script).
- Whether JSON-LD includes the default Devliot author on articles with no declared authors.
- Exact `og.html` structure beyond the `<script>` block.

### Deferred Ideas (OUT OF SCOPE)

- Author profile pages
- Author avatars
- Author filtering/listing
- Home page logo malformation bug (Phase 8 header — separate bug, not Phase 9)
- AUTHOR-01 (already completed in Phase 6)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTHOR-01 | Article can declare `authors[]` with `name` + optional `url` in `index.json` | Already complete in Phase 6. `Author` interface and `authors?: Author[]` on `Article` both exist in `src/types/article.ts`. `index.json` demo article already has two authors. No work needed. |
| AUTHOR-02 | Author byline displays in article header alongside date and reading time | `devliot-article-page.ts` needs `_authors` state, extracted from the existing metadata fetch at lines 97-114. Byline rendered as `<p class="article-byline">` after `.article-meta`. CSS class added to `article.css`. Always rendered (fallback to default). |
| AUTHOR-03 | Each article emits JSON-LD `schema.org/BlogPosting` with `author: Person[]` in its OG page | `build-og-pages.mjs` `generateOgPages()` function extended to include `<script type="application/ld+json">` block in the existing HTML template. No new script — same file, same phase of the `npm run build` pipeline. |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Byline rendering | Browser / Client (Lit component) | — | State (`_authors`) lives in the Lit component, derived from the already-fetched `index.json` registry response |
| Author name + URL formatting | Browser / Client | — | Pure string/template logic inside the component; no server needed |
| JSON-LD generation | Build script (Node.js) | — | D-06 explicitly requires build-time, static output. Crawlers get stable HTML, not JS-rendered data |
| og.html structure | Build script (Node.js) | — | `build-og-pages.mjs` already owns this file; JSON-LD is a new section in its existing template |
| Author data source | Static file (`public/articles/index.json`) | — | Already populated in Phase 6; read by both the Lit component (runtime) and the build script (build time) |

---

## Standard Stack

### Core (no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lit` | 3.3.2 | Component state, rendering, conditional templates | Already installed. `@state()` decorator + `html` tagged template is the idiomatic pattern. [VERIFIED: package.json] |
| Node.js `fs` module | built-in | Read `index.json`, write `og.html` | Already used in `build-og-pages.mjs`. No new imports needed. [VERIFIED: scripts/build-og-pages.mjs] |
| `@playwright/test` | 1.59.1 | E2E tests for byline and JSON-LD assertions | Already installed. Per MEMORY.md, Playwright E2E preferred over manual verification. [VERIFIED: package.json] |

### No new runtime dependencies
Per STATE.md locked decision: "v2.0 uses zero new runtime dependencies — all features use existing Lit primitives + Web APIs." [VERIFIED: .planning/STATE.md]

### Installation
```bash
# No new packages needed
```

---

## Architecture Patterns

### System Architecture Diagram

```
npm run build
     │
     ├─ build-og-pages.mjs --enrich
     │     reads: public/articles/index.json
     │     writes: public/articles/index.json (readingTime updated, authors unchanged)
     │
     ├─ build-search-index.mjs
     │
     ├─ tsc && vite build
     │
     └─ build-og-pages.mjs --generate          ← AUTHOR-03 work here
           reads: public/articles/index.json
                  (includes authors[] per Phase 6)
           writes: dist/articles/{slug}/og.html
                  (existing OG meta + NEW JSON-LD <script> block)


Browser runtime                                 ← AUTHOR-02 work here
     │
     └─ devliot-article-page.ts
           fetches: /articles/index.json
           extracts: meta.authors → this._authors
           renders: <p class="article-byline"> par {formatted authors}
                    (always rendered — fallback to "Devliot" if empty)
```

### Recommended Project Structure (no new directories)
```
src/
├── pages/
│   └── devliot-article-page.ts  ← extend with _authors state + _renderByline()
├── styles/
│   └── article.css              ← add .article-byline rule
scripts/
└── build-og-pages.mjs           ← extend generateOgPages() with JSON-LD block
tests/
└── per-article-authors.spec.ts  ← new Playwright test file (Wave 0 gap)
```

### Pattern 1: Lit reactive state + conditional template rendering

The existing pattern in `devliot-article-page.ts` for metadata extraction (lines 97-114) and conditional rendering (lines 205-209) is the template to follow.

```typescript
// Source: src/pages/devliot-article-page.ts (existing pattern, lines 21-24 + 97-114)

// Step 1: Declare reactive state
@state() private _authors: Author[] = [];

// Step 2: Extract from existing metadata fetch (inside the try block at line 104)
if (meta) {
  this._tags = meta.tags || [];
  this._category = meta.category || '';
  this._date = meta.date || '';
  this._readingTime = meta.readingTime || 0;
  this._authors = meta.authors || [];   // NEW — single line addition
}

// Step 3: Add import at top
import type { ArticleRegistry, Author } from '../types/article.js';
```

**Key note:** `Author` is already exported from `src/types/article.ts` — no new type definition needed. [VERIFIED: src/types/article.ts]

### Pattern 2: Byline rendering helper

```typescript
// Follows same pattern as _formatDate() helper (line 156)
private _renderByline() {
  const DEFAULT_AUTHOR: Author = { name: 'Devliot', url: 'https://github.com/devliot' };
  const authors = this._authors.length > 0 ? this._authors : [DEFAULT_AUTHOR];

  const renderAuthor = (a: Author) =>
    a.url
      ? html`<a href="${a.url}" target="_blank" rel="noopener">${a.name}</a>`
      : html`${a.name}`;

  let formatted: unknown;
  if (authors.length === 1) {
    formatted = renderAuthor(authors[0]);
  } else if (authors.length === 2) {
    formatted = html`${renderAuthor(authors[0])} et ${renderAuthor(authors[1])}`;
  } else {
    const parts = authors.slice(0, -1).map((a, i) =>
      i === 0 ? renderAuthor(a) : html`, ${renderAuthor(a)}`
    );
    formatted = html`${parts} et ${renderAuthor(authors[authors.length - 1])}`;
  }

  return html`<p class="article-byline">par ${formatted}</p>`;
}
```

**Insertion point:** After line 208 (`</p>` closing `.article-meta`), before line 210 (`<article>`):
```typescript
${this._date || this._readingTime > 0 ? html`<p class="article-meta">...</p>` : ''}
${this._renderByline()}   <!-- always rendered, no conditional -->
<article>${unsafeHTML(this._html)}</article>
```

**Note:** The byline renders unconditionally (always shows at minimum the default Devliot author), unlike `.article-meta` which is conditional on date/readingTime existing. This means `_renderByline()` should be called directly, not wrapped in a ternary. [VERIFIED: CONTEXT.md D-04, D-05]

### Pattern 3: JSON-LD injection in build-og-pages.mjs

The `generateOgPages()` function (line 56-111) already builds an HTML string with template literals. The JSON-LD block is inserted as a new `<script>` in the `<head>`.

```javascript
// Source: scripts/build-og-pages.mjs (extension of existing generateOgPages pattern)

function buildJsonLd(article, siteUrl) {
  const DEFAULT_AUTHOR = { name: 'Devliot', url: 'https://devliot.github.io' };
  const authors = (article.authors && article.authors.length > 0)
    ? article.authors
    : [DEFAULT_AUTHOR];

  const authorNodes = authors.map(a => {
    const node = { '@type': 'Person', name: a.name };
    if (a.url) node.url = a.url;
    return node;
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    datePublished: article.date,
    author: authorNodes,
    publisher: {
      '@type': 'Organization',
      name: 'DEVLIOT',
      url: siteUrl
    }
  };

  if (article.description) schema.description = article.description;
  if (article.image) schema.image = `${siteUrl}/${article.image}`;

  // JSON.stringify is safe here — no escapeHtml needed inside <script type="application/ld+json">
  // The script type is not executed as HTML — only JSON is parsed. No XSS vector.
  return `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;
}
```

Insertion in the existing template string (before `</head>`):
```javascript
const jsonLd = buildJsonLd(article, SITE_URL);
// ...
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  ...existing meta tags...
${jsonLd}
  <script>window.location.replace(...);</script>
</head>
<body></body>
</html>`;
```

[CITED: https://developers.google.com/search/docs/appearance/structured-data/article]

### Pattern 4: CSS for `.article-byline`

Mirrors `.article-meta` exactly (same font-size, color, padding, margin-bottom). Already fully specified in `09-UI-SPEC.md`.

```css
/* Source: 09-UI-SPEC.md Component Inventory */
.article-byline {
  font-size: var(--font-size-label);       /* 14px */
  font-weight: var(--font-weight-regular); /* 400 */
  color: var(--color-text-muted);          /* #666666 */
  line-height: 1.5;
  margin-bottom: var(--space-md);          /* 16px */
  margin-top: 0;
  padding-left: var(--space-lg);           /* 24px */
  padding-right: var(--space-lg);
}
```

Author links inherit the existing `a:not(.heading-anchor)` rule (`color: var(--color-accent)`, `text-decoration: underline`). No additional link CSS needed. [VERIFIED: src/styles/article.css line 138-141]

### Anti-Patterns to Avoid

- **Conditional byline:** Do NOT wrap `_renderByline()` in `${someCondition ? ... : ''}`. The byline always renders (D-04 requires minimum default author, never empty).
- **Injecting default into index.json:** D-05 explicitly forbids this. Default is render-time and build-time only.
- **Client-side JSON-LD:** D-06 requires build-time. Do not add JSON-LD in `devliot-article-page.ts` — crawlers need stable HTML.
- **New build script:** Extend the existing `build-og-pages.mjs`, do not create `build-json-ld.mjs`. The existing `--generate` phase already reads `index.json` and writes `og.html` per article.
- **escapeHtml in JSON-LD:** The JSON-LD `<script type="application/ld+json">` block is not parsed as HTML by the browser — `JSON.stringify()` handles all encoding. Do not double-escape JSON strings with `escapeHtml()`.
- **Resetting _authors on slug change:** Line 65-70 resets all state when a new slug is loaded. Ensure `this._authors = []` is added to that reset block, or the previous article's byline will flash before the new one loads.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON serialization in JSON-LD | Custom JSON serializer | `JSON.stringify(schema, null, 2)` | Built-in, handles all escaping, produces valid JSON |
| Author URL sanitization | Custom URL validator | None needed — author URLs come from controlled `index.json` authored by site owner, not user input | Trust boundary is build time, not runtime user input |
| Schema.org type definitions | TypeScript interface for schema | Inline object literals in `buildJsonLd()` | No schema.org TypeScript library needed for a single `BlogPosting` use case |

**Key insight:** Both tasks are lightweight additions to existing infrastructure. The Lit component already fetches and holds all needed data; the build script already generates the exact file that needs modification. This phase is integration work, not new-system work.

---

## Common Pitfalls

### Pitfall 1: _authors not reset on slug change
**What goes wrong:** `_loadArticle()` resets `_date`, `_readingTime`, etc. on lines 65-70 when a new slug loads. If `_authors` is not added to this reset, the previous article's authors flash in the byline momentarily before the new article's metadata arrives.
**Why it happens:** The reset block (lines 65-70) is manually maintained. New state properties must be explicitly added.
**How to avoid:** Add `this._authors = [];` to the reset block alongside `this._tags = []`, `this._date = ''`, etc.
**Warning signs:** Navigating between articles shows the wrong byline briefly.

### Pitfall 2: JSON-LD schema validation
**What goes wrong:** Google's Rich Results Test rejects the structured data if required fields are missing or the JSON is malformed.
**Why it happens:** `JSON.stringify` can produce valid JSON but schema.org validators check for field presence.
**How to avoid:** Include at minimum `@context`, `@type`, `headline`, `datePublished`, `author`, and `publisher`. All are available from `index.json`. [CITED: https://developers.google.com/search/docs/appearance/structured-data/article]
**Warning signs:** Google Search Console reports "Missing field 'author'" or "Invalid value" errors.

### Pitfall 3: Author link in Shadow DOM
**What goes wrong:** The `<a>` element inside `.article-byline` is inside Shadow DOM. The global `article.css` is imported via `unsafeCSS()` and applies within the shadow root, so the existing `a:not(.heading-anchor)` rule does apply. However, if the shadow root's CSS is tested against light-DOM selectors in Playwright, the locator strategy must pierce the shadow DOM.
**Why it happens:** Playwright auto-pierces Shadow DOM for most locator methods, but CSS selectors like `.article-byline a` may need explicit `.locator()` calls that chain through the component.
**How to avoid:** In tests, use `page.locator('devliot-article-page').locator('.article-byline a')` — Playwright auto-pierces. [VERIFIED: existing test patterns in tests/article-metadata.spec.ts]
**Warning signs:** Playwright test fails with "Element not found" despite the element being visible in the browser.

### Pitfall 4: og.html JSON-LD not in public/, only in dist/
**What goes wrong:** The JSON-LD is generated into `dist/articles/{slug}/og.html` (not `public/`). It cannot be served in dev mode via `vite dev`. Tests that check JSON-LD must read the file directly from `dist/` (same pattern used in `article-metadata.spec.ts` for META-01 tests).
**Why it happens:** Build scripts write to `dist/`; Vite only serves `public/` at dev time.
**How to avoid:** JSON-LD tests should use `fs.readFileSync` from `dist/` (not Playwright page navigation), matching the existing META-01 test pattern. A prior `npm run build` is required before these tests pass.
**Warning signs:** JSON-LD tests pass locally but fail in CI if `npm run build` was not run first.

---

## Code Examples

Verified patterns from official sources:

### JSON-LD BlogPosting with multiple authors
```json
// Source: https://developers.google.com/search/docs/appearance/structured-data/article
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Article title",
  "datePublished": "2026-04-11",
  "author": [
    {
      "@type": "Person",
      "name": "Eliott",
      "url": "https://github.com/devliot"
    },
    {
      "@type": "Person",
      "name": "Sample Coauthor"
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "DEVLIOT",
    "url": "https://devliot.github.io"
  },
  "description": "Article description...",
  "image": "https://devliot.github.io/articles/01-demo-article/og-image.png"
}
```

### Playwright test pattern for shadow-DOM element assertion
```typescript
// Source: tests/article-metadata.spec.ts (existing project pattern)
const meta = page.locator('devliot-article-page').locator('.article-meta');
await expect(meta).toBeVisible();
await expect(meta).toContainText('April 11, 2026');

// For byline (same pattern):
const byline = page.locator('devliot-article-page').locator('.article-byline');
await expect(byline).toBeVisible();
await expect(byline).toContainText('par Eliott');
```

### Playwright test pattern for production-build file assertions
```typescript
// Source: tests/article-metadata.spec.ts META-01 tests (existing pattern)
test('JSON-LD exists in og.html', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
  const html = fs.readFileSync(ogPath, 'utf8');
  expect(html).toContain('application/ld+json');
  expect(html).toContain('BlogPosting');
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MathJax for structured data consumers | JSON-LD via schema.org | Standard since 2015, Google's preference since 2017 | JSON-LD is the recommended format — inline microdata is discouraged |
| Separate JSON-LD script at build | Inline in existing og.html generator | Phase 9 decision (D-07) | Keeps SEO markup co-located with OG meta; one file owns all crawler-facing metadata |

**Deprecated/outdated:**
- `meta.json` per-article file: `public/articles/01-demo-article/meta.json` exists but the build script already reads from `index.json`. The `meta.json` files appear to be unused remnants — `build-og-pages.mjs` reads only `public/articles/index.json`. [VERIFIED: scripts/build-og-pages.mjs line 57]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `meta.json` files (`public/articles/{slug}/meta.json`) are unused by any current code path | State of the Art | Low — even if used somewhere, Phase 9 does not modify them |
| A2 | Google's Rich Results Test will accept a `BlogPosting` without `dateModified` | JSON-LD pattern | Low — dateModified is recommended but not required per Google docs |
| A3 | The default author URL for JSON-LD should be `https://devliot.github.io` (organization URL, not `https://github.com/devliot`) | Pattern 3 | Low — both are acceptable Person.url values; the planner can choose either |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Default author URL in JSON-LD**
   - What we know: D-04 specifies `https://github.com/devliot` for the byline link. D-08 specifies `publisher.url: "https://devliot.github.io"`.
   - What's unclear: Should the default `Person` author in JSON-LD use `https://github.com/devliot` (matching byline D-04) or `https://devliot.github.io` (matching publisher)?
   - Recommendation: Use `https://github.com/devliot` — consistent with D-04 and provides a stable, unique author identity URL as recommended by Google.

2. **JSON-LD for articles with no declared authors (discretion item)**
   - What we know: D-04 requires a byline fallback to "Devliot" with URL. CONTEXT.md Claude's Discretion says: "Whether the build script also generates JSON-LD for the default Devliot author on articles without declared authors, or omits the `author` field entirely for those."
   - What's unclear: Is it better to always include an `author` field (using the default) or omit it when not declared?
   - Recommendation: Always include `author` with the default — Google recommends including `author` in all `BlogPosting` structured data, and an omitted field vs. a filled default are treated differently by validators.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is code/config-only changes using already-installed Node.js, existing build scripts, and existing Playwright infrastructure)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/per-article-authors.spec.ts --project=chromium` |
| Full suite command | `npx playwright test --project=chromium` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTHOR-01 | `authors` array present in `index.json` with name + optional url | static assertion | `node -e "const r=JSON.parse(require('fs').readFileSync('public/articles/index.json','utf8')); console.assert(r.articles[0].authors.length > 0)"` | ✅ (index.json already has authors) |
| AUTHOR-02 | Byline visible with "par Eliott et Sample Coauthor" on demo article | E2E (dev server) | `npx playwright test tests/per-article-authors.spec.ts --project=chromium` | ❌ Wave 0 |
| AUTHOR-02 | Byline renders default "par Devliot" for articles with no authors | E2E (dev server) | included in above test file | ❌ Wave 0 |
| AUTHOR-02 | Byline appears after .article-meta (DOM order) | E2E (dev server) | included in above test file | ❌ Wave 0 |
| AUTHOR-02 | Author link has target="_blank" rel="noopener" | E2E (dev server) | included in above test file | ❌ Wave 0 |
| AUTHOR-03 | og.html contains `<script type="application/ld+json">` with BlogPosting | static (dist file) | `npx playwright test tests/per-article-authors.spec.ts --project=chromium` | ❌ Wave 0 |
| AUTHOR-03 | JSON-LD author array matches index.json authors | static (dist file) | included in above test file | ❌ Wave 0 |
| AUTHOR-03 | JSON-LD contains publisher Organization | static (dist file) | included in above test file | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/per-article-authors.spec.ts --project=chromium`
- **Per wave merge:** `npx playwright test --project=chromium`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/per-article-authors.spec.ts` — covers AUTHOR-02 (byline E2E) and AUTHOR-03 (JSON-LD static assertions)

*(No framework install needed — Playwright already installed and configured)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | partial | Author `url` values come from controlled `index.json` authored by site owner; no runtime user input. `escapeHtml()` already applied to all fields in `generateOgPages()`. JSON-LD content uses `JSON.stringify()` which handles JSON encoding. |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via author URL in og.html | Tampering | `escapeHtml()` already wraps all string fields in `build-og-pages.mjs`. Apply same to author name and url fields. |
| XSS via author name in Lit template | Tampering | Lit's `html` tagged template auto-escapes text content. Author names rendered as text nodes (or inside `href` attribute, which Lit sanitizes for javascript: URIs). |
| JSON injection in JSON-LD block | Tampering | `JSON.stringify()` handles all encoding. Do not manually concatenate author strings into the JSON-LD block. |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: src/pages/devliot-article-page.ts] — existing metadata fetch and render patterns
- [VERIFIED: scripts/build-og-pages.mjs] — existing OG generation pipeline
- [VERIFIED: src/types/article.ts] — `Author` interface confirmed present
- [VERIFIED: public/articles/index.json] — demo article already has `authors` array
- [VERIFIED: src/styles/article.css] — `.article-meta` CSS pattern and link styling
- [VERIFIED: .planning/phases/09-per-article-authors/09-UI-SPEC.md] — byline design contract
- [VERIFIED: tests/article-metadata.spec.ts] — existing Playwright test patterns for OG assertions
- [CITED: https://developers.google.com/search/docs/appearance/structured-data/article] — Google's BlogPosting required/recommended fields and author Person array format

### Secondary (MEDIUM confidence)
- [CITED: https://schema.org/BlogPosting] — schema.org type definition
- [CITED: https://schema.org/author] — author property definition

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all libraries verified in package.json
- Architecture: HIGH — insertion points precisely identified in source files (line numbers verified)
- Pitfalls: HIGH — derived from direct code inspection and existing test patterns
- JSON-LD schema: HIGH — verified against Google's official structured data documentation

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable — no fast-moving dependencies)
