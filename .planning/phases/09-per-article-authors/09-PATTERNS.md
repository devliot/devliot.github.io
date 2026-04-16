# Phase 9: Per-article Authors - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 4 (2 modified, 1 new CSS rule, 1 new test file)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/pages/devliot-article-page.ts` | component | request-response | itself (surgical extension) | exact |
| `src/styles/article.css` | utility/config | transform | `.article-meta` rule in same file | exact |
| `scripts/build-og-pages.mjs` | utility/build | batch | itself (surgical extension) | exact |
| `tests/per-article-authors.spec.ts` | test | request-response | `tests/article-metadata.spec.ts` | exact |

---

## Pattern Assignments

### `src/pages/devliot-article-page.ts` (component, request-response)

**Analog:** itself — lines 19–24 (state declarations), lines 64–69 (slug-change reset block), lines 97–114 (metadata fetch), lines 200–218 (render method).

#### Reactive state declaration pattern (lines 19–24)

```typescript
@state() private _html = '';
@state() private _error = '';
@state() private _tags: string[] = [];
@state() private _category = '';
@state() private _date = '';
@state() private _readingTime = 0;
```

**Copy:** Add `@state() private _authors: Author[] = [];` in the same block, after `_readingTime`.

#### Slug-change reset block (lines 64–69)

```typescript
this._error = '';
this._html = '';
this._tags = [];
this._category = '';
this._date = '';
this._readingTime = 0;
```

**Copy:** Add `this._authors = [];` here so the previous article's byline does not flash on navigation.

#### Metadata extraction pattern (lines 104–110)

```typescript
const meta = registry.articles.find(a => a.slug === currentSlug);
if (meta) {
  this._tags = meta.tags || [];
  this._category = meta.category || '';
  this._date = meta.date || '';
  this._readingTime = meta.readingTime || 0;
}
```

**Copy:** Add `this._authors = meta.authors || [];` as the last line inside the `if (meta)` block.

#### Import line (line 8)

```typescript
import type { ArticleRegistry } from '../types/article.js';
```

**Copy:** Extend to `import type { ArticleRegistry, Author } from '../types/article.js';`. The `Author` type already exists in `src/types/article.ts` — no new type definition needed.

#### Conditional render pattern (lines 205–209)

```typescript
${this._date || this._readingTime > 0 ? html`
  <p class="article-meta">
    ${this._date ? html`<time datetime="${this._date}">${this._formatDate(this._date)}</time>` : ''}...
  </p>
` : ''}
```

**New byline insertion:** Placed unconditionally after the `.article-meta` block (after line 209, before line 210). The byline is never conditional — it always renders the default Devliot fallback at minimum (D-04).

```typescript
${this._renderByline()}
<article>${unsafeHTML(this._html)}</article>
```

#### Private helper pattern (lines 156–164 — `_formatDate`)

```typescript
private _formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
```

**Copy structure** for `_renderByline()` — a private method returning a Lit `TemplateResult`. The byline helper follows the same "private method returning html template" pattern:

```typescript
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

**Author link security note:** Lit's `html` tagged template auto-escapes text nodes and sanitizes `href` attributes against `javascript:` URIs — no manual escaping needed for `name` or `url` values read from `index.json`.

---

### `src/styles/article.css` (utility/config, transform)

**Analog:** `.article-meta` rule — lines 19–28 in `src/styles/article.css`.

#### Analog pattern to mirror exactly (lines 19–28)

```css
.article-meta {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-md);
  margin-top: 0;
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}
```

**New rule to add** immediately after `.article-meta`:

```css
/* Byline line — per Phase 9 UI-SPEC: author names below metadata */
.article-byline {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--space-md);
  margin-top: 0;
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}
```

**Author links:** Inherit the existing `a:not(.heading-anchor)` rule (lines 138–141) — `color: var(--color-accent)` (#333333) with `text-decoration: underline`. No new link CSS required.

```css
/* Existing rule — no changes needed, author <a> elements inherit this */
a:not(.heading-anchor) {
  color: var(--color-accent);
  text-decoration: underline;
}
```

---

### `scripts/build-og-pages.mjs` (utility/build, batch)

**Analog:** itself — `generateOgPages()` function (lines 56–111) and `escapeHtml()` helper (lines 13–20).

#### Existing escapeHtml helper (lines 13–20)

```javascript
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

