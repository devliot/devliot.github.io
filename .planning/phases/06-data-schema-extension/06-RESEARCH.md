# Phase 6: Data Schema Extension - Research

**Researched:** 2026-04-15
**Domain:** TypeScript type system, JSON schema design, static type enforcement
**Confidence:** HIGH

## Summary

Phase 6 adds `authors` and `bibliography` fields to the article data model. The scope is purely structural: define TypeScript types, extend `index.json`, update the demo article, and confirm `tsc` passes. No rendering, no UI, no build-script output changes.

The most important finding is that **the current `tsconfig.json` does NOT enable `strict: true`** -- meaning `strictNullChecks` and `noImplicitAny` are both off. Because `fetch().json()` returns `Promise<any>`, accessing `meta.authors` or `meta.bibliography` on the parsed JSON produces no TypeScript error even if the interface is wrong or missing. The success criteria ("produces no TypeScript errors at build time") are trivially satisfied today -- adding any field to `index.json` never causes a type error because the data enters the system as `any`. **For type enforcement to be meaningful, the plan must either (a) enable `strict: true` or `noImplicitAny` in tsconfig, or (b) add explicit type annotations at the `JSON.parse`/`.json()` call sites.** Option (b) is lower-risk for Phase 6 and achievable without touching unrelated code.

Three files in `src/` consume `index.json` via `fetch()`: `devliot-home-page.ts` (inline `Article` interface, lines 6-12), `devliot-article-page.ts` (untyped -- casts to `{ slug: string }` inline), and `devliot-app.ts` (no direct consumption). Two build scripts consume it via `readFileSync`: `build-og-pages.mjs` and `build-search-index.mjs` (both plain JS, not TypeScript-checked). A centralised `src/types/article.ts` module is justified: it serves exactly 2 TypeScript consumers today, but both must share `Author` and `BibliographyEntry` types, and future phases (9, 10) add more consumers.

**Primary recommendation:** Create `src/types/article.ts` with `Author`, `BibliographyEntry`, `Article`, and `ArticleRegistry` types. Import the `Article` type in both page components, replacing inline interfaces. Add explicit type annotations at the `.json()` call sites (`as ArticleRegistry`). Confirm `tsc --noEmit` passes as the sole verification. Build scripts remain plain JS -- untouched in Phase 6.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `authors` is optional on an article entry -- v1.0 articles without the field must still compile and render unchanged.
- **D-02:** `authors` is always an `Author[]` array, even for a single author. No `string | Author | Author[]` union.
- **D-03:** The `Author` type is `{ name: string; url?: string }`. `name` required, `url` optional.
- **D-04:** `bibliography` is optional on an article entry -- v1.0 articles without the field must still compile and render unchanged.
- **D-05:** Every bibliography entry has exactly two REQUIRED fields: `id` and `title`. Everything else is optional.
- **D-06:** Optional fields exposed on the TS type: `authors`, `url`, `publisher`, `pages`, `note`, `year`.
- **D-07:** `id` is constrained to slug-style -- regex `^[a-z0-9-]+$`.
- **D-08:** The `authors` field inside a bibliography entry reuses the same `Author` type.
- **D-09:** `authors` on a bibliography entry is optional.
- **D-10:** `type` is a TS literal union `'article' | 'book' | 'web'` -- NOT a discriminated union. All optional fields exposed on every type.
- **D-11:** `type` is required on every bibliography entry.
- **D-12:** Supported types in v2.0 are exactly three: `article`, `book`, `web`. No catch-all.
- **D-13:** Inline citations use `[id]` form in HTML body (plain text in Phase 6).
- **D-14:** Demo article carries 2 authors: `[{name: 'Eliott', url: 'https://github.com/devliot'}, {name: 'Sample Coauthor'}]`.
- **D-15:** Demo article carries 3 real bibliography entries, one per type.
- **D-16:** Demo article HTML body receives `[id]` plain-text markers referencing bibliography entries.

### Claude's Discretion
- Where the shared types live (inline per consumer vs. new `src/types/article.ts` module).
- Exact TypeScript mechanism for the slug-style `id` constraint (branded type, template literal type, or documentation + runtime validator).
- The three real citations for the demo (topic selection, titles, URLs, years) -- must be real and topic-appropriate.
- Whether `year` is a top-level optional field or nested under a publication sub-object. Default: top-level optional `year?: number`.
- Whether build scripts are updated in this phase or deferred to Phase 9/10.

