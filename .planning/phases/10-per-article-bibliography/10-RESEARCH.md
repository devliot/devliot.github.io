# Phase 10: Per-article Bibliography - Research

**Researched:** 2026-04-16
**Domain:** Lit 3 web component DOM manipulation, bidirectional scroll anchors, CSS bibliography layout
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** References section separated from article body by horizontal rule (`border-top: 1px solid`, same pattern as `.article-tags`) followed by an `<h2>` heading "Références".
- **D-02:** Section heading is **"Références"** (French).
- **D-03:** Each reference entry: compact single-line `[N] Authors — Title. Publisher, Year.`. No card blocks, no multi-line layouts.
- **D-04:** When a reference has a `url`, the title text is the clickable link (new tab). No raw URL displayed. No URL = plain text title.
- **D-05:** References section renders **between `<article>` and `.article-tags` nav**.
- **D-06:** Articles **without** a `bibliography` array (or with an empty array) render with **no references section** — no heading, no separator, no placeholder.
- **D-07:** Type-specific field sets: article = Authors — Title. Year; book = Authors — Title. Publisher, Year; web = Title. (all with URL on title if present).
- **D-08:** Authors as-provided, joined with `", "`. No auto "et al.".
- **D-09:** Inline `[id]` markers → `[N]` bracketed number links at normal text size (no superscript). Number = 1-based array index.
- **D-10:** Citation links use `--color-text-muted` with underline on hover only. Not `--color-accent`.
- **D-11:** Transformation happens post-render (DOM manipulation after `unsafeHTML` injection), following `_injectHeadingAnchors()` pattern.
- **D-12:** Inline `[N]` click → smooth-scroll to reference entry. Same pattern as Phase 7 heading anchors.
- **D-13:** Each reference entry has a `↩` back-link that smooth-scrolls back to the inline citation.
- **D-14:** Both scroll directions use `scrollIntoView({ behavior: 'smooth' })` respecting `scroll-margin-top` for sticky header offset.
- **D-15:** `[id]` marker with no matching bibliography entry → left as plain text (silent miss).
- **D-16:** Bibliography entry with no matching `[id]` marker in body → renders in references section, back-link simply absent for that entry.
- **Anchor IDs (from UI-SPEC):** `cite-{N}` for inline citations, `ref-{N}` for reference entries (1-based numeric, not raw `id` string).
- **Zero new runtime dependencies** — all features use existing Lit primitives + Web APIs.
- **Monochrome palette only** — no colored accents beyond `--color-accent` (#333333).
- **Playwright E2E tests** preferred over manual browser verification.

### Claude's Discretion

- Exact CSS for the references section (font sizes, spacing, indentation of wrapped lines) — follow `--font-size-label` / `--font-size-body` patterns. UI-SPEC resolved: 14px/regular/1.5 for entries.
- Whether `[id]` → `[N]` transformation uses regex replacement on the HTML string before injection, or DOM traversal after injection.
- Whether references section is rendered inline in `render()` or extracted as a private `_renderReferences()` method (similar to `_renderByline()`).
- `id` attribute naming — UI-SPEC resolved: `cite-{N}` / `ref-{N}`.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REF-01 | Bibliography declaration in `index.json` (types + demo data) | **Already complete in Phase 6.** `BibliographyEntry[]` type exists in `src/types/article.ts`; demo article has 3 entries. No schema work needed this phase. |
| REF-02 | "Références" section at bottom of article, numbered `[1]`, `[2]`..., format per type | Rendered via `_renderReferences()` private method returning Lit `html` template. Inserts `<section class="references">` between `<article>` and `.article-tags`. |
| REF-03 | Inline `[N]` citation links to reference entries; each entry has `↩` back-link | Implemented via `_injectCitationLinks()` post-render DOM traversal, same lifecycle as `_injectHeadingAnchors()`. Bidirectional `scrollIntoView`. |
</phase_requirements>

---

## Summary

Phase 10 is a pure rendering phase building on top of Phase 6's data contract. The `BibliographyEntry` type, the `bibliography?: BibliographyEntry[]` optional field on `Article`, and the demo article's three reference entries already exist — nothing to design from scratch. REF-01 is already complete.

The work divides into three concerns: (1) extract `bibliography` from the fetched registry in `_loadArticle()`, (2) render the "Références" section via a new `_renderReferences()` method in the `render()` function, and (3) post-render DOM manipulation to transform `[id]` plain-text markers into numbered `[N]` anchor links with bidirectional scrolling.

All patterns needed are already present in the codebase. The `_injectHeadingAnchors()` method (lines 124-157) is the exact model for post-render DOM traversal + `scrollIntoView`. The `_renderByline()` method (lines 169-191) is the exact model for a private extracted render method. The `.article-tags` separator (lines 172-179) is the exact CSS model for the references section's visual separator.

**Primary recommendation:** Use DOM traversal (not regex on HTML string) for `[id]` → `[N]` transformation, operating on text nodes inside `<article>` after `unsafeHTML` injection. This avoids corrupting HTML attributes or nested tag structures that string regex cannot handle safely.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bibliography data extraction | Frontend (component lifecycle) | — | `_loadArticle()` already fetches `index.json`; bibliography extracted alongside `meta.authors` |
| References section rendering | Frontend (component render) | — | Lit `html` template rendered by `devliot-article-page`'s `render()` method |
| Inline citation transformation | Frontend (post-render DOM) | — | Must run after `unsafeHTML` injects article content into DOM; mirrors `_injectHeadingAnchors()` pattern |
| Scroll behavior | Browser (Web API) | — | `scrollIntoView({ behavior: 'smooth' })` — native browser API, no library |
| Visual styling | CSS (article.css) | — | New classes `.references`, `.ref-list`, `.ref-entry`, `.citation-link`, `.ref-backlink` |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lit` | 3.3.1 | Web component authoring, `html` template renderer | Project non-negotiable; already in use |
| `lit/directives/unsafe-html.js` | 3.3.1 | Inject article HTML body | Already in use in `devliot-article-page.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Web Animations / `scrollIntoView` | Browser native | Smooth scroll to cite/ref anchors | D-12, D-13, D-14 — same API used in Phase 7 heading anchors |
| `CSS.escape()` | Browser native | Safe element queries by dynamic ID | Pattern from `_scrollToSectionFromUrl()` line 214 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DOM traversal (text node walking) for [id] replacement | Regex on HTML string before injection | Regex is fragile on nested HTML (can corrupt `href="..."` values or tag content). DOM traversal after injection is safer: operates on text nodes only, never attributes. Chosen per Claude's Discretion. |
| Extracted `_renderReferences()` method | Inline in `render()` | `_renderByline()` precedent favors extraction — keeps `render()` readable. Choose extraction. |
| `id="cite-vaswani-2017"` (raw entry id string) | `id="cite-1"` (1-based numeric) | Numeric IDs are stable regardless of entry `id` field changes. UI-SPEC resolved to numeric. |

**Installation:** No new packages needed. [VERIFIED: codebase grep — `package.json`]

---

## Architecture Patterns

### System Architecture Diagram

```
index.json
    |
    v
_loadArticle()  ─────────────────────────────────────────────────────────────────────┐
    |  extracts bibliography[] alongside authors/tags/date                           |
    v                                                                                |
@state _bibliography: BibliographyEntry[]                                           |
    |                                                                                |
    v                                                                                |
render()                                                                             |
    ├── article-meta (date, reading time)                                            |
    ├── _renderByline()                                                              |
    ├── <article>  ← unsafeHTML(_html)  ← raw [id] markers still in text            |
    ├── _renderReferences()  ← NEW: <section class="references">                    |
    │       └── <ol class="ref-list">                                                |
    │               ├── <li id="ref-1" class="ref-entry">[1] ... ↩</li>            |
    │               ├── <li id="ref-2" class="ref-entry">[2] ... ↩</li>            |
    │               └── <li id="ref-3" class="ref-entry">[3] ... ↩</li>            |
    └── article-tags nav                                                             |
                                                                                     |
updated() lifecycle (after DOM paint) ◄─────────────────────────────────────────────┘
    ├── _injectHeadingAnchors()  (existing — Phase 7)
    └── _injectCitationLinks()  ← NEW
            |
            |  Build id→N map from _bibliography[]
            |  Walk text nodes in <article>
            |  Replace [id] with <a id="cite-N" class="citation-link" href="#ref-N">[N]</a>
            |  For each ref-N li: if cite-N exists in DOM → append ↩ back-link
            v
        Bidirectional anchors active: cite-N ↔ ref-N
```

### Recommended Project Structure

No new files needed. All changes go into existing files:

```
src/
├── pages/
│   └── devliot-article-page.ts   # _loadArticle(), _renderReferences(), _injectCitationLinks()
└── styles/
    └── article.css               # .references, .ref-list, .ref-entry, .citation-link, .ref-backlink
```

New test file:
```
tests/
└── per-article-bibliography.spec.ts   # REF-02, REF-03 Playwright tests
```

### Pattern 1: Extracting `bibliography` in `_loadArticle()`

**What:** Read `meta.bibliography` from the registry alongside existing fields.

**When to use:** Whenever the article's registry metadata is fetched.

**Example:**
```typescript
// Source: devliot-article-page.ts _loadArticle() — lines 106-113 as model
if (meta) {
  this._tags = meta.tags || [];
  this._category = meta.category || '';
  this._date = meta.date || '';
  this._readingTime = meta.readingTime || 0;
  this._authors = meta.authors || [];
  this._bibliography = meta.bibliography || [];  // NEW
}
```

[VERIFIED: codebase — `src/types/article.ts` line 52 confirms `bibliography?: BibliographyEntry[]`]

### Pattern 2: `_renderReferences()` following `_renderByline()` shape

**What:** Private method returning a Lit `html` template for the references section.

**When to use:** Called from `render()` between `<article>` and `.article-tags`.

**Example:**
```typescript
// Source: _renderByline() pattern at devliot-article-page.ts lines 169-191
private _renderReferences() {
  if (!this._bibliography || this._bibliography.length === 0) return html``;

  return html`
    <section class="references">
      <h2>Références</h2>
      <ol class="ref-list">
        ${this._bibliography.map((entry, i) => {
          const n = i + 1;
          const titleEl = entry.url
            ? html`<a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.title}</a>`
            : html`${entry.title}`;
          const authors = entry.authors?.map(a => a.name).join(', ') ?? '';
          const year = entry.year ? ` ${entry.year}` : '';
          const publisher = entry.publisher ? ` ${entry.publisher},` : '';
          // format per D-07 / D-03
          return html`<li id="ref-${n}" class="ref-entry">[${n}] ${authors ? html`${authors} — ` : ''}${titleEl}.${publisher}${year}.</li>`;
        })}
      </ol>
    </section>
  `;
}
```

[ASSUMED] — exact field concatenation format; planner should verify against D-07 table.

### Pattern 3: `_injectCitationLinks()` — text node walking

**What:** Post-render DOM traversal that walks text nodes inside `<article>`, replaces `[id]` occurrences with anchor elements. Called in `updated()` after `_injectHeadingAnchors()`.

**When to use:** After `unsafeHTML` has injected article body into the shadow DOM.

**Example:**
```typescript
// Source: _injectHeadingAnchors() at lines 124-157 as lifecycle model
private _injectCitationLinks(): void {
  const article = this.shadowRoot?.querySelector('article');
  if (!article || !this._bibliography.length) return;

  // Build id → 1-based-index map
  const idToN = new Map<string, number>();
  this._bibliography.forEach((entry, i) => idToN.set(entry.id, i + 1));

  // Walk text nodes — safe: never corrupts HTML attributes
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  const replacements: Array<{ node: Text; n: number; id: string }> = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    // Match [some-id] pattern — slug-style ids
    const match = node.textContent?.match(/\[([a-z0-9-]+)\]/);
    if (match) {
      const id = match[1];
      const n = idToN.get(id);
      if (n !== undefined) replacements.push({ node, n, id });
    }
  }

  // Process replacements (backwards avoids tree invalidation)
  replacements.reverse().forEach(({ node, n }) => {
    const text = node.textContent!;
    const match = text.match(/\[([a-z0-9-]+)\]/);
    if (!match) return;
    const before = text.slice(0, match.index!);
    const after = text.slice(match.index! + match[0].length);
    const anchor = document.createElement('a');
    anchor.id = `cite-${n}`;
    anchor.className = 'citation-link';
    anchor.href = `#ref-${n}`;
    anchor.textContent = `[${n}]`;
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = this.shadowRoot?.querySelector<HTMLElement>(`#ref-${n}`);
      target?.scrollIntoView({ behavior: 'smooth' });
    });
    const parent = node.parentNode!;
    parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(anchor, node);
    parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  });

  // Inject ↩ back-links into ref entries that have a matching cite-N in DOM
  this._bibliography.forEach((_, i) => {
    const n = i + 1;
    const refEntry = this.shadowRoot?.querySelector<HTMLElement>(`#ref-${n}`);
    const citeEl = this.shadowRoot?.querySelector<HTMLElement>(`#cite-${n}`);
    if (refEntry && citeEl) {
      const backlink = document.createElement('a');
      backlink.className = 'ref-backlink';
      backlink.href = `#cite-${n}`;
      backlink.textContent = ' ↩';
      backlink.addEventListener('click', (e) => {
        e.preventDefault();
        citeEl.scrollIntoView({ behavior: 'smooth' });
      });
      refEntry.appendChild(backlink);
    }
  });
}
```

[ASSUMED] — TreeWalker approach; alternative is innerHTML regex pre-processing. Planner can choose. Key constraint: must not corrupt HTML attributes.

**Note on multiple `[id]` occurrences in article body:** The demo has one per entry. If an article cites the same reference twice, only the first occurrence gets the `cite-N` id (idempotent DOM — same id can only appear once). Subsequent occurrences will be transformed to `[N]` links but will navigate to `ref-N` without an anchored id. This is acceptable behavior per D-15/D-16 spirit; back-link navigates to first occurrence only.

### Pattern 4: `updated()` lifecycle integration

**What:** Add `_injectCitationLinks()` to the existing `updated()` hook.

**Example:**
```typescript
// Source: devliot-article-page.ts lines 45-53
updated(changed: PropertyValues) {
  if (changed.has('_html') && this._html) {
    this.updateComplete.then(() => {
      this._injectHeadingAnchors();
      this._injectCitationLinks();  // NEW — after headings to respect DOM order
    });
  }
}
```

[VERIFIED: codebase — `updated()` at lines 45-53]

### Pattern 5: `scroll-margin-top` on reference entries

**What:** Reference entry list items need `scroll-margin-top` so the sticky header doesn't cover them when scrolled-to.

**Example:**
```css
/* Source: article.css lines 50-51 — existing h2/h3 pattern */
.ref-entry {
  scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem);
}
```

[VERIFIED: codebase — `src/styles/article.css` line 50, `--header-height` set by Phase 7 ResizeObserver]

### Anti-Patterns to Avoid

- **Regex on the raw HTML string before injection:** Fragile — regex cannot distinguish `[id]` in text versus attribute values like `data-id="[id]"`. Use DOM text-node traversal instead.
- **Using the raw `entry.id` string as anchor id:** Anchor ids must be `cite-N` / `ref-N` (numeric) for stability per UI-SPEC. Using `vaswani-2017` as id works, but id-based slugs may conflict with heading anchor ids in edge cases.
- **Re-running `_injectCitationLinks()` on every `updated()` call:** Add a guard (e.g. check if `.citation-link` already exists in the article) to avoid double-injection, same as the `heading.querySelector('.heading-anchor')` guard in `_injectHeadingAnchors()`.
- **Calling `scrollIntoView` on the `window`:** Must use `this.shadowRoot?.querySelector()` to find elements inside the Shadow DOM — `document.querySelector()` cannot see shadow-root children.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth scroll | Custom `requestAnimationFrame` scroll loop | `scrollIntoView({ behavior: 'smooth' })` | Native browser API, already used in Phase 7 — zero code, free on all modern browsers |
| Sticky header offset for scroll targets | Manual scroll position math | `scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem)` | CSS-only, already used on `h2, h3` in `article.css` — just add same rule to `.ref-entry` |
| DOM safe HTML string manipulation | Custom sanitizer | DOM text-node TreeWalker | Operates only on text nodes, never touches attributes or tag structure |

---

## Common Pitfalls

### Pitfall 1: Shadow DOM querySelector scope

**What goes wrong:** `document.querySelector('#cite-1')` returns null inside a Lit Shadow DOM component.

**Why it happens:** Shadow DOM is encapsulated — `document.querySelector` does not pierce it.

**How to avoid:** Always use `this.shadowRoot?.querySelector(...)`. Every existing DOM query in `devliot-article-page.ts` already uses this pattern (lines 126, 197, 213).

**Warning signs:** `null` returned from scroll target queries; `scrollIntoView` never fires.

### Pitfall 2: Double-injection in `updated()`

**What goes wrong:** `updated()` fires on every reactive state change. If `_bibliography` is updated after `_html` (they come from the same `_loadArticle()` call but `@state` changes are batched), citation links may be injected twice.

**Why it happens:** Lit batches `@state` updates, but timing is not guaranteed across two separate async fetches. In `_loadArticle()`, both `_html` and `_bibliography` are set in the same tick, so a single `updated()` call is expected — but a double-injection guard is still good practice.

**How to avoid:** Check `article.querySelector('.citation-link')` before injecting, or use a `_citationsInjected` flag reset in `_loadArticle()`. Mirror the `heading.querySelector('.heading-anchor')` guard in `_injectHeadingAnchors()`.

**Warning signs:** References appear doubled as `[1][1]` in the article body.

### Pitfall 3: `bibliography` not extracted in `_loadArticle()` reset block

**What goes wrong:** Navigating between articles leaves stale bibliography data from the previous article. The article body clears but references from article A still show on article B.

**Why it happens:** `_loadArticle()` resets all state at the top (lines 65-71) before fetching. If `_bibliography` is not reset there, it holds the old value during the fetch.

**How to avoid:** Add `this._bibliography = [];` to the reset block at the top of `_loadArticle()`, alongside the existing resets for `_tags`, `_authors`, etc.

**Warning signs:** Switching articles shows wrong references or duplicate references.

### Pitfall 4: `[id]` marker inside code blocks

**What goes wrong:** An article author writes `[vaswani-2017]` inside a `<devliot-code>` block or inline `<code>` tag. The TreeWalker visits text nodes inside code elements and incorrectly transforms them.

**Why it happens:** TreeWalker with `NodeFilter.SHOW_TEXT` visits ALL text nodes unless filtered.

**How to avoid:** In the TreeWalker, skip text nodes whose ancestor is a `<code>`, `<pre>`, or `devliot-code` element. Add a filter function to the TreeWalker that returns `NodeFilter.FILTER_REJECT` for these ancestors.

**Warning signs:** Code blocks show `[1]` links where `[vaswani-2017]` was written.

### Pitfall 5: `href="#ref-1"` navigates the outer page, not the shadow root

**What goes wrong:** Setting `href="#ref-1"` on a citation link causes the browser to navigate to `#ref-1` in the document, which doesn't exist outside the shadow root — either nothing happens or the scroll is wrong.

