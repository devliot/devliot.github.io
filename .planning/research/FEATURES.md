# Feature Landscape

**Domain:** Developer-focused instructional technical blog (static, Lit.js, GitHub Pages)
**Researched:** 2026-04-14 (v2.0 update — 5 new features only)
**Overall confidence:** HIGH (cross-verified across multiple sources)

---

> **Scope note:** This file covers only the 5 net-new features added in v2.0. v1.0 features (Shiki, KaTeX, Mermaid, Chart.js, FlexSearch, OG tags, reading time, hash routing, filter chips) are shipped and not re-researched here.

---

## Feature 1: Deep-Linkable Anchors (h2 + h3)

### Context: what v1.0 already ships

`_injectHeadingAnchors()` in `devliot-article-page.ts` already:
- Injects `id` attributes on h2–h6 computed from `textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')`
- Prepends a `.heading-anchor` `<a>` button (text = `#`)
- On click: copies `?section={id}` query param URL to clipboard; calls `heading.scrollIntoView({ behavior: 'smooth' })`
- On load: reads `?section=` from `window.location.search` and calls `scrollIntoView()`

**What v1.0 does NOT do:**
- Click does not update the browser URL bar
- Entering a URL with `?section=` scrolls but does not account for the sticky header height (heading lands under the header)
- Only h2–h6 are anchored by current code but scoping requirement is h2 + h3 only
- Uses `?section=` query param pattern (not a hash fragment — intentional to avoid collision with the SPA hash router)

### Table Stakes

| Behavior | Why Expected | Implementation Pattern |
|----------|--------------|----------------------|
| Click anchor button → URL updates immediately | Users expect the URL bar to reflect where they are so they can copy it directly; MDN, GitHub Docs, Smashing Magazine all do this | `history.replaceState(null, '', newUrl)` — replaceState not pushState, to avoid polluting back-button history with every heading click |
| Loading a URL with anchor → page scrolls to heading | The only reason deep links are useful is for sharing; if loading the URL doesn't scroll, the feature is broken | On `connectedCallback` + after `_html` renders, read the anchor param and scroll |
| Scroll accounts for sticky header height | Without offset correction, the heading lands under the sticky header and is obscured | CSS `scroll-padding-top` on the `html` element (or `:root`), set to the header height; this is the simplest and most robust approach — no JS required for the offset itself |
| Anchor visible on hover | Users need to discover that headings are linkable | `.heading-anchor` already present in v1.0; visibility on hover is already styled |

### Differentiators

| Behavior | Value | Complexity |
|----------|-------|------------|
| Clipboard copy on anchor click | "Click = copy URL" is what MDN, GitHub, and Notion do — users trained to expect it | Low — already implemented in v1.0; just needs to copy the replaceState'd URL rather than a constructed one |
| Smooth scroll | Polished feel vs. instant jump | Low — already using `scrollIntoView({ behavior: 'smooth' })` |
| Anchor IDs stable across article edits | IDs derived from heading text are fragile if text changes; stable IDs require explicit declaration | High — out of scope for v2; acceptable risk given small article count |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| `pushState` on heading click | Each clicked heading adds a back-button entry — clicking 5 headings means 5 back presses to leave the page; use `replaceState` |
| Using `window.location.hash` as anchor namespace | The SPA router owns the hash (e.g., `#/article/my-slug`); injecting a sub-anchor into the hash (`#/article/my-slug#section-id`) creates ambiguity. The v1.0 `?section=` pattern is correct |
| Scroll via `window.scrollTo` with manually measured offsetTop | Brittle; `scroll-padding-top` on `:root` is simpler and handles nested shadow DOM correctly |
| Anchoring h4–h6 | h4–h6 headings in technical articles are rare and rarely share-worthy; scoping to h2+h3 keeps the feature clean |

### v1.0 Dependencies

- `_injectHeadingAnchors()` exists — extend it, don't replace it
- `_scrollToSectionFromUrl()` exists — add header-offset logic there
- Header height is set in `header.css` via `position: sticky; top: 0` — read the header's `offsetHeight` or use a CSS custom property `--header-height`