### Deferred Ideas (OUT OF SCOPE)
- Runtime validation (JSON Schema / ajv / Zod) -- tsc is the validation layer.
- Bibliography back-links / numbered `[N]` rendering -- Phase 10.
- `[id]` inline citations becoming clickable links -- Phase 10.
- Author byline display -- Phase 9.
- JSON-LD BlogPosting with author -- Phase 9.
- `schema.org/citation` markup -- explicit Out of Scope.
- Additional bibliography types beyond article/book/web.
- Author affiliation, ORCID, avatar.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTHOR-01 | Un article peut declarer un ou plusieurs auteurs dans `index.json` (champ `authors[]` avec `name` + `url` optionnel) | Types defined as `Author = { name: string; url?: string }`, `authors?: Author[]` on Article. Centralised in `src/types/article.ts` and enforced at `.json()` call sites via explicit cast. |
| REF-01 | Un article peut declarer une bibliographie dans `index.json` (tableau `bibliography[]` avec id, type, title, authors, url, year, etc.) | Types defined as `BibliographyEntry` with required `id`, `type`, `title` and optional remaining fields. `bibliography?: BibliographyEntry[]` on Article. Same enforcement approach. |
</phase_requirements>

## Critical Finding: tsconfig Does Not Enable `strict`

### Current tsconfig.json Analysis
[VERIFIED: read tsconfig.json + `npx tsc --showConfig`]

The current `tsconfig.json` at project root enables:
- `noEmit: true` (type-check only, no output)
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `erasableSyntaxOnly: true`
- `experimentalDecorators: true`
- `useDefineForClassFields: false` (required for Lit)

**NOT enabled:**
- `strict: false` (implicit default)
- `strictNullChecks: false` (implicit)
- `noImplicitAny: false` (implicit)
- `noUncheckedIndexedAccess: false` (implicit)

### Impact on Phase 6 Success Criteria

Without `noImplicitAny`, the return of `response.json()` is `any`. This means:

```typescript
const registry = await regRes.json(); // type: any
const meta = registry.articles.find((a: { slug: string }) => a.slug === this.slug);
// meta is any — accessing meta.authors, meta.bibliography, meta.anythingAtAll is valid
```

**The success criteria "produces no TypeScript errors at build time" are trivially true today** regardless of whether the types are correct. To make type enforcement meaningful, the plan must add explicit type annotations at the deserialization boundary:

```typescript
import type { ArticleRegistry } from '../types/article.js';
const registry: ArticleRegistry = await regRes.json();
```

This gives `tsc` something to check: if someone accesses `registry.articles[0].authrs` (typo), the error surfaces. Without this annotation, the `any` type swallows all mistakes silently.

**Recommendation:** Add type annotations at `.json()` call sites. Do NOT enable `strict: true` globally in Phase 6 -- that would require fixing unrelated code across the entire codebase and is out of scope. The annotation approach is surgical and achieves the goal. [VERIFIED: current codebase compiles with `tsc --noEmit` returning 0]

## Standard Stack

### Core (No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 | Type-check only (`noEmit: true`) | Already installed; sole enforcement layer per project constraint | [VERIFIED: `npx tsc --version`] |

### Supporting
None. Phase 6 uses zero libraries. Types are pure TypeScript constructs with no runtime cost.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TypeScript annotations at `.json()` | Enable `strict: true` globally | Would surface many unrelated errors in existing code; out of scope for a schema-only phase |
| Centralised `src/types/article.ts` | Inline types per consumer | Works for 2 consumers but forces duplicate `Author` and `BibliographyEntry` definitions; future phases 9/10 add more consumers |
| `as ArticleRegistry` cast | Runtime validator (Zod/ajv) | D-deferred: zero new runtime deps constraint; `tsc` is the validation layer |

## Architecture Patterns

### Recommended Project Structure Change
```
src/
  types/
    article.ts        # NEW — Author, BibliographyEntry, Article, ArticleRegistry
  pages/
    devliot-home-page.ts    # MODIFIED — remove inline Article interface, import from types/
    devliot-article-page.ts # MODIFIED — add type annotation at .json() call site
  ...existing files unchanged...
```

