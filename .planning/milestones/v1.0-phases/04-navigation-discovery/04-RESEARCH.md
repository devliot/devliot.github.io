# Phase 4: Navigation & Discovery - Research

**Researched:** 2026-04-14
**Domain:** Client-side filtering, search indexing, Lit reactive state, hash-based URL query params
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Compact list on the home page — one line per article showing date, tag/category, title, and tags below. Dense and scannable, fits the minimalist brand.
- **D-02:** Hero section (ASCII logo + tagline) stays above the article list. First impression stays branded.
- **D-03:** Articles ordered newest first (reverse chronological).
- **D-04:** Tags and categories are the same thing — one flat set of filter chips derived from article tags. No separate "category" concept.
- **D-05:** Filter chips appear above the article list (All | IA | Java | Tutorial...). Clicking a chip filters the list in-place. No page change, no new route needed.
- **D-06:** Clicking a tag on an article page or in the listing applies the same filter (navigates to home with that tag active).
- **D-07:** Search input lives in the sticky header — always accessible from any page, not just home. Search icon expands to input on click.
- **D-08:** Search covers title + full article body text + tags. Full-text search via FlexSearch.
- **D-09:** Search index built at build time from all article HTML content. Loaded lazily at runtime.
- **D-10:** Empty filter/search results show "No articles found." — simple text, consistent with existing error state pattern.

### Claude's Discretion
- Search result display format (inline dropdown vs filtered list)
- FlexSearch index generation approach (build script vs Vite plugin)
- Filter chip active state styling (within grayscale palette)
- Debounce timing for search input

### Deferred Ideas (OUT OF SCOPE)
- Article sources/references — Bibliography or reference links at the bottom of articles. Belongs in Phase 5.
- Article co-authors — Name (or pseudo) + link to GitHub/LinkedIn/other profile per article. Belongs in Phase 5.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | Navigation par catégorie (IA, Java, Maths...) | Filter chip strip derived from tags; single-select chip activates tag filter on article list |
| NAV-02 | Liste chronologique des articles (plus récent en premier) | Sort articles by `date` field descending from `index.json` before render |
| NAV-03 | Système de tags transversaux | Tags and categories unified in D-04; clicking a tag navigates to `/#/?tag={tag}`; hash router must parse query params within hash fragment |
| NAV-04 | Recherche full-text client-side | FlexSearch Document index; data JSON generated at build time; index built in browser at lazy-load time; debounced 200ms real-time filtering |
</phase_requirements>

---

## Summary

Phase 4 adds article discovery to the home page: a compact article list, filter chips, and a full-text search input. All existing infrastructure (HashRouter, article `index.json`, CSS design tokens, Playwright tests) is in place and reusable. No new routes are required — filtering and search operate on the existing `/` route via URL query parameters encoded within the hash fragment.

The most significant implementation constraint is the custom `HashRouter`. It currently strips the path from the hash but does not parse query parameters embedded in the hash fragment (e.g., `/#/?tag=Java`). The router's `_onHashChange` must be extended to separate the path segment from query params so the home page can read `tag` and `q` values reactively. This is a contained change to one file.

FlexSearch is the locked search library. The current latest version is **0.8.212** (September 2025), which is a breaking change from the 0.7.x API mentioned in CLAUDE.md. For this phase's use case (client-side only, no DB persistence), the recommended approach is: generate a pre-processed JSON file (`search-data.json`) at build time containing article slugs, titles, tags, and stripped body text, then build the FlexSearch Document index in the browser when the user first opens search — avoiding the export/import complexity entirely.