**Why it happens:** Standard hash navigation uses `document.getElementById()`, which cannot reach shadow DOM elements.

**How to avoid:** Use `href` as a non-functional attribute (for semantics) but intercept `click` with `e.preventDefault()` and call `this.shadowRoot?.querySelector('#ref-N')?.scrollIntoView(...)` manually. This is already the established pattern in `_injectHeadingAnchors()` (lines 147-153).

**Warning signs:** Clicking `[N]` jumps to page top or does nothing visible, URL changes to `#ref-1`.

---

## Code Examples

### CSS for the references section

```css
/* Source: mirrors .article-tags (article.css lines 172-180) */
.references {
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-xl);
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
}

.references h2 {
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  margin-bottom: var(--space-md);
  /* Override article.css h2 margin-top — no extra top margin inside .references */
  margin-top: 0;
}

.ref-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ref-entry {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  color: var(--color-text-muted);
  scroll-margin-top: calc(var(--header-height, 0px) + 0.75rem);
}

.ref-entry a {
  /* Title links in entries use standard article link style (--color-accent) */
  color: var(--color-accent);
  text-decoration: underline;
}

.citation-link {
  color: var(--color-text-muted);
  text-decoration: none;
  cursor: pointer;
}

.citation-link:hover {
  text-decoration: underline;
}

.ref-backlink {
  color: var(--color-text-muted);
  text-decoration: none;
  margin-left: var(--space-xs);
  cursor: pointer;
}

.ref-backlink:hover {
  text-decoration: underline;
}
```