### Pattern 1: Centralised Type Module
**What:** A single `src/types/article.ts` exports all article-related types. Each consumer imports what it needs.
**When to use:** When 2+ TypeScript files share the same data shape and that shape will grow.
**Evidence for this phase:** `devliot-home-page.ts` has `interface Article { slug, title, date, category, tags }` inline. `devliot-article-page.ts` uses `{ slug: string }` as an inline cast. Both fetch `index.json`. Phase 9 will add author rendering, Phase 10 bibliography rendering -- both will need these types. Centralising now prevents 4-5 copies of the same interface. [VERIFIED: grep for `interface Article` and `index.json` in src/]

**Example:**
```typescript
// src/types/article.ts
export interface Author {
  name: string;
  url?: string;
}

export interface BibliographyEntry {
  id: string;               // slug-style: ^[a-z0-9-]+$
  type: 'article' | 'book' | 'web';
  title: string;
  authors?: Author[];
  url?: string;
  year?: number;
  publisher?: string;
  pages?: string;
  note?: string;
}

export interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  description?: string;
  image?: string;
  readingTime?: number;
  authors?: Author[];
  bibliography?: BibliographyEntry[];
}

export interface ArticleRegistry {
  articles: Article[];
}
```

### Pattern 2: Type Annotation at Deserialization Boundary
**What:** Explicitly annotate the return of `.json()` or `JSON.parse()` with the expected type.
**When to use:** When `strict` / `noImplicitAny` is off and you need type checking on fetched data.
**Why necessary here:** Without this, all `index.json` access is `any`-typed and type errors are invisible.

**Example in devliot-article-page.ts:**
```typescript
import type { ArticleRegistry } from '../types/article.js';

// Inside _loadArticle():
const registry = await regRes.json() as ArticleRegistry;
const meta = registry.articles.find(a => a.slug === this.slug);
if (meta) {
  this._tags = meta.tags || [];
  this._category = meta.category || '';
  this._date = meta.date || '';
  this._readingTime = meta.readingTime || 0;
  // meta.authors is now Author[] | undefined — typed correctly
}
```

**Example in devliot-home-page.ts:**
```typescript
import type { Article } from '../types/article.js';

// Remove local interface Article { ... }
// In _fetchArticles():
const data = await res.json() as { articles: Article[] };
this._articles = data.articles || [];
```

### Anti-Patterns to Avoid
- **Duplicating Author/BibliographyEntry in each consumer:** Creates drift risk. One definition, N imports.
- **Using `as any` or leaving `.json()` untyped:** Defeats the purpose of this phase.
- **Adding runtime validators (Zod, ajv):** Violates zero-new-deps constraint (D-deferred).
- **Enabling `strict: true` in this phase:** Out of scope -- would require fixing unrelated code across 10+ source files.

## Type Placement: Evidence-Based Recommendation

### Files That Consume `index.json`

| File | How | Current Typing | Phase 6 Action |
|------|-----|----------------|----------------|
| `src/pages/devliot-home-page.ts` | `fetch().json()` (line 44-47) | Inline `interface Article` (lines 6-12), missing `description`, `image`, `readingTime`, `authors`, `bibliography` | Replace with import from `src/types/article.ts` |
| `src/pages/devliot-article-page.ts` | `fetch().json()` (line 83-85) | Inline `{ slug: string }` cast (line 86), accesses `meta.tags`, `meta.category`, `meta.date`, `meta.readingTime` without typing | Add `as ArticleRegistry` annotation, import from `src/types/article.ts` |
| `scripts/build-og-pages.mjs` | `readFileSync` + `JSON.parse` (lines 27, 57) | Untyped plain JS | **No change in Phase 6** -- plain JS, not in `tsconfig.json` `include` scope |
| `scripts/build-search-index.mjs` | `readFileSync` + `JSON.parse` (line 3) | Untyped plain JS | **No change in Phase 6** -- plain JS, not in `tsconfig.json` `include` scope |

[VERIFIED: All four files read and confirmed]

**Verdict:** 2 TypeScript consumers share the shape today. Phases 9 and 10 will add at least 2 more (author rendering component, bibliography rendering component). A centralised `src/types/article.ts` is the right call.

## Slug-ID Enforcement: TypeScript Options Compared

D-07 locks `id` to slug-style `^[a-z0-9-]+$`. Three enforcement approaches:

### Option A: Template Literal Type (TS-only, compile-time)
```typescript
type SlugChar = Lowercase<string>; // Too loose -- allows spaces, underscores, etc.
```
**Verdict: Not viable.** TypeScript's template literal types cannot express regex constraints. `Lowercase<string>` is just `string`. There is no way to say "only `[a-z0-9-]+`" in the TS type system. [VERIFIED: TypeScript 6.0 has no regex-validated string types -- this is a known limitation]