**Primary recommendation:** Extend the HashRouter to support hash query params, build a Vite-integrated build script to generate `search-data.json`, and implement three Lit components (article list, filter chips, search input) using existing CSS design tokens.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lit` | 3.3.2 | Web component authoring | Non-negotiable per CLAUDE.md |
| `flexsearch` | 0.8.212 | Client-side full-text search | Locked per D-08/D-09 in CONTEXT.md |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 6.0.2 (via Vite) | Type safety | All source files in `src/` |
| `vite` | 8.0.8 | Build + dev server | Already configured |
| `@playwright/test` | 1.59.1 | E2E tests | Phase verification tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Build-time search-data.json | FlexSearch export/import pre-built index | Export/import works for simple `Index` but Document-Indexes not fully supported for fast-boot serialization per FlexSearch docs. Simpler to ship raw data and index client-side for < 100 articles. |
| Inline filter state in `devliot-home-page` | Separate `devliot-filter-chips` component | Separate component is cleaner but requires cross-component communication for tag click from article rows — inline state in home page avoids event bubbling complexity |

**Installation:**
```bash
npm install flexsearch
```

**Version verification:** [VERIFIED: npm registry]
```
npm view flexsearch version  → 0.8.212  (published 2025-09-06)
npm view flexsearch@0.7.43 version → 0.7.43 (last 0.7.x, 2022-10-03)
```

> **CLAUDE.md states "0.7.x" for FlexSearch but latest is 0.8.212 (March–September 2025 releases).** The 0.8.x API changed: `Document` constructor now uses `document: { id, index: [...] }` structure. Use 0.8.x — do not pin to stale 0.7.x.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── pages/
│   └── devliot-home-page.ts     # Extended: hero + filter chips + article list (filter/search state here)
├── components/
│   ├── devliot-header.ts        # Extended: search icon + collapsible input
│   └── devliot-article-list.ts  # New: renders article rows, emits tag-click events
├── styles/
│   ├── home.css                 # Extended: article list + filter chip styles
│   └── header.css               # Extended: search input expand/collapse styles
└── utils/
    └── hash-router.ts           # Extended: parse query params within hash fragment

public/
└── search-data.json             # NEW: generated by build script, loaded lazily

scripts/
└── build-search-index.mjs      # NEW: Node.js script, runs after vite build
```

### Pattern 1: Hash Query Params (critical — current router does not support this)

**What:** The current `HashRouter._onHashChange` parses `window.location.hash` and extracts only the pathname. URLs like `/#/?tag=Java` have query params WITHIN the hash fragment that the router ignores today.

**What goes wrong today:** `/#/?tag=Java` — `hash.slice(1)` gives `/?tag=Java`, which is passed to `_match('/', '/?tag=Java')` and fails to match because `"?tag=Java" !== ""`.

**Fix required:** Split the hash fragment into path and search before matching:

```typescript
// Source: analysis of hash-router.ts lines 29-35
private _onHashChange = () => {
  const hash = window.location.hash;
  const raw = hash ? hash.slice(1) || '/' : '/';
  // NEW: separate path from query string within hash
  const [pathPart, queryPart] = raw.split('?');
  this.currentPath = pathPart.length > 1 && pathPart.endsWith('/') ? pathPart.slice(0, -1) : (pathPart || '/');
  this.currentQuery = queryPart ? new URLSearchParams(queryPart) : new URLSearchParams();
  this.host.requestUpdate();
};
```

The `currentQuery` must be exposed so `devliot-home-page` can read `tag` and `q` on mount and on hash change.

### Pattern 2: FlexSearch 0.8.x Document Index (browser-side)

**What:** Build a `Document` index in the browser from pre-processed JSON. No export/import needed.

**When to use:** On first search interaction (lazy init). Index `search-data.json` on demand.

```typescript
// Source: [CITED: https://raw.githubusercontent.com/nextapps-de/flexsearch/master/doc/document-search.md]
import { Document } from 'flexsearch';

const index = new Document({
  document: {
    id: 'slug',
    index: [
      { field: 'title', tokenize: 'forward' },
      { field: 'body',  tokenize: 'strict'  },
      { field: 'tags',  tokenize: 'strict'  },
    ],
    store: ['slug', 'title', 'date', 'tags'],
  }
});

// Add all articles from search-data.json
for (const article of searchData) {
  index.add(article);
}

// Search — returns array of objects: [{ field: 'title', result: ['slug1', ...] }, ...]
const raw = index.search('query', { enrich: false });
// Merge results across fields into deduplicated slug set
const slugs = new Set(raw.flatMap(r => r.result as string[]));
```

