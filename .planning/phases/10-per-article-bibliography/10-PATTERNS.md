# Phase 10: Per-article Bibliography - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 3 (2 modified, 1 new)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/devliot-article-page.ts` | component | request-response + event-driven | self (existing file being extended) | exact |
| `src/styles/article.css` | config (styles) | transform | `src/styles/article.css` lines 171-199 (`.article-tags`) | exact |
| `tests/per-article-bibliography.spec.ts` | test | request-response | `tests/per-article-authors.spec.ts` + `tests/deep-linkable-anchors.spec.ts` | exact |

---

## Pattern Assignments

### `src/pages/devliot-article-page.ts` — four modification sites

**Analog:** Self — the file already contains every pattern needed. No new file; four named sites are modified.

---

#### Site 1: `@state` declaration + type import

**Model:** Lines 8 and 19-25 — existing `@state` declarations and `Author` import.

**Imports pattern** (lines 1-8):
```typescript
import { LitElement, html, unsafeCSS } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import articleStyles from '../styles/article.css?inline';
import codeStyles from '../styles/code.css?inline';
import diagramStyles from '../styles/devliot-diagram.css?inline';
import type { ArticleRegistry, Author } from '../types/article.js';
```

**Change:** Add `BibliographyEntry` to the type import on line 8:
```typescript
import type { ArticleRegistry, Author, BibliographyEntry } from '../types/article.js';
```

**State declaration pattern** (lines 19-25):
```typescript
@state() private _html = '';
@state() private _error = '';
@state() private _tags: string[] = [];
@state() private _category = '';
@state() private _date = '';
@state() private _readingTime = 0;
@state() private _authors: Author[] = [];
```

**Change:** Add one more `@state` after line 25:
```typescript
@state() private _bibliography: BibliographyEntry[] = [];
```

---

#### Site 2: `_loadArticle()` — reset block + metadata extraction

**Model:** Lines 55-118 — full `_loadArticle()` method.

**Reset block pattern** (lines 65-71):
```typescript
this._error = '';
this._html = '';
this._tags = [];
this._category = '';
this._date = '';
this._readingTime = 0;
this._authors = [];
```

**Change:** Add `this._bibliography = [];` to this reset block. This is the only guard against stale bibliography data when navigating between articles (Pitfall 3 in RESEARCH.md).

**Metadata extraction pattern** (lines 106-113):
```typescript
const meta = registry.articles.find(a => a.slug === currentSlug);
if (meta) {
  this._tags = meta.tags || [];
  this._category = meta.category || '';
  this._date = meta.date || '';
  this._readingTime = meta.readingTime || 0;
  this._authors = meta.authors || [];
}
```

**Change:** Add `this._bibliography = meta.bibliography || [];` as the last assignment inside the `if (meta)` block.

---

#### Site 3: `updated()` lifecycle — add `_injectCitationLinks()` call

**Model:** Lines 45-53 — existing `updated()` hook.

**Full `updated()` pattern** (lines 45-53):
```typescript
updated(changed: PropertyValues) {
  if (changed.has('_html') && this._html) {
    // Use microtask to ensure the DOM has been updated before processing headings
    this.updateComplete.then(() => {
      this._injectHeadingAnchors();
      this._scrollToSectionFromUrl();
    });
  }
}
```

**Change:** Add `this._injectCitationLinks();` after `this._injectHeadingAnchors()` and before `this._scrollToSectionFromUrl()`. Order matters: headings first, then citations, then scroll.

---

#### Site 4: `render()` method — insert `_renderReferences()` call

**Model:** Lines 227-246 — full `render()` method, specifically the insertion point between `<article>` and `.article-tags`.

**Render insertion point** (lines 238-244):
```typescript
<article>${unsafeHTML(this._html)}</article>
${this._tags.length > 0 || this._category ? html`
  <nav class="article-tags" aria-label="Article tags">
    ...
  </nav>
` : ''}
```

**Change:** Add `${this._renderReferences()}` between the closing `</article>` and the start of the `article-tags` nav conditional.

---

#### New private method: `_renderReferences()`

**Analog:** `_renderByline()` at lines 169-191 — exact structural model for an extracted private render method returning a Lit `html` template.

**`_renderByline()` shape** (lines 169-191):
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

**Copy this structure for `_renderReferences()`:** Guard on empty array, map over the data array, return a Lit `html` template. The URL-conditional title link pattern (line 174-177) is the direct model for D-04 (title as link when `entry.url` present).

---

#### New private method: `_injectCitationLinks()`

**Analog:** `_injectHeadingAnchors()` at lines 124-157 — exact model for post-render Shadow DOM traversal with `scrollIntoView` click handlers.

**Full `_injectHeadingAnchors()` pattern** (lines 124-157):
```typescript
private _injectHeadingAnchors(): void {
  const article = this.shadowRoot?.querySelector('article');
  if (!article) return;

  const headings = article.querySelectorAll<HTMLHeadingElement>('h2, h3');

  headings.forEach((heading) => {
    // Avoid double-injecting if updated is called multiple times
    if (heading.querySelector('.heading-anchor')) return;

    const id = (heading.textContent ?? '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    heading.id = id;

    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = '#';
    anchor.textContent = '#';
    anchor.setAttribute('aria-hidden', 'true');

    anchor.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.set('section', id);
      history.pushState({ section: id }, '', url.toString());
      heading.scrollIntoView({ behavior: 'smooth' });
    });

    heading.prepend(anchor);
  });
}
```