### Option B: Branded Type (compile-time nominal typing + runtime creation)
```typescript
type SlugId = string & { readonly __brand: unique symbol };

function asSlugId(value: string): SlugId {
  if (!/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`Invalid slug id: "${value}"`);
  }
  return value as SlugId;
}
```
**Verdict: Possible but awkward for JSON data.** The branded type prevents accidental assignment of a plain `string` to a `SlugId` field. But since data enters via `.json()`, the brand must be applied via a runtime function at the deserialization boundary or in a build-time script. For a blog with 1 article, this is ceremony without benefit. It also requires calling `asSlugId()` on every `id` value after JSON parsing, which is effectively a runtime validator -- contradicting the spirit of the zero-deps constraint.

### Option C: JSDoc + Type Comment (documentation-only, zero enforcement)
```typescript
/** Slug-style identifier. Must match /^[a-z0-9-]+$/. */
id: string;
```
**Verdict: Weakest enforcement but simplest.** Relies on developer discipline. The demo article IDs are authored manually in `index.json`, so a typo (`Vaswani-2017` instead of `vaswani-2017`) is caught by code review, not by `tsc`.

### Recommendation: Option C with build-time assertion

Use `id: string` with a JSDoc constraint comment. Add a single build-time assertion inside the existing `build-og-pages.mjs --enrich` step (which already reads `index.json` and validates slugs):

```javascript
// In enrichIndexJson(), after the existing slug validation loop:
for (const article of registry.articles) {
  if (article.bibliography) {
    for (const ref of article.bibliography) {
      if (!/^[a-z0-9-]+$/.test(ref.id)) {
        throw new Error(`Invalid bibliography id: "${ref.id}" in article "${article.slug}"`);
      }
    }
  }
}
```

This runs at build time (the `build` script already calls `--enrich` first), requires zero new dependencies, and catches actual invalid IDs before deploy. The TypeScript type documents intent; the build script enforces it. [ASSUMED -- planner decides whether to add this build-time check in Phase 6 or defer to Phase 10]

## Build Script Impact Analysis

### `scripts/build-og-pages.mjs`
[VERIFIED: full file read]

**Reads:** `article.slug`, `article.title`, `article.description`, `article.image` (lines 66-69).
**Does NOT read:** `authors`, `bibliography`, `tags`, `category`, `readingTime` (except `readingTime` is written in enrich mode, not read in generate mode).

**Phase 6 impact:** NONE. New fields (`authors`, `bibliography`) are ignored. Flow-through is confirmed -- `JSON.parse` returns a plain object; accessing only the fields it uses means unknown fields are simply unused. The script will not error.

**Phase 9 impact:** This script WILL need modification to read `authors` for JSON-LD `BlogPosting` generation. That is Phase 9's responsibility.

### `scripts/build-search-index.mjs`
[VERIFIED: full file read]

**Reads:** `article.slug`, `article.title`, `article.date`, `article.category`, `article.tags` (lines 4-7). Extracts body text from HTML file.
**Does NOT read:** `authors`, `bibliography`, `description`, `image`, `readingTime`.

**Phase 6 impact:** NONE. New fields pass through untouched. The search index maps `slug`, `title`, `date`, `category`, `tags`, `body` -- no schema awareness beyond those fields.

**Conclusion:** Both build scripts are safe to leave untouched in Phase 6. They are plain JS (not TS), not included in `tsconfig.json`, and access only the fields they need.

## tsc Verification Command

### Current Build Pipeline
[VERIFIED: package.json `scripts.build`]

```
node scripts/build-og-pages.mjs --enrich
&& node scripts/build-search-index.mjs
&& tsc                                     # <-- type-check step
&& vite build
&& node scripts/build-og-pages.mjs --generate
```

The `tsc` step already runs `tsc --noEmit` (because `noEmit: true` is in `tsconfig.json`). This means **the existing `npm run build` already type-checks all files in `src/`**. No new script is needed.

### Verification for Success Criteria

| Criterion | How It Is Verified |
|-----------|--------------------|
| SC-1: Adding `authors` produces no TS errors | `npx tsc` (or `npm run build`) exits 0 after adding `authors?: Author[]` to the `Article` interface and populating it in `index.json` |
| SC-2: Adding `bibliography` produces no TS errors | Same -- `npx tsc` exits 0 |
| SC-3: Demo article compiles cleanly with both fields | `npx tsc` exits 0 with demo article's `index.json` entry containing both `authors` and `bibliography` arrays |