### Pattern 3: Build-Time Search Data Generation

**What:** A Node.js script reads `public/articles/index.json`, fetches each article's `index.html`, strips HTML tags to plain text, and writes `public/search-data.json`.

**When to use:** Run as part of `npm run build` via `vite.config.ts` plugin hook or as a standalone `prebuild` script.

**Recommended approach:** Standalone `scripts/build-search-index.mjs` called from `package.json`:

```json
"scripts": {
  "build": "node scripts/build-search-index.mjs && tsc && vite build"
}
```

```javascript
// scripts/build-search-index.mjs
// Source: [ASSUMED] — standard Node.js pattern for static site index generation
import { readFileSync, writeFileSync } from 'fs';

const registry = JSON.parse(readFileSync('public/articles/index.json', 'utf8'));
const searchData = registry.articles.map(article => {
  const html = readFileSync(`public/articles/${article.slug}/index.html`, 'utf8');
  // Strip HTML tags for plain text body
  const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { ...article, body };
});

writeFileSync('public/search-data.json', JSON.stringify(searchData), 'utf8');
```

### Pattern 4: Lit Reactive State for Filter + Search

**What:** `devliot-home-page` owns all filter/search state as `@state()` properties. No external state library needed.

```typescript
// Source: [VERIFIED: lit.dev decorators pattern]
@state() private _activeTag: string | null = null;
@state() private _searchQuery = '';
@state() private _articles: Article[] = [];
@state() private _searchIndex: Document | null = null;
```

On hash change (via controller or `connectedCallback`), read URL params and set state. Lit's reactive update cycle re-renders the filtered list automatically.

### Pattern 5: Tag Navigation Across Pages

**What:** Clicking a tag anywhere (article row, article page) navigates to `/#/?tag={tag}`. This works because:
1. The hash change fires `_onHashChange` in the router
2. Home page reads `tag` from `currentQuery` and activates that filter

From article page, a tag click dispatches:
```typescript
window.location.hash = `/?tag=${encodeURIComponent(tag)}`;
```

### Anti-Patterns to Avoid

- **Separate route per tag:** Do NOT create `/tag/:name` routes. D-05 locked: filter in-place on home page via query param. Adding routes would break the hash router's path-matching pattern.
- **FlexSearch export/import for Document index:** The FlexSearch docs explicitly state Document-Indexes are "not supported yet" for fast-boot serialization. Ship raw JSON, index at runtime.
- **Accessing `window.location.search` for hash query params:** The article page correctly uses `window.location.search` for `?section=` because that param is BEFORE the `#`. But `?tag=` and `?q=` are AFTER `#` (within the hash fragment) and must be parsed from `window.location.hash`, not `window.location.search`.
- **Blocking render on FlexSearch load:** Load `search-data.json` and init the index lazily (on first search interaction). Never block the initial article list render.
- **Modifying `index.json` schema:** `public/articles/index.json` is the canonical article registry. The build script should generate `search-data.json` as a separate file, not augment `index.json`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search tokenization | Custom substring match loop | FlexSearch Document index | Edge cases: accents, word boundaries, partial matches, performance at scale |
| HTML tag stripping for body text | Complex regex | `replace(/<[^>]+>/g, ' ')` is sufficient for plain blog HTML | Simpler; `DOMParser` in Node requires jsdom dependency |

**Key insight:** The filtering (by tag) is pure array filter — no library needed. Only full-text search (NAV-04) requires FlexSearch.

---

## Common Pitfalls

### Pitfall 1: Hash Router Does Not Parse Hash Query Params
**What goes wrong:** Navigating to `/#/?tag=Java` renders a 404 instead of the home page with active filter because `_match('/', '/?tag=Java')` fails path comparison.
**Why it happens:** The router splits the path on `/` without first stripping the query string. `"?tag=Java"` is not `""`.
**How to avoid:** Extend `_onHashChange` to split on `?` before matching. Expose parsed `URLSearchParams` from the router.
**Warning signs:** Filter chip URLs don't activate on direct navigation or page refresh.