**Complexity: Moderate** — URL update is one `replaceState` call; the offset requires measuring header height and setting `scroll-padding-top` dynamically or via CSS variable.

---

## Feature 2: UI Refresh — White Header/Footer, Page-Specific Content

### Context: what v1.0 ships

- `devliot-header.ts`: sticky header, always shows ASCII logo + search button
- `header.css`: `background-color: var(--color-surface-alt)` — a gray background
- `devliot-footer.ts`: always visible footer
- `devliot-app.ts`: renders `<devliot-header>` unconditionally with no page-context awareness

### Table Stakes

| Behavior | Why Expected | Implementation Pattern |
|----------|--------------|----------------------|
| Header background: white (`#ffffff`) | White header on white background removes the gray band that visually separates header from content; the content-focused aesthetic gains breathing room | Change `--color-surface-alt` on `:host` or override in header CSS to `var(--color-surface)` = `#ffffff` |
| Footer background: white | Same reason — gray footer creates a heavy anchor at the bottom of lightweight article pages | Same approach as header |
| Home page header: search only (no logo) | Home page has the large hero ASCII logo in the page body; repeating it in the header creates redundancy. Search is the primary action on home | `devliot-header` needs a `page` property or the app passes a context signal |
| Article page header: logo only (no search) | Search is irrelevant inside an article; the logo provides a "go home" affordance and the article title serves as context | Same mechanism |

### Differentiators

| Behavior | Value | Complexity |
|----------|-------|------------|
| Smooth visual continuity between header and content | White-on-white removes the "frame" feeling; content feels primary | Low — CSS variable change |
| Header adapts to page context without hard-coded conditions | Clean component API rather than `if (page === 'home')` scattered through render | Low-Med — add `@property page: 'home' | 'article'` to `devliot-header` |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Two separate header components | Code duplication; harder to maintain styling consistency |
| Removing the sticky behavior | Sticky header remains useful on article pages for the logo back-link; removing it hurts navigation |
| Hiding search completely on mobile article pages | On mobile, search is still reachable from home; losing it on article page is acceptable because users already navigated there |

### v1.0 Dependencies

- `devliot-app.ts` renders the header — it knows the current route from `HashRouter`; it can pass `page` prop to the header
- `devliot-home-page.ts` already has the large ASCII hero logo — confirm it exists before removing from header on home

**Complexity: Trivial** — CSS variable change for color; adding one `@property` to `devliot-header` and one binding in `devliot-app.ts` for the page-context switching.

---

## Feature 3: Per-Article Bibliography

### Citation Style Analysis for Technical Writing

Three patterns exist across technical writing:

| Style | Pattern | Examples | Best for |
|-------|---------|----------|---------|
| **Inline links** | Hyperlinked anchor text inline in body | MDN, CSS-Tricks, most developer blogs | Conversational prose; link speaks for itself |
| **Numbered endnote list** | `[1]` in text, numbered list at end | Wikipedia, IEEE papers, academic-influenced blogs | Dense factual claims needing attribution without breaking prose flow |
| **Academic footnotes** | Superscript in text, full citation at page bottom | Chicago style, humanities | Long documents where footnotes stay near the claim; clutter-heavy on web |

**Verdict for devliot:** A numbered endnote list (`[1]`, `[2]` in text + ordered list at article bottom) is the correct pattern for a technical instructional blog. Reasons:
1. Articles cover factual claims (benchmarks, API specs, research papers) that benefit from traceable sources without cluttering prose
2. MDN uses inline links; devliot articles are denser and more academic in tone (math, algorithms, benchmarks)
3. Wikipedia's numbered reference style is the most widely recognized web-native citation convention — developers are trained to read it
4. Inline links are already available for casual references; bibliography is for sources that deserve explicit enumeration

Source for HTML5 bibliography markup: `<ol>` with `<li id="ref-1">` entries is the semantically correct structure (Ian Devlin, 2012, cross-confirmed with W3C specs).

### Table Stakes