[VERIFIED: codebase — all tokens confirmed in `src/styles/reset.css` and `src/styles/article.css`]

### State declaration

```typescript
// Source: devliot-article-page.ts @state pattern lines 19-25
import type { ArticleRegistry, Author, BibliographyEntry } from '../types/article.js';

@state() private _bibliography: BibliographyEntry[] = [];
```

---

## Runtime State Inventory

Not applicable — greenfield rendering phase. No rename, refactor, or migration.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (already installed) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/per-article-bibliography.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REF-01 | `bibliography[]` declared in `index.json`, TypeScript compiles | smoke | `npx tsc --noEmit` | ✅ (Phase 6 complete) |
| REF-02 | "Références" section visible with numbered entries | e2e | `npx playwright test tests/per-article-bibliography.spec.ts` | ❌ Wave 0 |
| REF-02 | Entry format per type (authors, title, publisher, year) | e2e | same | ❌ Wave 0 |
| REF-02 | Title with URL renders as link opening new tab | e2e | same | ❌ Wave 0 |
| REF-02 | No references section when `bibliography` absent/empty | e2e | same | ❌ Wave 0 |
| REF-03 | Inline `[N]` links appear in article body | e2e | same | ❌ Wave 0 |
| REF-03 | Click inline `[N]` scrolls to reference entry | e2e | same | ❌ Wave 0 |
| REF-03 | Each reference entry has `↩` back-link | e2e | same | ❌ Wave 0 |
| REF-03 | `↩` back-link scrolls to inline citation | e2e | same | ❌ Wave 0 |
| REF-03 | `[id]` with no bibliography match renders as plain text | e2e | same | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx playwright test tests/per-article-bibliography.spec.ts`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite (64 + new bibliography tests) green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/per-article-bibliography.spec.ts` — covers REF-02 and REF-03