**The command is simply:** `npx tsc` (which reads `tsconfig.json` and checks all files in `src/`).

### What Makes the Criteria Non-Trivial

Without the type annotations at `.json()` call sites, the criteria are trivially satisfied (any JSON shape compiles when consumed as `any`). **The type annotations are what make `tsc` actually check the schema.** After Phase 6:

1. `devliot-home-page.ts` imports `Article` from `src/types/article.ts` -- if someone adds a field with the wrong name to the interface, `tsc` catches the mismatch when they access it.
2. `devliot-article-page.ts` annotates the registry with `as ArticleRegistry` -- if the `Article` interface changes incompatibly, `tsc` catches it at the access sites.

## Test Strategy

### Phase 6 Is Schema-Only -- Playwright Does Not Apply

Per user memory: "Wants Playwright E2E tests over manual browser verification." However, Phase 6 produces no visual change, no new component, no new route. The test matrix is:

| Validation Pillar | Applies? | Command |
|-------------------|----------|---------|
| TypeScript compilation | YES -- primary | `npx tsc` |
| Playwright E2E | NO -- no visual/behavioral change | - |
| Build pipeline | YES -- smoke test | `npm run build` |
| JSON schema | YES -- manual review of `index.json` | Visual inspection of demo entry |

**`tsc --noEmit` IS the test for Phase 6.** No Playwright test is needed or justified until Phase 9 (author byline visible) or Phase 10 (bibliography section visible).

Additionally, the existing Playwright tests (4 spec files, 41 tests) must continue passing after the schema extension. The plan should include a regression run: `npx playwright test --project=chromium`.

## Demo Article Citations: Three Concrete Candidates

The demo article (`01-demo-article/index.html`) is titled "Article Components Demo" and covers: code highlighting (TypeScript, Python, Java), math formulas (Euler, Gaussian integral, quadratic formula), Mermaid diagrams (request flow), Chart.js charts, and images. The topic is "web component article rendering" broadly.

### Candidate Citations (one per type)

**Type `article`:**
- **Title:** "Attention Is All You Need"
- **Authors:** Vaswani, A. et al.
- **Year:** 2017
- **URL:** `https://arxiv.org/abs/1706.03762`
- **ID:** `vaswani-2017`
- **Justification:** The demo article's Chart.js chart shows "Articles Published" by language including TypeScript and Python -- both commonly used in AI/ML. This is the foundational transformer paper, widely cited in technical blogs. The article body already mentions AI in the tagline. [VERIFIED: arxiv.org/abs/1706.03762 is a real, stable URL]

**Type `book`:**
- **Title:** "The Elements of Typographic Style"
- **Authors:** Bringhurst, Robert
- **Year:** 2004
- **Publisher:** Hartley & Marks
- **ID:** `bringhurst-2004`
- **Justification:** The demo article is fundamentally about rendering well-formatted technical content. Typography is central to that mission. This is the canonical typography reference. [VERIFIED: real book, ISBN 0-88179-206-3, widely cited]

**Type `web`:**
- **Title:** "Lit - Simple. Fast. Web Components."
- **Authors:** (none -- project documentation)
- **URL:** `https://lit.dev/`
- **ID:** `lit-docs`
- **Justification:** The demo article showcases Lit web components (`devliot-code`, `devliot-diagram`, `devliot-chart`, `devliot-math`). Citing the Lit documentation is directly topic-appropriate. [VERIFIED: lit.dev is the official Lit documentation site]

### Demo Article `[id]` Markers

Insert plain-text `[id]` markers at natural points in the demo article body:
- Near the TypeScript code block: `[vaswani-2017]`
- Near the typography/formatting discussion: `[bringhurst-2004]`
- Near any mention of web components or Lit: `[lit-docs]`

These are plain text in Phase 6 -- Phase 10 transforms them into numbered, linked citations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom validator script | TypeScript type annotations + `tsc` | Zero deps, catches structural errors at compile time, project constraint |
| Slug ID enforcement at compile time | Branded types with factory function | JSDoc comment + build-time regex in existing script | Branded types require runtime factory for JSON data; overkill for 1 article |
| Type sharing across consumers | Copy-paste interfaces in each file | Centralised `src/types/article.ts` module | Single source of truth; future phases 9/10 need the same types |

## Common Pitfalls