| Behavior | Why Expected | Implementation Pattern |
|----------|--------------|----------------------|
| "References" section at article bottom | Readers expect sources to be auditable; absence erodes trust in technical claims | Rendered as `<section>` with `<h2>References</h2>` and `<ol>` of citations |
| Numbered list matching in-text `[N]` markers | Standard web citation convention (Wikipedia, IEEE); readers know what `[1]` means | `<sup>[<a href="#ref-1">1</a>]</sup>` in body; `<li id="ref-1">` in references section |
| Declarative format in article HTML | Articles are HTML in Lit components — bibliography must be autherable without a build step | A `<devliot-references>` web component that accepts children, or a structured JSON block in article metadata |
| External links open in new tab | Citations link out to external sources; keeping them in the same tab loses article context | `target="_blank" rel="noopener noreferrer"` on all reference links |

### Differentiators

| Behavior | Value | Complexity |
|----------|-------|------------|
| Back-link from reference to in-text citation | `↩` after each reference links back to the `[N]` anchor in body — Wikipedia pattern | Low-Med — requires `id` on in-text citation + `href` back-reference |
| Reference section only renders when references exist | Articles without sources don't get an empty "References" heading | Low — conditional render |
| DOI / URL + author + title structured display | Formatted as "Author, Title, Source, Year, URL" rather than raw URL dump | Low — CSS list styling + convention enforced by authoring discipline |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Footnotes at page bottom in academic style | Web footnotes require JS scroll-interception or iframe tricks to stay "at the bottom of the visible page"; endnotes are simpler and equally readable |
| Inline-only links with no bibliography | Sufficient for casual posts, but loses traceability for articles citing papers, benchmarks, or specs |
| Auto-generated bibliography from a citation manager | Overkill for a personal blog; hand-authored declarative HTML is maintainable |
| Bibliography outside article HTML | Putting refs in meta.json requires a build step to inject them; HTML-in-component is the v1.0 architecture |

### v1.0 Dependencies

- Article content is `unsafeHTML(this._html)` in `devliot-article-page.ts` — a `<devliot-references>` custom element in article HTML will auto-upgrade if the component is registered
- `meta.json` does not currently have a `references` field — if declarative JSON approach is chosen, `build-og-pages.mjs` needs updating

**Recommended approach:** A `<devliot-references>` Lit component that wraps a slot containing `<li>` items. Authors write `<devliot-references>` tags inside article HTML. The component renders the `<h2>References</h2>` heading and styled `<ol>` wrapper automatically.

**Complexity: Low** — one small new Lit component; no build-time changes needed.

---

## Feature 4: Per-Article Author(s)

### UX Patterns from Research

High-quality technical blogs (Smashing Magazine, CSS-Tricks, overreacted.io) converge on:
- Byline near article title: "By [Author Name]" — before or after the date
- Single author: inline text, no avatar required unless brand-building
- Multiple authors: "By [Author A] and [Author B]" — comma-separated for 3+
- Author page: `/authors/{name}` with bio, linked from byline — valuable for multi-author blogs
- Structured data: `schema.org/Person` in `<script type="application/ld+json">` — used by Google for E-E-A-T signals and AI Overviews

**For devliot specifically:** The blog is currently single-author. The requirement is "author + optional coauthors declared per article, displayed somewhere appropriate." This means:
- Display: byline in article meta area (alongside date/reading time)
- Structured data: `BlogPosting` with `author: { "@type": "Person", "name": "...", "url": "..." }`
- No author profile page required in v2 (single-author blog; author is implicit)
- Coauthor support: simple array in metadata, comma-joined display

### Table Stakes

| Behavior | Why Expected | Implementation Pattern |
|----------|--------------|----------------------|
| Author name displayed in article meta | Readers assess credibility; even a personal blog benefits from explicit attribution for syndication and AI crawlers | Add `author` field to article `meta.json` and `index.json`; render in `devliot-article-page.ts` alongside date |
| Coauthor(s) displayed when declared | Guest authors and collaborations need attribution | `authors: string[]` or `{ name, url }[]` in metadata; render as comma-separated list |
| Author in structured data (JSON-LD) | Google uses `author.name` for E-E-A-T; required for `BlogPosting` rich results; Bing uses `lastmod` but also reads author | Inject `<script type="application/ld+json">` in the article OG page or dynamically in the article component |