*(No framework install gap — Playwright already installed and configured)*

---

## Existing Test Baseline

[VERIFIED: codebase — `tests/` directory listing] — 64 Playwright E2E tests across 7 files, all green after Phase 9. New bibliography tests must not break existing suite.

Pattern reference from `tests/per-article-authors.spec.ts`:
- `page.locator('devliot-article-page').locator('.article-byline')` — shadow-DOM piercing via Playwright auto-pierce
- `waitFor({ timeout: 10000 })` on `article h1` before asserting
- `boundingBox()` for positional assertions (element order)
- `getComputedStyle(el)` via `evaluate()` for CSS value assertions

These patterns transfer directly to bibliography tests. [VERIFIED: codebase]

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. Phase adds rendering logic and CSS within the existing Lit/Vite/Playwright stack. No new CLI tools, no external services, no new runtimes.

---

## Security Domain

This phase involves no authentication, no user input processing, no cryptography, and no new HTTP endpoints. The only surface is rendering `BibliographyEntry` data from `index.json` — a file the site author controls and that is already fetched and rendered.

ASVS categories V2/V3/V4/V6 do not apply.

**V5 Input Validation (minimal):** The `url` field in `BibliographyEntry` is rendered as `href` in an `<a>` tag. Since `index.json` is author-controlled static content (not user-submitted), no sanitization is strictly required beyond what the Lit template system provides. Lit's `html` tagged template escapes interpolated values in attribute position — `href="${entry.url}"` will not execute JavaScript from a `javascript:` URL in modern browsers because Lit does not set `href` via `setAttribute` for `javascript:` protocol. [ASSUMED — Lit security model; planner should note this is not a production CMS with arbitrary user URLs]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `innerHTML` regex for citation replacement | DOM TreeWalker text-node traversal | Phase 10 deliberate choice | Safer — no risk of corrupting HTML attributes |
| Hash-based SPA routing | Path-based routing (`/article/{slug}`) | Phase 7 | `href="#ref-1"` in shadow root cannot use browser hash navigation — must use `e.preventDefault()` + `scrollIntoView` |