### Pitfall 2: FlexSearch 0.8.x Breaking API Change
**What goes wrong:** Code written for 0.7.x uses `new Document({ document: { field: [...] } })` but 0.8.x changed the constructor options schema.
**Why it happens:** CLAUDE.md recommends 0.7.x but npm latest is 0.8.212 (released March 2025). 0.7.43 is still available but 2+ years stale.
**How to avoid:** Use 0.8.212. Use `document: { id: 'slug', index: [{ field: 'title' }, ...] }` constructor pattern. Verify with 0.8.x docs.
**Warning signs:** `index.add()` silently drops documents, or `index.search()` returns unexpected structure.

### Pitfall 3: FlexSearch Document Search Returns Per-Field Arrays
**What goes wrong:** `index.search('query')` returns `[{ field: 'title', result: [...] }, { field: 'body', result: [...] }]` — an array of per-field results, not a flat array.
**Why it happens:** Multi-field Document index returns results grouped by field by default.
**How to avoid:** Always merge with `raw.flatMap(r => r.result)` + `new Set(...)` to deduplicate.
**Warning signs:** Duplicate articles appearing in search results, or `results.includes(slug)` always returns false.

### Pitfall 4: Shadow DOM Event Bubbling for Tag Clicks
**What goes wrong:** Clicking a tag inside `devliot-article-list` (shadow DOM) fires an event that doesn't bubble past the shadow root to `devliot-home-page`.
**Why it happens:** Custom events do not cross shadow DOM boundaries by default.
**How to avoid:** Dispatch custom events with `bubbles: true, composed: true`, or handle tag clicks by calling `window.location.hash` directly inside the component.
**Warning signs:** Tag click in article row has no visible effect on filter chips.

### Pitfall 5: `search-data.json` Not Available in Dev Mode
**What goes wrong:** `npm run dev` starts Vite without running the build script, so `public/search-data.json` doesn't exist. Search throws a 404 on first use.
**Why it happens:** The build script only runs in `npm run build`.
**How to avoid:** Either check-in a minimal `search-data.json` to git, or run the script as a Vite plugin `buildStart` hook that also runs in dev mode, or document that devs must run `node scripts/build-search-index.mjs` before `npm run dev`.

### Pitfall 6: Filter + Search Simultaneous State (AND logic)
**What goes wrong:** When both `_activeTag` and `_searchQuery` are set, naive implementations apply only one filter.
**Why it happens:** Treating tag filter and search as independent pipelines.
**How to avoid:** Apply both filters sequentially: first filter by tag, then filter the result by search hits (UI spec: AND logic, both must match).
**Warning signs:** Tag chip has no effect when search input is non-empty.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### FlexSearch 0.8.x Document Index Setup
```typescript
// Source: [CITED: https://github.com/nextapps-de/flexsearch/blob/master/doc/document-search.md]
import { Document } from 'flexsearch';

interface SearchEntry {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  body: string; // stripped HTML
}

const index = new Document<SearchEntry>({
  document: {
    id: 'slug',
    index: [
      { field: 'title', tokenize: 'forward' },
      { field: 'body',  tokenize: 'strict'  },
      { field: 'tags',  tokenize: 'strict'  },
    ],
  }
});
```

### Merging Multi-Field Search Results
```typescript
// Source: [CITED: FlexSearch document-search.md — multi-field results]
type FieldResult = { field: string; result: string[] };

function searchArticles(index: Document<SearchEntry>, query: string): Set<string> {
  if (!query.trim()) return new Set(); // empty = no filter
  const raw = index.search(query, { limit: 50 }) as FieldResult[];
  return new Set(raw.flatMap(r => r.result));
}
```

### Hash Router Extension for Query Params
```typescript
// Source: [VERIFIED: analysis of src/utils/hash-router.ts]
// Add to HashRouter class:
private currentQuery = new URLSearchParams();

private _onHashChange = () => {
  const hash = window.location.hash;
  const raw = hash ? hash.slice(1) || '/' : '/';
  const qIdx = raw.indexOf('?');
  const pathPart = qIdx === -1 ? raw : raw.slice(0, qIdx);
  const queryPart = qIdx === -1 ? '' : raw.slice(qIdx + 1);
  this.currentPath = pathPart.length > 1 && pathPart.endsWith('/')
    ? pathPart.slice(0, -1) : (pathPart || '/');
  this.currentQuery = new URLSearchParams(queryPart);
  this.host.requestUpdate();
};

getQuery(): URLSearchParams {
  return this.currentQuery;
}
```