### Differentiators

| Behavior | Value | Complexity |
|----------|-------|------------|
| Author URL (links to GitHub, personal site, or About page) | Contextualizes the author for readers; satisfies `schema.org/Person.url` | Low — optional `url` field per author in metadata |
| Author in OG page metadata | `build-og-pages.mjs` generates static OG HTML; adding author to JSON-LD there makes it crawlable | Low — extend the existing OG page generator |
| Consistent author across all articles (single-author default) | Most articles will be by the site owner; a site-level default avoids per-article repetition | Low — fall back to site-level `DEFAULT_AUTHOR` constant if article omits `authors` field |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Author profile page in v2 | Only one author currently; a profile page requires routing, a new page component, and a bio content system — disproportionate for the value at this scale |
| Avatar / headshot image | Adds image hosting burden and introduces design complexity; text byline is sufficient for a content-focused monochrome blog |
| Author-based filtering/navigation | The author facet is redundant when there's only one author; add only if guest authors become frequent |

### v1.0 Dependencies

- `meta.json` schema needs `authors` field added: `"authors": [{ "name": "...", "url": "..." }]`
- `index.json` needs the same field propagated
- `devliot-article-page.ts` renders `_date` and `_readingTime` — `_authors` follows the same pattern
- `build-og-pages.mjs` reads `index.json` — extend to emit JSON-LD with `author` in OG pages

**Complexity: Low** — metadata extension + one new render line; structured data is additive to existing OG page generator.

---

## Feature 5: Sitemap XML (`/sitemap.xml`)

### Protocol Specification (sitemaps.org)

Required fields:
- `<loc>`: full absolute URL (must include protocol)
- `<lastmod>` (strongly recommended by Google and Bing as of 2025): W3C datetime format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS+00:00`)

Deprecated/ignored fields:
- `<changefreq>`: Google explicitly ignores this as of 2025; omit to reduce file bloat
- `<priority>`: Google explicitly ignores this as of 2025; omit

Format constraints:
- UTF-8 encoded
- Max 50,000 URLs or 50MB uncompressed per file (not a concern for a personal blog)
- Must be registered with Google Search Console or referenced in `robots.txt`

### Table Stakes

| Behavior | Why Expected | Implementation Pattern |
|----------|--------------|----------------------|
| `/sitemap.xml` exists at site root | Search engines and AI crawlers expect it; Google indexes it from `robots.txt` | Build-time script writes `dist/sitemap.xml`; Vite's `publicDir` or a post-build script |
| Home page listed | The root URL must be included | `<loc>https://devliot.github.io/</loc>` |
| One entry per article | Each article is a distinct discoverable page | Iterate `public/articles/index.json` — same source as OG page generator |
| `<lastmod>` from article date | Google uses `lastmod` for re-crawl scheduling; using the `date` field from article metadata is accurate and stable | `article.date` is already `YYYY-MM-DD` — the correct W3C format |
| Sitemap referenced in `robots.txt` | Without `Sitemap:` directive in `robots.txt`, crawlers may never find it | Add `Sitemap: https://devliot.github.io/sitemap.xml` to `public/robots.txt` |

### Differentiators

| Behavior | Value | Complexity |
|----------|-------|------------|
| OG page URLs included (e.g., `/articles/{slug}/og.html`) | OG pages are crawlable static HTML; including them exposes structured article metadata to crawlers | Low — add to generator loop |
| `robots.txt` updated automatically | Avoids manual maintenance | Trivial — static file; `Sitemap:` line never changes |
| Sitemap XML validation in CI | Catches malformed XML before deployment | Low-Med — xmllint or a simple Node XML parser in the build script |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| `<changefreq>` and `<priority>` tags | Google and Bing both ignore these fields as of 2025; they add file size without SEO benefit; Bing's own documentation explicitly recommends using accurate `lastmod` instead |
| Dynamic sitemap generation at runtime | Site is fully static; a serverless function for sitemap is disproportionate complexity |
| Sitemap index file (`sitemapindex`) | Only needed when total URLs exceed 50,000 — a personal blog will never reach this threshold |
| Using GitHub Actions `generate-sitemap` action | That action is designed for repos where HTML IS the repo (Jekyll-style push-HTML sites); devliot generates `dist/` at build time — a Node build script integrated with Vite's build lifecycle is cleaner and already consistent with the existing `build-og-pages.mjs` pattern |