**Apply to:** `article.title`, `article.description`, author `name` and `url` fields when constructing the JSON-LD block (for the `<script>` tag boundary). Inside the JSON-LD script body, `JSON.stringify()` handles encoding — `escapeHtml` is NOT applied inside the JSON payload.

#### Existing HTML template string pattern (lines 87–102)

```javascript
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  ...
  <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body></body>
</html>
`;
```

**Extension:** Add a `buildJsonLd(article, siteUrl)` helper function above `generateOgPages()`, and insert the JSON-LD `<script>` block into the HTML template string before the redirect script:

```javascript
function buildJsonLd(article, siteUrl) {
  const DEFAULT_AUTHOR = { name: 'Devliot', url: 'https://github.com/devliot' };
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

  // JSON.stringify handles all JSON encoding inside the script block.
  // escapeHtml is NOT applied here — the script type="application/ld+json"
  // is parsed as JSON, not as HTML.
  return `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;
}
```

**Integration point in `generateOgPages()`** (after line 72, before building the `html` template string):

```javascript
const jsonLd = buildJsonLd(article, SITE_URL);

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  ...existing meta tags...
${jsonLd}
  <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body></body>
</html>`;
```

**Key constraint:** `buildJsonLd` does not use `escapeHtml` on values that go into the JSON payload (D-RESEARCH anti-pattern). Author `name` and `url` come from controlled `index.json` authored at build time by the site owner — not runtime user input.

---

### `tests/per-article-authors.spec.ts` (test, request-response)

**Analog:** `tests/article-metadata.spec.ts` — exact match on structure, Shadow DOM locator pattern, and static file assertion pattern.

#### Test file structure pattern (lines 1–8)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Article Metadata — META-02 & META-03 (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/article/01-demo-article');
    await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
  });
  // ...
});
```

**Copy:** Same structure — `test.describe` block with `beforeEach` that navigates to `/article/01-demo-article` and waits for article content to load.

#### Shadow DOM locator pattern (lines 11–15)

```typescript
const meta = page.locator('devliot-article-page').locator('.article-meta');
await expect(meta).toBeVisible();
await expect(meta).toContainText('April 11, 2026');
```

**Copy for byline:** Chain `.locator('devliot-article-page').locator('.article-byline')`. Playwright auto-pierces Shadow DOM with this chained locator pattern — no special `shadowRoot` handling needed.

```typescript
const byline = page.locator('devliot-article-page').locator('.article-byline');
await expect(byline).toBeVisible();
await expect(byline).toContainText('par Eliott');
```

#### Static file (dist) assertion pattern (lines 54–107)

```typescript
test.describe('Article Metadata — META-01 (OG pages, production build)', () => {
  test('META-01: OG HTML page exists for demo article', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    expect(fs.existsSync(ogPath)).toBe(true);
  });

  test('META-01: OG page contains correct og:title', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('og:title');
  });
```

**Copy for JSON-LD tests:** Same `fs.readFileSync` from `dist/articles/01-demo-article/og.html`. These tests require `npm run build` to have been run first (same requirement as existing META-01 tests).

```typescript
test.describe('Article Authors — AUTHOR-03 (JSON-LD, production build)', () => {
  test('AUTHOR-03: og.html contains JSON-LD script block', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('BlogPosting');
  });
});
```

#### Attribute assertion pattern (lines 17–21)

```typescript
const timeEl = page.locator('devliot-article-page').locator('.article-meta time');
await expect(timeEl).toHaveAttribute('datetime', '2026-04-11');
```

**Copy for author link attributes:**

```typescript
const authorLink = page.locator('devliot-article-page').locator('.article-byline a').first();
await expect(authorLink).toHaveAttribute('target', '_blank');
await expect(authorLink).toHaveAttribute('rel', 'noopener');
```

#### DOM order assertion pattern (lines 39–47)

```typescript
const metaBox = await page.locator('devliot-article-page').locator('.article-meta').boundingBox();
const articleBox = await page.locator('devliot-article-page').locator('article').boundingBox();
expect(metaBox!.y).toBeLessThan(articleBox!.y);
```

**Copy for byline DOM order:** Assert `.article-byline` appears below `.article-meta` and above `article`:

```typescript
const metaBox = await page.locator('devliot-article-page').locator('.article-meta').boundingBox();
const bylineBox = await page.locator('devliot-article-page').locator('.article-byline').boundingBox();
const articleBox = await page.locator('devliot-article-page').locator('article').boundingBox();
expect(metaBox!.y).toBeLessThan(bylineBox!.y);
expect(bylineBox!.y).toBeLessThan(articleBox!.y);
```

---

## Shared Patterns

### CSS-in-Shadow-Root via unsafeCSS (devliot-article-page.ts lines 5–6, 15)

**Source:** `src/pages/devliot-article-page.ts`
**Apply to:** Any new CSS rules added to `src/styles/article.css`

```typescript
import articleStyles from '../styles/article.css?inline';
// ...
static styles = [unsafeCSS(articleStyles), unsafeCSS(codeStyles), unsafeCSS(diagramStyles)];
```

New `.article-byline` CSS added to `article.css` is automatically picked up by the `?inline` import — no change to the `static styles` array required.

### Metadata fetch error handling (devliot-article-page.ts lines 97–114)

**Source:** `src/pages/devliot-article-page.ts`
**Apply to:** `_authors` extraction in the same fetch block

The metadata fetch is already inside a `try/catch` that treats failure as non-critical (tags just won't show). The `_authors` extraction piggybacks on this same pattern — no separate error handling needed. Failure to fetch metadata means `_authors` stays `[]`, which triggers the default Devliot fallback (D-04).

```typescript
try {
  const regRes = await fetch(`${import.meta.env.BASE_URL}articles/index.json`);
  if (regRes.ok) {
    const registry: ArticleRegistry = await regRes.json();
    const meta = registry.articles.find(a => a.slug === currentSlug);
    if (meta) {
      this._tags = meta.tags || [];
      this._category = meta.category || '';
      this._date = meta.date || '';
      this._readingTime = meta.readingTime || 0;
      // NEW: extract authors with empty-array fallback
      this._authors = meta.authors || [];
    }
  }
} catch {
  // Non-critical — metadata just won't show
}
```

### Slug validation guard (build-og-pages.mjs lines 31–34)

**Source:** `scripts/build-og-pages.mjs`
**Apply to:** No new slug processing in `buildJsonLd` — it receives an already-validated `article` object from `generateOgPages()`, which already guards with `SLUG_PATTERN.test(article.slug)` before calling any per-article logic.

### SITE_URL constant (build-og-pages.mjs line 4)

**Source:** `scripts/build-og-pages.mjs`
**Apply to:** `buildJsonLd(article, SITE_URL)` — pass the existing `SITE_URL` constant rather than hard-coding the URL inside `buildJsonLd`. This keeps the publisher URL and image URL consistent with the rest of the OG output.

```javascript
const SITE_URL = 'https://devliot.github.io';
// ...
// Pass SITE_URL to buildJsonLd — do not hardcode inside the function
const jsonLd = buildJsonLd(article, SITE_URL);
```

---

## No Analog Found

All files have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `src/pages/`, `src/styles/`, `scripts/`, `tests/`, `src/types/`
**Files scanned:** `devliot-article-page.ts`, `build-og-pages.mjs`, `article.css`, `article.ts`, `article-metadata.spec.ts`, `article-components.spec.ts`, `index.json` (public/articles)
**Pattern extraction date:** 2026-04-16
