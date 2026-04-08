# Feature Landscape

**Domain:** Developer-focused instructional technical blog (static, Lit.js, GitHub Pages)
**Researched:** 2026-04-08
**Overall confidence:** HIGH (cross-verified across multiple sources)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or users leave.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Code syntax highlighting | Developers read code all day — plain monospace is unusable | Low | Prism.js or Highlight.js; pick one. Prism is lighter and more modular. |
| Copy-code button on code blocks | Standard on every major docs site (MDN, GitHub, ReadTheDocs) since ~2020 | Low | One clipboard API call per code block; tiny effort, huge UX gain. |
| Anchor links on headings | Long articles require deep-linking; standard on all docs sites | Low | Hash fragment per `<h2>`/`<h3>` with a small copy-link affordance on hover. |
| Responsive layout (mobile-first) | 30–40% of dev readers on mobile, including commuters and tablet users | Low | CSS grid/flex; nothing exotic. |
| Fast load time | Developers have zero tolerance for slow sites; they'll close a tab in 2s | Low | Lit.js + static = inherently fast. Avoid heavy runtime dependencies. |
| Readable typography | Dense technical prose with code and math requires careful line length and spacing | Low | Max ~70ch line width; comfortable font size (16–18px base). |
| Category / topic navigation | Readers arrive via search and want to browse related content | Low-Med | Flat category list (AI, Java, Maths, etc.) linked from nav and article header. |
| Chronological article listing | Standard blog convention; newest first | Low | Simple sorted list page. |
| Article publication date | Readers assess freshness and relevance; missing dates feel untrustworthy | Low | Single date line near article title/header. |
| Estimated reading time | Developer readers plan their time; Medium popularized this as a convention | Low | Word-count / average WPM; ~200 words/min for technical prose. Display "X min read." |
| Page title and meta description | Required for search engine indexing and social previews | Low | Static `<meta>` tags per article; essential even without SEO ambitions. |
| Open Graph / Twitter Card metadata | Controls how article links look when shared in Slack, Discord, Twitter | Low | OG title, description, image per article. Critical for dev communities that share links. |
| Mathematical formula rendering | Site explicitly covers mathematics; without this, equations become unreadable text | Med | KaTeX preferred over MathJax 3 for bundle size and synchronous rendering on static sites. |
| Image support with captions | Visual explanations and screenshots are essential for instructional content | Low | Native `<figure>/<figcaption>` semantics. |
| 404 page | GitHub Pages serves a default; a custom one maintains trust and navigation | Low | Simple "not found" page with link back to home. |
| Sitemap (sitemap.xml) | Search engines and AI crawlers expect it; speeds up indexing | Low | Static generation at build time. |

---

## Differentiators

Features that set this blog apart from a generic blog or a Dev.to cross-post. Not expected by default, but high value when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Mermaid diagram support | Architecture/flow diagrams inline in articles — rare for personal blogs | Med | Mermaid.js renders from text; no image assets to manage. Best for flowcharts, sequence diagrams, ER diagrams. |
| Data visualization (Chart.js) | Histograms, curves, and comparison charts rendered in-browser — not screenshots | Med | Chart.js covers bar/line/pie/doughnut; simpler API than D3, sufficient for instructional content. |
| D3.js for custom visualizations | Advanced data graphics (force graphs, treemaps, animated curves) | High | Only worthwhile if articles have content that genuinely needs it. Steep authoring complexity. |
| Sticky table of contents (TOC) | Enables navigation in long instructional articles (5k+ words) | Med | Sidebar TOC with scroll-based active-state highlighting; disable/simplify on mobile. Significant reading UX improvement. |
| Dark mode with system preference | Developer audience skews dark-mode heavy; respects OS preference, persists choice | Med | CSS custom properties + `prefers-color-scheme` media query + localStorage toggle. Requires careful code block and math theming. |
| Reading progress indicator | Visual feedback in long articles; low effort, noticeable polish | Low | CSS `position: sticky` progress bar or scroll-driven animation. |
| Article series / sequence links | Instructional content often spans multiple related articles | Low-Med | "Previous in series / Next in series" links at bottom of article; series metadata in component. |
| Tag system with tag index pages | Finer-grained cross-cutting discovery beyond categories | Med | Tags per article, tag list page, articles-by-tag page. Dependency: category system must exist first. |
| Full-text client-side search | Readers want to find content by keyword without leaving the site | Med | Pagefind (post-build index, low JS footprint) or Lunr.js (build-time JSON index). Pagefind preferred for scale and bundle size. |
| RSS / Atom feed | Developer audience uses feed readers heavily; ~80% of feed reader users prefer RSS | Low | Static XML generated at build time. Low effort, high loyalty signal to subscribers. |
| Canonical URL metadata | Prevents duplicate content penalties if articles are syndicated elsewhere | Low | Single `<link rel="canonical">` tag; paired with Open Graph metadata. |
| Print-friendly styles | Developers occasionally print or PDF-export articles for offline reading | Low | `@media print` stylesheet hiding nav/sidebar, expanding code blocks. |

---

## Anti-Features