---

## Open Questions

1. **Multiple occurrences of the same `[id]` in the article body**
   - What we know: `id` attributes must be unique in DOM; only first `cite-N` gets the id.
   - What's unclear: Should the second `[vaswani-2017]` in an article body also become `[1]` (visually correct) without an `id`?
   - Recommendation: Yes — transform all occurrences to `[N]` links pointing to `#ref-N`, but only assign `id="cite-N"` to the first occurrence. The `↩` back-link on `ref-N` navigates to `cite-N` (first occurrence). Acceptable for v2.0.

2. **`_bibliography` reactive state triggering double `updated()`**
   - What we know: `_html` and `_bibliography` are both set in `_loadArticle()`. Lit batches `@state` updates per tick. If both are set synchronously in the same task, a single `updated()` call is expected.
   - What's unclear: Race condition between HTML fetch and metadata fetch (two separate `try` blocks, but `_bibliography` is set in the second `try`).
   - Recommendation: Add a `_citationsInjected` flag reset in `_loadArticle()` and checked before injecting, mirroring the heading guard. Ensures safety regardless of `updated()` timing.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DOM TreeWalker text-node traversal is safe for `[id]` replacement inside Lit shadow DOM | Pattern 3, Pitfall 4 | If a future browser restricts TreeWalker in shadow roots, replacement strategy needs revision. Low risk — standard DOM API. |