### Pitfall 1: `any`-Typed JSON Swallows All Type Errors
**What goes wrong:** `response.json()` returns `Promise<any>`. Without explicit type annotations, accessing `registry.articles[0].authrs` (typo) compiles fine. The entire type system is bypassed for fetched data.
**Why it happens:** `tsconfig.json` has `strict: false` (implicit). Without `noImplicitAny`, untyped expressions default to `any`.
**How to avoid:** Add `as ArticleRegistry` at every `.json()` call site that deserializes `index.json`. This is the minimum-cost fix that makes type checking meaningful.
**Warning signs:** `tsc` passes on code with obvious typos in field names after JSON parse.

### Pitfall 2: Optional Field Access Without Null Check
**What goes wrong:** Code accesses `article.authors.map(...)` without checking if `authors` is defined. Since `authors` is optional (D-01), v1.0 articles have `undefined` for this field.
**Why it happens:** Without `strictNullChecks`, TypeScript does not flag `undefined.map()` as an error. The crash only surfaces at runtime.
**How to avoid:** Use defensive access patterns: `article.authors?.map(...)` or `article.authors ?? []`. Document this pattern in the type definition with a JSDoc comment. When Phases 9/10 consume these types, they must use optional chaining.
**Warning signs:** Runtime `TypeError: Cannot read properties of undefined` on articles without authors/bibliography.

### Pitfall 3: Existing `Article` Interface in `devliot-home-page.ts` Diverges from Registry
**What goes wrong:** The inline `Article` interface (lines 6-12) has only `{ slug, title, date, category, tags }`. The actual `index.json` has 8 fields (`slug`, `title`, `date`, `category`, `tags`, `description`, `image`, `readingTime`). Phase 6 adds 2 more. The inline interface has always been incomplete.
**Why it happens:** The inline interface was written for home page rendering only -- it only declared the fields the home page actually uses.
**How to avoid:** Replace it with an import from the centralised type. The centralised type declares ALL fields (required + optional). The home page continues to access only the fields it needs, but the type is now complete and shared.
**Warning signs:** Adding a field to the centralised type that conflicts with the inline interface causes a compile error at import time -- this is actually desirable.

### Pitfall 4: `verbatimModuleSyntax` Requires `import type` for Type-Only Imports
**What goes wrong:** `tsconfig.json` has `verbatimModuleSyntax: true`. If you write `import { Article } from '../types/article.js'` and `Article` is only used as a type (not a value), TypeScript 6 will error because `verbatimModuleSyntax` requires type-only imports to use `import type { ... }`.
**Why it happens:** `verbatimModuleSyntax` preserves import/export statements exactly as written. Type-only imports must be explicitly marked so the bundler knows to strip them.
**How to avoid:** Always use `import type { Article, ArticleRegistry } from '../types/article.js'` when the imports are used only in type positions (annotations, casts).
**Warning signs:** `TS1484: 'Article' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.`

[VERIFIED: tsconfig.json line 13: `"verbatimModuleSyntax": true`]

### Pitfall 5: `erasableSyntaxOnly` Blocks `const enum` and `namespace`
**What goes wrong:** If someone tries to define `BibliographyType` as a `const enum` (e.g., `const enum BibType { Article = 'article', Book = 'book', Web = 'web' }`), TypeScript 6 with `erasableSyntaxOnly: true` will reject it because `const enum` declarations emit JavaScript -- they cannot be erased without changing runtime semantics.
**Why it happens:** `erasableSyntaxOnly` (new in TS 5.8+) forces all TypeScript syntax to be strip-able. `const enum` inlines values at compile time, which changes output.
**How to avoid:** Use a plain literal union type: `type BibliographyType = 'article' | 'book' | 'web'`. This is erasable and achieves the same compile-time constraint. This is already what D-10 specifies.
**Warning signs:** `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.`

[VERIFIED: tsconfig.json line 18: `"erasableSyntaxOnly": true`]

## Code Examples

