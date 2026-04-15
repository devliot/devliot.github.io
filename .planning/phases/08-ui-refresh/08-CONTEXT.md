# Phase 8: UI Refresh - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Refresh the site's shell chrome: header and footer move to white backgrounds with minimal monochrome separation, and the header becomes context-aware — the home page shows only the search affordance, article pages show only the DEVLIOT logo. The hamburger menu button is removed from both variants. No new capabilities (no menu content, no navigation drawer, no theme toggle) — only the visual shell and its context-aware rendering.

**In scope:** UI-01 (white header + separator), UI-02 (white footer), UI-03 (home-variant header), UI-04 (article-variant header).

**Out of scope:** Hamburger menu content, dark mode, additional header actions, mobile drawer, accent color introduction.

</domain>

<decisions>
## Implementation Decisions

### Separator visual (UI-01 / UI-02)

- **D-01:** Header uses a **scroll-activated shadow** as its separator from the body. No static border. Shadow is absent when the page is at scroll position 0 and appears smoothly once the user scrolls past the top. Monochrome only — no colored accent. The shadow should be subtle (suggestion: `0 1px 2px rgba(0,0,0,0.06)` or similar neutral value; planner finalizes the exact values).
- **D-02:** Footer has **no separator**. White on white, blends into the end of the body content. Readers understand it's the footer by its position and the content reflow into it.
- **D-03:** A new design token **`--color-border`** is introduced in `src/styles/reset.css` (suggested value `#e5e5e5`) so the monochrome system has an explicit neutral border color available. The scroll-shadow itself may use an rgba-based monochrome value directly, but the token is added now so future separators across the site stay consistent with the palette.

### Header variant — home page (UI-03)

- **D-04:** The home-variant header renders **only the search affordance** — no logo, no hamburger. The existing **collapsible toggle pattern is kept**: at rest, only the magnifier icon is visible; clicking it reveals the search input inline. "Only the search bar" is interpreted as "only the search affordance in the header," not "permanently-expanded input."
- **D-05:** Search input placeholder switches to French: **`Rechercher un article…`** (consistent with the French site metadata in `public/articles/index.json`). The magnifier icon is rendered inside the input as a visual hint when the input is expanded.

### Header variant — article page (UI-04)

- **D-06:** The article-variant header renders **only the DEVLIOT ASCII logo** — no search button, no hamburger. The right side of the header is empty (header retains its sticky behavior and the `--header-height` ResizeObserver pipeline from Phase 7).
- **D-07:** The logo is **left-aligned** with the **same size scale as today** (`6px` mobile, `8px` ≥768px, `10px` ≥1280px). The logo is clickable and links to `/` (preserves the current home-navigation affordance).

### Page-variant detection

- **D-08:** Detection is **prop-driven from `devliot-app`**. The header accepts a `variant` attribute/property (e.g. `<devliot-header variant="home" | variant="article">`). `devliot-app` owns the routing decision because it already subscribes to `PathRouter` state — when the current route changes, `devliot-app` computes `variant` and re-renders the header. This keeps the header passive and testable in isolation.

### Hamburger menu fate

- **D-09:** The `.menu-toggle` button is **removed entirely** from both variants. UI-03 and UI-04 explicitly exclude it, and it is non-functional in the current code. If a future phase introduces menu content, a new phase can re-add the control alongside the navigation surface it actually drives.

### Preservation of Phase 7 invariants

- **D-10:** The `--header-height` ResizeObserver pipeline established in Phase 7 (D-10 there, used by `scroll-margin-top` on h2/h3) **must keep working** across both header variants. Different variants have different rendered heights, and the pipeline already observes the real rendered height — the plan must not remove or bypass the observer when the header variant changes. The deep-link anchor tests (6 Playwright tests in `tests/deep-linkable-anchors.spec.ts`) must stay green after this refresh.

### Claude's Discretion