### v1.0 Dependencies

- `build-og-pages.mjs` is the model: reads `public/articles/index.json`, writes to `dist/` — sitemap generator follows the same pattern
- `package.json` `build` script runs `build-og-pages.mjs` — sitemap generator should be added to the same pipeline
- `SITE_URL` constant already defined in `build-og-pages.mjs` as `'https://devliot.github.io'` — reuse or extract to shared config

**Complexity: Trivial** — 20–30 lines of Node.js; the pattern is identical to `build-og-pages.mjs` already in the codebase.

---

## Feature Dependencies (v2.0)

```
Deep-linkable anchors → v1.0 heading anchor component
  (Extends _injectHeadingAnchors(); replaces ?section= copy with replaceState + copy)

Deep-linkable anchors → sticky header height
  (scroll-padding-top must equal header offsetHeight; header CSS change in UI refresh may change this value)

UI refresh (page-specific header) → HashRouter current route
  (devliot-app.ts must pass page context to devliot-header)

Bibliography → article HTML format
  (devliot-references must be registered as a custom element before unsafeHTML renders it)

Author display → meta.json schema
  (authors field added to meta.json and index.json — all five features touch metadata)

Author structured data → OG page generator
  (build-og-pages.mjs must emit JSON-LD with author; same generator, additive change)

Sitemap → index.json article registry
  (same source of truth as OG page generator)

Sitemap → robots.txt
  (Sitemap: directive must point to the correct deployed URL)
```

---

## Complexity Summary

| Feature | Complexity | Primary Work |
|---------|------------|-------------|
| Deep-linkable anchors | Moderate | `replaceState` call + `scroll-padding-top` with dynamic header height measurement; scoping to h2+h3 only |
| UI refresh | Trivial | CSS variable for white bg; one `@property page` on header; one binding in app |
| Per-article bibliography | Low | One new `<devliot-references>` Lit component; no build changes |
| Per-article authors | Low | Metadata schema extension + render line + JSON-LD in OG generator |
| Sitemap XML | Trivial | ~25-line Node.js script; same pattern as existing build-og-pages.mjs |

---

## Sources

- [MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
- [MDN: replaceState method](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)
- [Nick Colley: pushState vs replaceState](https://nickcolley.co.uk/2018/06/11/pushstate-vs-replacestate/)
- [One line CSS for anchor offset behind sticky header](https://getpublii.com/blog/one-line-css-solution-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header.html)
- [MDN Yari: heading permalink discussion](https://github.com/mdn/yari/issues/1427)
- [Ian Devlin: Marking up a Bibliography with HTML5](https://iandevlin.com/blog/2012/02/html5/marking-up-a-bibliography-with-html5/)
- [MDN Writing Style Guide (inline links preference)](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide)
- [Google Search Central: Article Structured Data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [schema.org/BlogPosting](https://schema.org/BlogPosting)
- [schema.org/author property](https://schema.org/author)
- [Author Schema Markup 2025 guide](https://aiso-hub.com/insights/author-schema-markup/)
- [sitemaps.org Protocol](https://www.sitemaps.org/protocol.html)
- [Google: Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Bing: Importance of lastmod tag](https://blogs.bing.com/webmaster/february-2023/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap)
- [Spotibo: SEO sitemap best practices 2025](https://spotibo.com/sitemap-guide/)
- [NNGroup: Sticky Headers best practices](https://www.nngroup.com/articles/sticky-headers/)
- [Author E-E-A-T and bio pages](https://quickcreator.io/blog/how-to-create-author-pages-eeat-guide/)