### Filter Chip "All" + Single-Select Logic
```typescript
// Source: [ASSUMED] — standard Lit reactive property pattern
private _setActiveTag(tag: string | null): void {
  const next = tag === this._activeTag ? null : tag;
  this._activeTag = next;
  const hash = next ? `/?tag=${encodeURIComponent(next)}` : '/';
  window.location.hash = hash;
}
```

### Lazy Search Initialization
```typescript
// Source: [ASSUMED] — lazy loading pattern from Phase 3 components
private async _initSearch(): Promise<void> {
  if (this._searchIndex) return; // already initialized
  const res = await fetch(`${import.meta.env.BASE_URL}search-data.json`);
  const data: SearchEntry[] = await res.json();
  this._searchIndex = new Document({ /* config */ });
  for (const entry of data) this._searchIndex.add(entry);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FlexSearch 0.7.x (CLAUDE.md) | FlexSearch 0.8.x (npm latest) | March 2025 | Breaking API change in Document constructor; must use 0.8.x syntax |
| Vaadin Router | `@lit-labs/router` | November 2024 | Vaadin abandoned; already handled in prior phases via custom HashRouter |
| Separate "category" + "tags" data model | Unified flat tags (D-04) | Phase 4 decision | Simplifies filter chip derivation — one Set from `article.tags` |

**Deprecated/outdated:**
- FlexSearch 0.7.43: Last release October 2022. Works but stale. 0.8.0 released March 2025 with new API.
- `@lit-labs/router`: Available but custom HashRouter already built in Phase 1. Do not replace it — extend it.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FlexSearch 0.8.x Document index search() returns `[{ field, result }]` array, not flat array | Code Examples | Search integration fails silently or throws — need to verify against installed 0.8.x docs |
| A2 | Running `node scripts/build-search-index.mjs` before `npm run dev` is acceptable DX (no auto-run in dev mode) | Common Pitfalls | Developer frustration; search always 404s in dev without documentation |
| A3 | Stripping HTML tags with `replace(/<[^>]+>/g, ' ')` produces adequate search body text | Architecture Patterns | Custom web component tags (devliot-code, devliot-math) inner text will be included, which is fine for search accuracy |
| A4 | FlexSearch `Document` type from `import { Document } from 'flexsearch'` works as ESM in Vite without additional config | Standard Stack | May need `optimizeDeps` in vite.config.ts if FlexSearch is not ESM-compatible by default |

---

## Open Questions

1. **FlexSearch 0.8.x ESM compatibility with Vite**
   - What we know: FlexSearch 0.8.x exports `./dist/flexsearch.bundle.module.min.mjs` as the ESM target
   - What's unclear: Whether Vite 8 needs `optimizeDeps.include` for FlexSearch or whether it works out of the box
   - Recommendation: Try bare `import { Document } from 'flexsearch'` first. If Vite throws a CJS/ESM error, add `optimizeDeps: { include: ['flexsearch'] }` to `vite.config.ts`.

2. **Build script placement: `prebuild` vs Vite plugin hook**
   - What we know: `prebuild` npm hook runs before `tsc && vite build`; Vite plugin `buildStart` hook fires in both dev and build modes
   - What's unclear: Whether the Vite plugin approach is worth the added complexity for this phase
   - Recommendation: Use `prebuild` npm script for simplicity. If dev-mode search becomes a pain point, convert to Vite plugin in a later phase.

3. **HashRouter: expose `getQuery()` vs pass query to route render function**
   - What we know: Current router passes path params to `render(params)`. Query params are not passed.
   - What's unclear: The cleanest extension point — modify `Route.render` signature, or expose a separate `getQuery()` method
   - Recommendation: Add `getQuery(): URLSearchParams` method to `HashRouter` without changing the `render` signature. Home page calls `this.router.getQuery()` inside its own `render()` method.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build script generation | Yes | 22.14.0 | — |
| npm | Package install | Yes | 10.9.2 | — |
| Vite dev server | E2E tests (playwright) | Yes | 8.0.8 | — |
| Playwright | Phase verification tests | Yes | 1.59.1 | — |
| FlexSearch | Client-side search (NAV-04) | No (not installed) | — | Must install: `npm install flexsearch` |

**Missing dependencies with no fallback:**
- FlexSearch: Required for NAV-04. Install in Wave 0.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | `playwright.config.ts` (exists) |
| Quick run command | `npm run test-e2e` (runs Chromium project only) |
| Full suite command | `npm run test-e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Clicking a category chip filters article list to matching articles only | E2E | `npm run test-e2e -- --grep "NAV-01"` | No — Wave 0 |
| NAV-02 | Home page article list shows articles newest-first | E2E | `npm run test-e2e -- --grep "NAV-02"` | No — Wave 0 |
| NAV-03 | Clicking a tag on an article shows all articles sharing that tag | E2E | `npm run test-e2e -- --grep "NAV-03"` | No — Wave 0 |
| NAV-04 | Typing in search box filters visible articles in real time | E2E | `npm run test-e2e -- --grep "NAV-04"` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test-e2e` (full suite — only 2 existing test files, fast)
- **Per wave merge:** `npm run test-e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/navigation-discovery.spec.ts` — covers NAV-01, NAV-02, NAV-03, NAV-04
- [ ] `public/search-data.json` — must exist before E2E tests can exercise search

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — public blog, no auth |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a |
| V5 Input Validation | yes | Search input: sanitize display output; FlexSearch queries are not SQL so injection risk is nil, but rendered results must use Lit's auto-escaping (no `unsafeHTML` for search-derived content) |
| V6 Cryptography | no | n/a |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via search query displayed in UI | Tampering | Lit templates auto-escape interpolated values — never use `unsafeHTML` to display `_searchQuery` or article titles from search results |
| Path traversal via tag/query URL params | Tampering | Tags are used as filter predicates against a pre-loaded array, not as file paths — no risk. Search query fed to FlexSearch, not a file system call. |
| Open redirect via `?tag=` manipulation | Spoofing | Tag chips navigate to `/#/?tag=...` (hash-only) — never used for external redirect |