- Exact pixel values for the scroll-shadow (offset, blur, alpha).
- Exact pixel value for `--color-border` (`#e5e5e5` suggested but planner may adjust based on perceived contrast against white and the already-tokenized palette).
- Whether the header shadow fades in via `transition: box-shadow` or pops in immediately.
- Scroll threshold for triggering the shadow (`0` vs a small buffer like `8px` to avoid flicker on sub-pixel scrolls).
- Whether `devliot-app` computes `variant` via a `@state` field or a computed getter over `PathRouter`.
- How the header re-renders on SPA route changes (Lit's reactive update should suffice given `variant` is a reactive property).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level
- `.planning/PROJECT.md` — Monochrome palette constraint, Lit 3 + grayscale-only design system
- `.planning/REQUIREMENTS.md` §UI — UI-01 through UI-04 acceptance criteria (French wording)
- `CLAUDE.md` — Lit 3 non-negotiable, no Markdown preprocessing, grayscale `#333333` palette, Playwright E2E preferred

### Phase 7 handoffs (preserved invariants)
- `.planning/phases/07-deep-linkable-anchors/07-CONTEXT.md` §Sticky-header offset — D-10 establishes the `--header-height` ResizeObserver pipeline that Phase 8 must not break
- `.planning/phases/07-deep-linkable-anchors/07-01-SUMMARY.md` — Where the ResizeObserver was wired in `devliot-app.ts firstUpdated()` and the `scroll-margin-top` rule on h2/h3 in `src/styles/article.css`

### Design system
- `src/styles/reset.css` — Existing `--color-surface` / `--color-surface-alt` tokens; new `--color-border` token is added here

### Current header/footer implementation (targets of refresh)
- `src/components/devliot-header.ts` — Current combined header (logo + search toggle + hamburger) — will be split into two variants
- `src/components/devliot-footer.ts` + `src/styles/footer.css` — Current footer (bg = `--color-surface-alt`) — migrates to white bg, no separator
- `src/styles/header.css` — Current header styles (bg = `--color-surface-alt`, sticky) — migrates to white bg + scroll-shadow
- `src/devliot-app.ts` — Owns PathRouter subscription; becomes the variant decider for the header

### Tests to keep green
- `tests/deep-linkable-anchors.spec.ts` — All 6 tests must stay green (they assert heading lands below the sticky header — the header height may change slightly with variant differences, but the scroll-margin-top pipeline absorbs that)
- `tests/navigation-discovery.spec.ts` — Home page search and tag filtering assertions must stay green under the new home-variant header
- `tests/article-components.spec.ts` — Article page rendering assertions must stay green under the new article-variant header

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`devliot-header.ts`** — The shadow DOM, the search toggle state machine (`_searchOpen`, `_searchValue`, `_dispatchSearch`, Escape-to-close), and the CustomEvent `devliot-search` dispatch are all kept. Only the render path splits by variant and the hamburger button is removed.
- **ResizeObserver pipeline in `devliot-app.ts firstUpdated()`** — Already publishes the live rendered header height to `:root`. Works transparently when the header's rendered height changes across variants.
- **`--color-surface` and `--color-surface-alt` tokens** — Already defined in `reset.css`. `--color-surface` (`#ffffff`) becomes the new header and footer background. `--color-surface-alt` stays in use elsewhere (e.g., code blocks) — not removed.

### Established Patterns

- **CSS-in-file with `?inline` imports** — Each component imports its own CSS via `import styles from '../styles/x.css?inline'` and passes it through `unsafeCSS`. The new variant styles follow this pattern — no inline styles in templates, no `<style>` in templates.
- **Host-level selectors** — Component host styles on `:host { ... }`. New variant-specific styles can use `:host([variant="home"])` and `:host([variant="article"])` for clean attribute-driven variation.
- **French-in-metadata, English-in-code** — Index.json article data is in French (descriptions, titles). User-visible strings in the shell chrome follow the metadata language — search placeholder moves to French. Code identifiers stay English.

### Integration Points

- **`devliot-app.ts`** — Already renders `<devliot-header>` and subscribes to PathRouter. Adds a computed `variant` that passes to the header as an attribute. No other consumers of `devliot-header`.
- **Playwright specs** — `tests/deep-linkable-anchors.spec.ts` reads header height indirectly (via scroll-margin-top behavior); tag filtering tests click the search button. Both must continue to work under the new variant shapes.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly called out "pas d'accent coloré" (no colored accent) in UI-01. The scroll-shadow must be monochrome (rgba on black or the new `--color-border` token only).
- The collapse-and-expand search toggle is the pattern the user chose — preserving it avoids reopening the interaction model decided earlier in the project.
- French placeholder (`Rechercher un article…`) is explicitly chosen — matches the existing French site metadata language.

</specifics>

<deferred>
## Deferred Ideas

- **Hamburger menu functionality** — removed in this phase; if/when a menu surface is designed, re-add the control alongside the menu itself in a dedicated phase.
- **Dark mode / theme toggle** — out of scope; the monochrome palette is non-negotiable per PROJECT.md.
- **SPA route transition animations** — out of scope; the variant swap is instantaneous. Adding fade/cross-dissolve on route change is its own phase.
- **Mobile navigation drawer** — out of scope; no menu content exists.

No Reviewed Todos — todo system returned 0 matches for phase 8.

</deferred>

---

*Phase: 08-ui-refresh*
*Context gathered: 2026-04-15*