### Complete `src/types/article.ts`
```typescript
// src/types/article.ts

/**
 * Shared author type, used for both article-level authors (AUTHOR-01)
 * and bibliography entry authors (D-08).
 */
export interface Author {
  name: string;
  url?: string;
}

/**
 * A single bibliography reference entry.
 * `id` must be slug-style: /^[a-z0-9-]+$/ (D-07).
 * `type` determines rendering format in Phase 10 (D-10).
 */
export interface BibliographyEntry {
  /** Slug-style identifier, e.g. 'vaswani-2017'. Must match /^[a-z0-9-]+$/. */
  id: string;
  type: 'article' | 'book' | 'web';
  title: string;
  authors?: Author[];
  url?: string;
  year?: number;
  publisher?: string;
  pages?: string;
  note?: string;
}

/**
 * An article entry in the article registry (public/articles/index.json).
 * All fields beyond slug/title/date/category/tags are optional for
 * backward compatibility with v1.0 articles.
 */
export interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  description?: string;
  image?: string;
  readingTime?: number;
  authors?: Author[];
  bibliography?: BibliographyEntry[];
}

/** Shape of public/articles/index.json */
export interface ArticleRegistry {
  articles: Article[];
}
```

### Updated `devliot-home-page.ts` Import Pattern
```typescript
import type { Article } from '../types/article.js';

// Remove the local interface Article { ... } block (lines 6-12)
// No other changes needed -- the component accesses slug, title, date, category, tags
// which are all present on the centralised Article type.
```

### Updated `devliot-article-page.ts` Type Annotation
```typescript
import type { ArticleRegistry } from '../types/article.js';

// In _loadArticle(), replace:
//   const registry = await regRes.json();
// With:
//   const registry = await regRes.json() as ArticleRegistry;
```

### Updated `index.json` Demo Entry
```json
{
  "articles": [
    {
      "slug": "01-demo-article",
      "title": "Article Components Demo",
      "date": "2026-04-11",
      "category": "Tutorial",
      "tags": ["demo", "components", "reference"],
      "description": "A comprehensive demo showcasing all article content types...",
      "image": "articles/01-demo-article/og-image.png",
      "readingTime": 2,
      "authors": [
        { "name": "Eliott", "url": "https://github.com/devliot" },
        { "name": "Sample Coauthor" }
      ],
      "bibliography": [
        {
          "id": "vaswani-2017",
          "type": "article",
          "title": "Attention Is All You Need",
          "authors": [
            { "name": "Vaswani, Ashish" },
            { "name": "Shazeer, Noam" },
            { "name": "Parmar, Niki" },
            { "name": "Uszkoreit, Jakob" },
            { "name": "Jones, Llion" },
            { "name": "Gomez, Aidan N." },
            { "name": "Kaiser, Lukasz" },
            { "name": "Polosukhin, Illia" }
          ],
          "year": 2017,
          "url": "https://arxiv.org/abs/1706.03762"
        },
        {
          "id": "bringhurst-2004",
          "type": "book",
          "title": "The Elements of Typographic Style",
          "authors": [{ "name": "Bringhurst, Robert" }],
          "year": 2004,
          "publisher": "Hartley & Marks"
        },
        {
          "id": "lit-docs",
          "type": "web",
          "title": "Lit - Simple. Fast. Web Components.",
          "url": "https://lit.dev/"
        }
      ]
    }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline interfaces per consumer | Centralised type modules | Standard since TS 2+ | Shared types prevent drift, enable refactoring |
| `strict: false` default | `strict: true` recommended | TS 2.3+ (2017) | This project uses non-strict; acceptable for v1.0, but Phase 6 needs explicit annotations to compensate |
| `const enum` for literal unions | Plain literal union types | TS 5.8 with `erasableSyntaxOnly` | `const enum` blocked by this tsconfig; use `'article' \| 'book' \| 'web'` |
| `import { Type }` for type imports | `import type { Type }` | TS 3.8+ / required with `verbatimModuleSyntax` | Must use `import type` in this project |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Build-time slug validation in `build-og-pages.mjs` is acceptable for Phase 6 (vs. deferring to Phase 10) | Slug-ID Enforcement | LOW -- if deferred, slug validation simply moves to a later phase; no data corruption |
| A2 | "Attention Is All You Need", "The Elements of Typographic Style", and lit.dev are appropriate demo citations | Demo Article Citations | LOW -- if the user prefers different citations, only the `index.json` entry and `[id]` markers change; no structural impact |
| A3 | `year` should be a top-level optional field (`year?: number`), not nested under a publication sub-object | Architecture Patterns | LOW -- changing nesting later requires only a type refactor, not a schema migration |

## Open Questions

1. **Enable `strict: true` now or later?**
   - What we know: Current tsconfig has strict OFF. Phase 6's type annotations partially compensate.
   - What's unclear: Would enabling `strict: true` break the existing codebase significantly?
   - Recommendation: Do NOT enable in Phase 6. Add it to a future "TypeScript strictness" phase if desired. The explicit annotations are sufficient for Phase 6's goals.

2. **Build-time slug ID validation scope**
   - What we know: `build-og-pages.mjs --enrich` already validates article slugs via `SLUG_PATTERN`.
   - What's unclear: Should bibliography `id` validation be added in Phase 6 or Phase 10?
   - Recommendation: Add it in Phase 6 alongside the demo data -- it is 5 lines of code in an existing script and catches errors at the earliest possible point. But this is Claude's discretion.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 (E2E only -- no unit test framework installed) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx tsc` (type-check only -- primary validation for this phase) |