Features to deliberately NOT build. Each represents real cost with marginal or negative return for this specific blog.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Comments system | Moderation overhead, spam, notifications, security surface area | v1 is intentionally read-only; link to GitHub Discussions if feedback is needed |
| Newsletter / email subscription | Requires third-party service (Mailchimp, ConvertKit), GDPR compliance, unsubscribe flows | Offer RSS as the subscription channel — same content, zero infrastructure |
| CMS / admin panel | The repo IS the CMS; adding a UI layer adds auth, hosting cost, and accidental complexity | Author writes HTML in Lit components; git commit is publish |
| Authentication / user accounts | Public blog; no personalization needed in v1 | N/A |
| Interactive / executable code blocks | Significant security and sandboxing complexity (CodeSandbox-style embeds) | Syntax-highlighted static blocks + links to external playgrounds (CodeSandbox, StackBlitz) |
| Full-text search via server | Static GitHub Pages site — no server to query; client-side search handles the use case | Pagefind or Lunr.js |
| Social login / OAuth | No accounts means no auth; no auth means no OAuth | N/A |
| Infinite scroll / pagination | Articles are discrete units; a flat listing with good navigation is clearer | Simple sorted list page; add pagination only after 50+ articles |
| Multi-language i18n | Author writes in one language; i18n adds route complexity and doubles content burden | Single-language initially; add routing namespace if required later |
| Analytics beyond basic | Full analytics SDKs (GA4, Segment) add cookies, consent banners, GDPR risk | Privacy-respecting counter (Plausible or simple Cloudflare analytics) or none at all |
| Related articles via ML | Algorithmic recommendations require a runtime or precomputation pipeline | Manual "related" links via tags; category/tag navigation serves this naturally |
| Dynamic OG image generation | Requires a serverless function or build-time screenshot tool; high complexity for marginal gain | Static OG image per article (one PNG in the repo), or a single site-wide fallback image |

---

## Feature Dependencies

```
Category navigation → Tag system
  (Tags need categories to exist for coherent IA)

Code syntax highlighting → Copy-code button
  (Copy button is only useful when code blocks exist and are styled)

Article listing → Reading time estimate
  (Reading time displayed in listing cards + article header)

Any article content → Open Graph metadata
  (OG tags require per-article title/description to be meaningful)

Sitemap → Anchor links per heading
  (Sitemap lists pages; headings with anchors improve deep-link discoverability)

Dark mode → Math rendering theme compatibility
  (KaTeX/MathJax must render correctly in both light and dark themes)

Dark mode → Diagram theme compatibility
  (Mermaid supports theme switching; must be wired to the site's color mode)

Sticky TOC → Anchor links on headings
  (TOC links are anchor links; both must work together, especially with sticky nav offset)

Search (Pagefind/Lunr) → Build pipeline
  (Search index generated post-build; requires a build step to exist first)

RSS feed → Article publication dates
  (RSS spec requires pubDate; dates must be reliable and machine-readable)

Series navigation → Tag or category system
  (Series is a special kind of grouping; needs the same metadata infrastructure)
```

---

## MVP Recommendation

Prioritize for v1 (table stakes minimum + one differentiator):

1. Code syntax highlighting with copy-code button
2. Mathematical formula rendering (KaTeX)
3. Mermaid diagram support
4. Image support with captions
5. Category navigation + chronological listing
6. Reading time estimate + publication date
7. Page metadata (title, description, Open Graph)
8. Responsive layout with good typography
9. Sitemap + RSS feed (both low effort, high discoverability value)
10. Anchor links on headings

Defer to v2:
- Dark mode (medium complexity, requires theming all rendering libs)
- Client-side search (requires build pipeline integration)
- Sticky TOC (valuable but not blocking readability)
- Tag system (add after category navigation is validated)
- Data visualization / Chart.js (add per-article when content needs it)
- D3.js (add only if specific articles require custom graphics)
- Series navigation (add when 2+ series exist)

---

## Sources

- [Starting a Technical Blog in 2026: Platform Comparison](https://dasroot.net/posts/2026/04/starting-technical-blog-2026-platform-comparison/)
- [RSS and Atom Feeds: Sustainable Content Distribution](https://dasroot.net/posts/2026/03/rss-atom-feeds-sustainable-content-distribution/)
- [Why RSS Still Matters in 2025](https://simplefeedmaker.com/blog/why-rss-still-matters/)
- [Mermaid vs D3.js vs Chart.js (2026)](https://www.pkgpulse.com/blog/mermaid-vs-d3-vs-chartjs-diagrams-data-visualization-2026)
- [KaTeX vs MathJax Web Rendering Comparison](https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison)
- [Sticky Table of Contents with Scrolling Active States (CSS-Tricks)](https://css-tricks.com/sticky-table-of-contents-with-scrolling-active-states/)
- [Exploring the best syntax highlighting libraries (LogRocket)](https://blog.logrocket.com/exploring-best-syntax-highlighting-libraries/)
- [Pagefind vs Lunr.js for static site search](https://brainbaking.com/post/2022/08/implementing-searching-in-static-websites/)
- [Open Graph SEO: Maximize Social Media Engagement](https://nogood.io/blog/open-graph-seo/)
- [Code Highlighting: Best Practices 2025](https://www.docsie.io/blog/glossary/code-highlighting/)
- [How to approach categories and navigation in blogging (UX Booth)](https://uxbooth.com/articles/how-to-approach-categories-and-navigation-in-blogging/)