| A2 | `_renderReferences()` format template (exact punctuation, field concatenation) matches D-03/D-07 intent | Pattern 2 | Planner should verify against D-07 table for each type. Visual deviation only, no functional risk. |
| A3 | Lit's `html` template escapes `href="${entry.url}"` safely for `javascript:` URLs | Security Domain | Site is author-controlled, not a CMS. Risk is negligible in this context. |

---

## Sources

### Primary (HIGH confidence)
- `src/pages/devliot-article-page.ts` — live codebase, all existing patterns verified by Read
- `src/types/article.ts` — `BibliographyEntry`, `Author`, `Article` interfaces verified
- `src/styles/article.css` — all CSS tokens and patterns verified
- `src/styles/reset.css` — all design tokens verified
- `public/articles/index.json` — demo bibliography data verified (3 entries, all types)
- `public/articles/01-demo-article/index.html` — inline markers `[vaswani-2017]`, `[bringhurst-2004]`, `[lit-docs]` verified at lines 3, 24, 58
- `.planning/phases/10-per-article-bibliography/10-CONTEXT.md` — all decisions D-01 through D-16 read directly
- `.planning/phases/10-per-article-bibliography/10-UI-SPEC.md` — CSS classes, typography, spacing, anchor IDs verified

### Secondary (MEDIUM confidence)
- Phase 6 CONTEXT.md D-04 through D-16 — data contract confirmed: `bibliography?: BibliographyEntry[]` optional, `id` slug-pattern, type union
- Phase 7 patterns — `_injectHeadingAnchors()`, `scrollIntoView`, `scroll-margin-top` use confirmed from codebase

### Tertiary (LOW confidence)
- None. All claims derive from direct codebase read.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase read directly, zero new dependencies
- Architecture: HIGH — all patterns present verbatim in `devliot-article-page.ts`
- Pitfalls: HIGH — derived from reading existing code and shadow DOM behavior known from Phase 7
- CSS: HIGH — all tokens verified in `reset.css` and `article.css`

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable stack — Lit 3.3.1, no upstream changes expected)