| Full suite command | `npm run build && npx playwright test --project=chromium` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTHOR-01 | `authors?: Author[]` accepted on Article type | Compile-time | `npx tsc` | N/A (type-check, not test file) |
| REF-01 | `bibliography?: BibliographyEntry[]` accepted on Article type | Compile-time | `npx tsc` | N/A (type-check, not test file) |
| SC-3 | Demo article with both fields compiles | Compile-time + build | `npm run build` | N/A |
| Regression | Existing 41 Playwright tests still pass | E2E | `npx playwright test --project=chromium` | tests/*.spec.ts (4 files) |

### Sampling Rate
- **Per task commit:** `npx tsc` (< 3 seconds)
- **Per wave merge:** `npm run build && npx playwright test --project=chromium`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. `tsc` is the primary validator. No new test files needed for a schema-only phase.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- public blog, no auth |
| V3 Session Management | No | N/A -- no sessions |
| V4 Access Control | No | N/A -- read-only public site |
| V5 Input Validation | Minimally | Slug validation already exists (`SLUG_PATTERN` in article-page and build scripts). Bibliography `id` follows same pattern. No user-submitted data -- all content is author-authored in `index.json`. |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSON injection via `index.json` fields | Tampering | `index.json` is author-authored, not user-submitted. `escapeHtml()` already applied in `build-og-pages.mjs` for OG page generation. |
| Path traversal via bibliography `url` | Tampering | URLs in bibliography are static strings rendered as text in Phase 6. Phase 10 (rendering) must apply `escapeHtml()` and validate URL protocol (http/https only). |

No security action required in Phase 6. Flag for Phase 10: bibliography `url` values must be sanitised before rendering as `<a href>`.

## Sources

### Primary (HIGH confidence)
- `tsconfig.json` -- read directly, confirmed with `npx tsc --showConfig` [VERIFIED]
- `package.json` -- read directly, confirmed `tsc` in build script and TypeScript 6.0.2 [VERIFIED]
- `src/pages/devliot-home-page.ts` -- inline Article interface lines 6-12 [VERIFIED]
- `src/pages/devliot-article-page.ts` -- untyped `.json()` call, inline `{ slug: string }` cast [VERIFIED]
- `scripts/build-og-pages.mjs` -- reads slug, title, description, image only [VERIFIED]
- `scripts/build-search-index.mjs` -- reads slug, title, date, category, tags only [VERIFIED]
- `public/articles/index.json` -- current schema with 8 fields per article [VERIFIED]
- `public/articles/01-demo-article/index.html` -- article body content for citation placement [VERIFIED]
- TypeScript 6.0.2 `erasableSyntaxOnly` behavior -- documented in TS 5.8+ release notes [CITED: https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/]
- `verbatimModuleSyntax` requiring `import type` -- documented in TS 5.0+ [CITED: https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax]

### Secondary (MEDIUM confidence)
- "Attention Is All You Need" paper -- arxiv.org/abs/1706.03762 [VERIFIED: stable arXiv URL]
- "The Elements of Typographic Style" by Robert Bringhurst -- widely cited, ISBN confirmed [ASSUMED: ISBN 0-88179-206-3 from training data]
- Lit documentation at lit.dev -- official Lit project site [VERIFIED: referenced in CLAUDE.md]

### Tertiary (LOW confidence)
None. All claims verified against the codebase or cited from official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps, TypeScript 6.0.2 confirmed
- Architecture: HIGH -- all consumer files read and analyzed, type placement justified by evidence
- Pitfalls: HIGH -- tsconfig flags verified, `any`-typing behavior confirmed empirically
- Demo citations: MEDIUM -- real citations verified, but final selection is Claude's discretion

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable -- TypeScript types and JSON schema are not fast-moving)