---

## Sources

### Primary (HIGH confidence)
- `src/utils/hash-router.ts` — Full source code, verified path-matching behavior
- `src/devliot-app.ts` — Route configuration
- `src/pages/devliot-home-page.ts` — Current home page (hero-only, no article list)
- `src/components/devliot-header.ts` — Current header (hamburger only, no search)
- `public/articles/index.json` — Article registry schema
- `src/styles/reset.css` — All CSS design tokens
- `playwright.config.ts` — Test infrastructure
- `package.json` — Installed dependencies and scripts
- `tsconfig.json` — TypeScript configuration
- `vite.config.ts` — Build configuration (base: '/devliot/')

### Secondary (MEDIUM confidence)
- [CITED: https://raw.githubusercontent.com/nextapps-de/flexsearch/master/doc/document-search.md] — FlexSearch 0.8.x Document index API
- [CITED: https://raw.githubusercontent.com/nextapps-de/flexsearch/master/doc/export-import.md] — FlexSearch export/import limitations for Document indexes
- [VERIFIED: npm registry] — FlexSearch 0.8.212 is latest (2025-09-06), 0.7.43 is stale (2022-10-03)

### Tertiary (LOW confidence)
- FlexSearch 0.8.x TypeScript generic syntax `new Document<T>()` — assumed from documentation patterns; requires validation after install

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry; FlexSearch API cited from official docs
- Architecture: HIGH — based on direct codebase analysis; hash router pitfall verified by code reading
- Pitfalls: HIGH — hash router bug confirmed by code path analysis; FlexSearch API change confirmed by version dates

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (FlexSearch is under active development at 0.8.x — re-verify if implementation delayed > 30 days)