**Copy these patterns for `_injectCitationLinks()`:**
- `this.shadowRoot?.querySelector('article')` — Shadow DOM scope (lines 125-126). Critical: `document.querySelector` cannot see shadow root children.
- `if (heading.querySelector('.heading-anchor')) return;` — double-injection guard (line 132). Mirror with `if (article.querySelector('.citation-link')) return;`.
- `document.createElement('a')` + `.className` + `addEventListener('click', e => { e.preventDefault(); target?.scrollIntoView({ behavior: 'smooth' }); })` — anchor creation + scroll handler (lines 141-153). Copy verbatim for both citation links and back-links.
- `target?.scrollIntoView({ behavior: 'smooth' })` — smooth scroll to shadow DOM element (line 152). Same API for both `cite-N` → `ref-N` and `ref-N` → `cite-N` directions.

**`_scrollToSectionFromUrl()` CSS.escape pattern** (lines 206-225):
```typescript
const target = article.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
```
Copy this `CSS.escape()` pattern when querying `#ref-${n}` or `#cite-${n}` for scroll targets.

---

### `src/styles/article.css` — new CSS block appended to file

**Analog:** `.article-tags` block at lines 171-199 — provides the exact separator, spacing, and token patterns to copy.

**`.article-tags` separator pattern** (lines 171-180):
```css
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding-top: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-top: 1px solid #eeeeee;
  margin-top: var(--space-xl);
}
```

**Copy for `.references`:** Use `border-top: 1px solid #eeeeee` (same separator), `margin-top: var(--space-xl)` (same spacing). D-01 mandates this exact separator pattern.

**`.article-byline` muted text pattern** (lines 31-40):
```css
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

**Copy for `.ref-entry`:** Same `font-size: var(--font-size-label)` (14px), `color: var(--color-text-muted)` (#666666), `line-height: 1.5` — matches D-03 compact single-line format and D-10 muted text.

**`h2, h3` scroll-margin-top pattern** (lines 43-51):
```css
h2, h3 {
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  margin-top: var(--space-2xl);
  margin-bottom: var(--space-lg);
  position: relative;
  scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem);
}
```

**Copy for `.ref-entry`:** Use `scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)` — same sticky header offset. D-14 mandates this for reference entries scrolled-to from inline citation links.

**`.heading-anchor` link style** (lines 112-128):
```css
.heading-anchor {
  color: var(--color-accent);
  text-decoration: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  cursor: pointer;
}
```

**Copy hover-only underline pattern for `.citation-link` and `.ref-backlink`:** D-10 specifies `text-decoration: none` by default and underline only on hover. Use `color: var(--color-text-muted)` (not `--color-accent`) for both — visually distinct from content links.

**`a:not(.heading-anchor)` global link rule** (lines 150-153):
```css
a:not(.heading-anchor) {
  color: var(--color-accent);
  text-decoration: underline;
}
```

**Note for `.ref-entry a`:** Title links inside reference entries will inherit this global `a` rule (permanent underline, `--color-accent`). D-04 is satisfied by default inheritance — no extra rule needed unless specificity conflicts arise.

---

### `tests/per-article-bibliography.spec.ts` — new test file

**Analog 1:** `tests/per-article-authors.spec.ts` — closest match: same article page component, same shadow-DOM piercing patterns, same `getComputedStyle` for CSS assertions.

**Analog 2:** `tests/deep-linkable-anchors.spec.ts` — closest match for scroll behavior tests: `scrollIntoView` assertions, `boundingBox()` for position verification, `waitForTimeout` for scroll animation.

**Test structure pattern** (per-article-authors.spec.ts lines 1-13):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Article Authors -- AUTHOR-02 (byline, dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/article/01-demo-article');
    // Wait for article content to load (same pattern as article-metadata.spec.ts)
    await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
  });
```

**Copy for bibliography spec:** Same `beforeEach` with `page.goto('/article/01-demo-article')` + `waitFor({ timeout: 10000 })` on `article h1`. All bibliography assertions depend on article load completing.

**Shadow-DOM locator pattern** (per-article-authors.spec.ts lines 11-13):
```typescript
const byline = page.locator('devliot-article-page').locator('.article-byline');
await expect(byline).toBeVisible();
await expect(byline).toContainText('par Eliott et Sample Coauthor');
```

**Copy for bibliography:** `page.locator('devliot-article-page').locator('.references')` — Playwright auto-pierces Shadow DOM with chained `.locator()` calls.

**CSS assertion pattern** (per-article-authors.spec.ts lines 44-51):
```typescript
const color = await byline.evaluate(el => getComputedStyle(el).color);
// --color-text-muted is #666666 = rgb(102, 102, 102)
expect(color).toBe('rgb(102, 102, 102)');
const fontSize = await byline.evaluate(el => getComputedStyle(el).fontSize);
expect(fontSize).toBe('14px');
```

**Copy for `.ref-entry` muted style assertion:** Same `evaluate(el => getComputedStyle(el).color)` → `'rgb(102, 102, 102)'` and `fontSize` → `'14px'`.

**Positional assertion pattern** (per-article-authors.spec.ts lines 33-42):
```typescript
const metaBox = await page.locator('devliot-article-page').locator('.article-meta').boundingBox();
const bylineBox = await page.locator('devliot-article-page').locator('.article-byline').boundingBox();
const articleBox = await page.locator('devliot-article-page').locator('article').boundingBox();
expect(metaBox!.y).toBeLessThan(bylineBox!.y);
expect(bylineBox!.y).toBeLessThan(articleBox!.y);
```

**Copy for D-05 position assertion:** Verify `.references` section `boundingBox().y` is greater than `article` `boundingBox().y` and less than `.article-tags` `boundingBox().y`.

**Scroll assertion pattern** (deep-linkable-anchors.spec.ts lines 29-43):
```typescript
await page.goto('/article/01-demo-article?section=code-highlighting');
await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
await page.waitForTimeout(1500);

const headingBox = await page.locator('devliot-article-page #code-highlighting').boundingBox();
const viewportSize = page.viewportSize();
expect(headingBox!.y).toBeGreaterThan(0);
expect(headingBox!.y).toBeLessThan(viewportSize!.height);
```

**Copy for D-12/D-13 scroll assertions:** After clicking a citation link, use `await page.waitForTimeout(1500)` to let the smooth scroll animation complete, then check `boundingBox().y` is within viewport bounds. Same pattern for back-link direction.

**Silent-miss pattern** (deep-linkable-anchors.spec.ts lines 117-130):
```typescript
// ANCH-02 edge case: missing section is silently stripped
test('ANCH-02: missing section is silently stripped', async ({ page }) => {
  await page.goto('/article/01-demo-article?section=nonexistent-heading');
  ...
  expect(url.searchParams.has('section')).toBe(false);
});
```

**Copy structure for D-15 silent-miss test:** Navigate to the demo article; assert that an `[unknown-id]` marker in the body renders as plain text `[unknown-id]` and no link element wraps it.

---

## Shared Patterns

### Shadow DOM queries — applies to all new methods in `devliot-article-page.ts`

**Source:** `devliot-article-page.ts` lines 125, 197, 211, 214
```typescript
const article = this.shadowRoot?.querySelector('article');
const target = article?.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
```
Every element query in the component uses `this.shadowRoot?.querySelector()`. Never use `document.querySelector()` — it cannot pierce the shadow boundary.

### `scrollIntoView({ behavior: 'smooth' })` — applies to both cite→ref and ref→cite scrolling

**Source:** `devliot-article-page.ts` lines 152, 200
```typescript
heading.scrollIntoView({ behavior: 'smooth' });
target.scrollIntoView({ behavior: 'smooth' });
```
Both the heading anchor handler (line 152) and `_scrollToSectionFromUrl` (line 200) use this exact call. Copy verbatim for citation and back-link click handlers.

### `e.preventDefault()` on hash `href` — applies to both citation links and back-links

**Source:** `devliot-article-page.ts` line 147-153
```typescript
anchor.addEventListener('click', (e: MouseEvent) => {
  e.preventDefault();
  ...
  heading.scrollIntoView({ behavior: 'smooth' });
});
```
Hash navigation (`href="#ref-N"`) cannot reach shadow DOM elements via browser default behavior. Always intercept with `e.preventDefault()` and call `scrollIntoView` manually. Pattern is identical for both `cite-N → ref-N` and `ref-N → cite-N` directions.

### Design tokens — applies to new CSS in `article.css`

**Source:** `src/styles/reset.css` lines 9-41
```css
--color-text-muted: #666666;
--color-accent: #333333;
--color-border: #e5e5e5;
--font-size-label: 14px;
--font-weight-regular: 400;
--font-weight-semibold: 600;
--line-height-body: 1.5;
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```
All new CSS for `.references`, `.ref-list`, `.ref-entry`, `.citation-link`, `.ref-backlink` must use only these tokens. No hex colors, no hardcoded px values except where the analog (`h2, h3`, `figcaption`) already hardcodes specific sizes per UI-SPEC.

### Playwright waitFor before assertions — applies to all new tests

**Source:** `tests/per-article-authors.spec.ts` line 7
```typescript
await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
```
All bibliography tests must wait for `article h1` before asserting — the article content is fetched asynchronously after the component mounts.

---

## No Analog Found

All three files have close analogs within the codebase. No external patterns from RESEARCH.md are required.

---

## Metadata

**Analog search scope:** `src/pages/`, `src/styles/`, `src/types/`, `tests/`
**Files scanned:** 7 (devliot-article-page.ts, article.css, reset.css, article.ts, per-article-authors.spec.ts, deep-linkable-anchors.spec.ts, article-metadata.spec.ts)
**Pattern extraction date:** 2026-04-16
