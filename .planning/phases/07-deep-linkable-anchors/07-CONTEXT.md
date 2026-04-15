# Phase 7: Deep-linkable Anchors - Context

**Gathered:** 2026-04-15
**Updated:** 2026-04-15 (scope expanded — see §"Scope expansion: path routing")
**Status:** Scope expanded, ready for gap planning

<domain>
## Phase Boundary

Readers can share a direct link to any `h2` or `h3` section of an article, and opening that link auto-scrolls to the heading so it sits visibly below the sticky header. Phase 3 already shipped a partial version (hover-reveal `#` icons on h2–h6, click-to-scroll, `?section=` read on load); Phase 7 tightens this into the ANCH-01 → ANCH-05 contract.

Success criteria (from ROADMAP.md / REQUIREMENTS.md ANCH-01 → ANCH-05):
1. Click on an h2/h3 anchor updates the address bar with `?section={id}` **without** reloading the article or mutating the hash route
2. Opening a URL with `?section={id}` navigates to the article and auto-scrolls to the correct heading
3. The landed heading is fully visible below the sticky header (offset uses the real measured header height, not a hard-coded constant)
4. Browser back/forward buttons navigate between successive `?section=` states without remounting the article
5. Anchors exist on h2 and h3 only — h4/h5/h6 do NOT get the `#` icon

</domain>

<decisions>
## Implementation Decisions

### Click feedback (ANCH-01)

- **D-01:** Clicking the `#` icon updates the URL to `?section={id}` and smooth-scrolls to the heading. No clipboard copy, no toast, no visible feedback beyond URL + scroll. The URL change is the confirmation. (Drops the clipboard write currently in `devliot-article-page.ts:142`.)

### History behavior (ANCH-04)

- **D-02:** Each anchor click calls `history.pushState` (not `replaceState`), so the browser back button steps back through the sections the reader clicked, then out of the article. ANCH-04 is taken literally.
- **D-03:** The FIRST transition into a `?section=` state from a URL load uses `replaceState` (not `pushState`) so a fresh back-button press from an opened deep link leaves the site cleanly instead of returning to an identical `?section=` entry.
- **D-04:** `popstate` handler re-runs the scroll-to-section logic so back/forward between `?section=` states re-positions the viewport without remounting the article. No router navigation — same article, same DOM, different scroll target.

### Anchor scope (ANCH-05)

- **D-05:** The anchor-injection pass targets `h2, h3` only. h4/h5/h6 receive **no** `#` icon and are not deep-linkable. (Phase 3 currently injects on h2–h6 at `devliot-article-page.ts:119`; this phase tightens the selector.)
- **D-06:** The CSS hover-reveal rules in `src/styles/article.css:110-116` are also scoped to `h2, h3`. h4–h6 lose their current hover anchors entirely (visual + functional cleanup, one cohesive rule).

### Load-time scroll (ANCH-02, ANCH-03)

- **D-07:** Opening a URL with `?section={id}` performs a brief smooth scroll from the article top to the target heading. The page renders at top, then animates — communicates "we're moving you somewhere specific". Not an instant snap.
- **D-08:** Target lookup is silent on miss. If `?section=unknown-heading` has no matching DOM id, the page stays at article top AND the `section` param is stripped from the URL via `history.replaceState` so a refresh or share doesn't retry the bad anchor. No user-visible error.

### Sticky-header offset (ANCH-03)

- **D-09:** The offset mechanism is a `ResizeObserver`-driven CSS custom property exposing the live sticky-header height. The article page (and any future scroll consumer) uses it via `scroll-margin-top` on the heading elements, so browser-native scroll positioning handles the offset without JS math at scroll time. This pipeline is the one the roadmap flags as "established in Phase 7, consumed by Phase 8". ResizeObserver covers both viewport resize and Phase 8's header-content changes (home search bar vs article logo).
- **D-10:** The gap between the bottom of the sticky header and the top of the landed heading is **one line of breathing room** (~0.75rem), not flush. Applied via `scroll-margin-top: calc(var(--header-height) + 0.75rem)` on h2/h3.

### Scope expansion: path routing (added 2026-04-15)

**Trigger:** During Plan 07-03 visual verification, user saw the URL `http://localhost:5175/?section=code-highlighting#/article/01-demo-article` and blocked the checkpoint. The `?section=` query string appears BEFORE the hash because the app uses hash-based SPA routing (`src/utils/hash-router.ts`) and browsers enforce query-before-fragment ordering. User wants `/article/{slug}?section={id}` — which requires migrating from hash routing to path routing.

**Decision to expand this phase's scope (not create a separate phase):** user's explicit choice — "add path-routing as a gap in this phase". Phase 7 goal updates from "deep-linkable anchors (ANCH-01..05)" to "deep-linkable anchors WITH clean path-based URLs".

- **D-11 (URL shape — locked by user):** Article routes use path-based URLs: `/article/{slug}`. Section deep links use `/article/{slug}?section={id}`. Home is `/`. No `#` fragment anywhere in public URLs.

- **D-12 (HashRouter removal):** `src/utils/hash-router.ts` is replaced wholesale by a path router. The two internal hash-links (`src/pages/devliot-home-page.ts:199` and `src/components/devliot-header.ts:48`) are rewritten to use path URLs.

- **D-13 (backward compat — clean cut):** Old hash URLs like `/#/article/{slug}` are NOT redirected. After migration they land on the homepage (or 404) — the site has not yet reached a usage level where legacy shared links matter. This keeps the migration free of compatibility shims and legacy code.

- **D-14 (routing UX scope):** Only the URL format changes. No new 404 page, no not-found redesign, no root-path behavior changes, no router feature additions. All existing behaviors (article rendering, home page, search, deep anchors) stay identical — only the URL shape differs.

- **D-15 (anchor work already done, kept as-is):** Plans 07-01, 07-02, and 07-03 (Tasks 1 + 2) are already committed and produce correct deep-link BEHAVIOR. The `history.pushState`/`replaceState`/`popstate` code in `devliot-article-page.ts` is router-agnostic — it mutates the `search` portion of the URL via `url.searchParams.set('section', id)` which works identically under path routing and hash routing. **No revert of the 8 feat commits is required.** The router migration is additive.

- **D-16 (test migration):** The 6 Playwright tests in `tests/deep-linkable-anchors.spec.ts` currently assert URLs of the form `/?section=X#/article/Y`. After migration they must assert `/article/Y?section=X`. The test bodies (navigate, click, scroll, back) don't change — only URL assertions.

- **D-17 (Plan 07-03 visual verification deferred):** The human-verify checkpoint for 07-03 is paused, NOT failed. It resumes after the router migration lands — at that point the user re-runs the 7-step checklist on the new URLs, the automated tests re-assert the new format, and 07-03-SUMMARY.md is written.

### Claude's Discretion (router migration)

- Router implementation choice: `@lit-labs/router` (URLPattern-based, already listed in CLAUDE.md stack recommendations) vs. a hand-written path router that mirrors the existing `HashRouter` shape. Planner decides based on readability, bundle impact, and the level of disruption to `devliot-app.ts:14`.
- GitHub Pages SPA fallback strategy: copy `index.html` → `404.html` at build time (standard Vite + GH Pages pattern), OR rely on GH Pages custom 404 with a redirect script. Planner/researcher picks.
- Vite `base` config adjustment: currently `/`. May stay at `/` if the site lives at a custom domain / org Pages URL, or switch to `/devliot/` if served from `devliot.github.io/devliot/`. Planner reads the repo's Pages config and decides.
- Scroll restoration behavior: whether to set `history.scrollRestoration = 'manual'` during migration (browser default may conflict with the popstate-triggered smooth scroll from 07-03 Task 2). Planner's call — must not regress ANCH-04.
- Internal link rewrite granularity: two hits are known (`devliot-home-page.ts:199`, `devliot-header.ts:48`) — planner confirms via full-tree grep for `#/` before touching.

### Claude's Discretion (original anchor work, unchanged)

- Exact module placement of the ResizeObserver / `--header-height` CSS variable publisher: inline in `devliot-header.ts`, a new helper in `src/utils/`, or a controller on `devliot-app.ts`. Planner picks based on who else needs to observe it.
- Exact implementation form of the anchor-injection tightening (regex change, selector update, full refactor of `_injectHeadingAnchors`). Planner's call.
- Exact Playwright test granularity for ANCH-01 → ANCH-05 (one e2e spec vs per-criterion specs). Planner decides; minimum bar is each ANCH criterion must have a matching assertion.
- Whether to also wire `popstate` to `devliot-app.ts` router or keep it local to `devliot-article-page.ts`. Planner's call — must not trigger HashRouter remount.
- Heading `id` derivation: current code uses `textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')` (article-page.ts:125-128). Keep as-is unless the planner finds a collision or i18n issue — no change needed for ANCH-01 → ANCH-05.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/REQUIREMENTS.md` §"Deep-linkable anchors" — ANCH-01 through ANCH-05 exact wording (French)
- `.planning/ROADMAP.md` §"Phase 7: Deep-linkable Anchors" — goal + 5 success criteria
- `.planning/milestones/v2.0-ROADMAP.md` §"Phase 7" — full phase spec + dependencies

### v2.0 research

- `.planning/research/SUMMARY.md` — v2.0 architecture overview (ResizeObserver pipeline rationale if present)
- `.planning/research/STACK.md` §"Deep-linkable anchors" / §"Anchors" — technical substrate decisions
- `.planning/research/PITFALLS.md` — hashchange vs query param routing traps, sticky-header offset gotchas

### Project

- `.planning/PROJECT.md` §"Key Decisions" — deep-link strategy `?section=` over hash (rationale: HashRouter remount), monochrome palette
- `.planning/PROJECT.md` §"Constraints" — zero new runtime deps (must use `history.*`, `ResizeObserver`, `scroll-margin-top` — all browser-native)

### Prior phase context

- `.planning/phases/06-data-schema-extension/06-CONTEXT.md` — unrelated to Phase 7 mechanically, but confirms the convention that success criteria maps to concrete `_{N}` decisions
- `src/pages/devliot-article-page.ts:115-175` — existing `_injectHeadingAnchors` and `_scrollToSectionFromUrl` (substrate to modify, not rebuild)
- `src/styles/article.css:98-117` — existing `.heading-anchor` CSS (substrate to scope down)
- `src/styles/header.css:6-12` — sticky header declaration (publisher side of the ResizeObserver pipeline)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/pages/devliot-article-page.ts:28-46` — `updated()` lifecycle hook that already triggers anchor injection and section-scroll on content load. Extend in place.
- `src/pages/devliot-article-page.ts:115-150` — `_injectHeadingAnchors()`: heading scan, id derivation, `<a class="heading-anchor">` construction, click handler. Modify the selector (D-05) and click handler (D-01, D-02).
- `src/pages/devliot-article-page.ts:162-175` — `_scrollToSectionFromUrl()`: reads `?section=` from `window.location.search`, finds target by `CSS.escape(section)` id, calls `scrollIntoView({ behavior: 'smooth' })`. Extend with D-07 (brief smooth), D-08 (miss handling), and scroll-margin via D-10.
- `src/styles/article.css:99-117` — `.heading-anchor` styles (hover-reveal pattern D-12 from Phase 3). Scope selectors to h2/h3 (D-06).
- `src/styles/header.css:6-12` — existing `position: sticky; top: 0` declaration. Observe this element for height changes (D-09).
- `src/utils/hash-router.ts` — hash-based routing layer. Must NOT be touched when URL mutates via `?section=` (ANCH-01 explicit).

### Established Patterns

- **Lit `updated()` lifecycle for post-render DOM work** — Phase 3 set the precedent: anchor injection and section-scroll both run in `updated()` with a microtask to wait for shadow DOM content. Phase 7 continues this pattern.
- **Slug/id derivation from heading text** — lowercase + `\s` → `-` + strip non-word chars. Already implemented at `article-page.ts:125-128`, no reason to change.
- **`CSS.escape()` around user-derived selectors** — already used at line 171 for `#${section}` lookup; keep this defensive practice.
- **History API manipulation bypasses HashRouter** — project decision locked since v1.0: the HashRouter (`src/utils/hash-router.ts`) reacts to `hashchange`; using `history.pushState`/`replaceState` on the search portion of the URL avoids remounts. This constraint is WHY `?section=` was chosen over `#section=`.
- **Playwright E2E over manual browser verification** — from user memory + feedback; every ANCH criterion should have a matching Playwright assertion.

### Integration Points

- Click on `.heading-anchor` → `window.history.pushState({section: id}, '', url)` + smooth scroll → article stays mounted, no router event, URL now has `?section=id`
- URL with `?section=id` on article load → read param in `_scrollToSectionFromUrl()` → browser native `scroll-margin-top` handles offset → smooth scroll animates from top
- Window `popstate` → re-read `?section=` from `window.location.search` → smooth scroll to the new target → article DOM untouched
- Sticky header height change (viewport resize OR Phase 8 content swap) → ResizeObserver fires → CSS `--header-height` variable updates → h2/h3 `scroll-margin-top` automatically recalculates

### Downstream consumers of this phase's work

- **Phase 8 (UI Refresh)** — changes the sticky header's content (home: search bar; article: logo only). The ResizeObserver / `--header-height` pipeline established here absorbs those height changes automatically — no additional work in Phase 8 for offset correctness.
- **Phase 10 (Bibliography)** — inline `[id]` citations in article body will become scroll-to-reference links. The scroll-to-anchor primitive (scroll-margin-top + smooth scroll) built here is directly reusable; the bibliography's numbered list is just another `scrollIntoView` target.

</code_context>

<specifics>
## Specific Ideas

- The anchor selector tightening (h2–h6 → h2, h3) is both a scope fix (ANCH-05) AND a cleanup: Phase 3's h4–h6 anchors are currently orphaned (you hover, see `#`, click, nothing useful happens). Removing them is user-visible polish, not a regression.
- Using native `scroll-margin-top` instead of manual scroll-position math means zero JS in the scroll path — the browser handles it, and Phase 8's header changes propagate automatically via the CSS variable.
- The `replaceState`-on-initial-load + `pushState`-on-click + `popstate`-handler triad is the standard pattern for single-page apps with section deep linking (GitHub README, MDN docs). No novel design.
- `?section=unknown` cleanup (D-08) via `history.replaceState` keeps the URL truthful: readers who share a deep link into a deleted section won't have a dangling `?section=` stuck in the address bar forever.

</specifics>

<deferred>
## Deferred Ideas

- **Copy-link-to-clipboard button / toast** — explicitly dropped (D-01). Could return as a discretionary polish item in a later phase if readers ask for it; the URL-is-the-feedback model is simpler for now.
- **Anchors on h4+** — out of scope per ANCH-05. If deep navigation becomes useful (e.g., inside a long API reference), reconsider in a future docs-friendly phase.
- **Auto-generated Table of Contents** — listed in REQUIREMENTS.md §"Future Requirements" as v2.1 candidate. Complementary to deep links but not required for ANCH-01 → ANCH-05.
- **Heading id collision detection** (two headings with identical text produce identical ids) — not reported as a real-world issue in v1.0 demo article. Punt unless/until it breaks a real article.
- **Focus management on scroll** (moving keyboard focus to the landed heading for screen-reader users) — valid accessibility concern not called out in ANCH-01 → ANCH-05. Worth revisiting in a future a11y pass; not blocking v2.0.
- **URL sharing hint / UI affordance** (e.g., a visible "share section" label) — dropped in favor of the hover-reveal `#` pattern from Phase 3. Revisit only if analytics/feedback show the feature is undiscovered.
- **Hash URL backward-compat redirect** — explicitly dropped (D-13). Not worth carrying legacy code; the site has not yet reached the usage threshold where shared hash links matter. If link loss becomes a real complaint, reintroduce as a single-purpose micro-phase (read `location.hash`, `replaceState` to path URL).
- **Routing UX improvements beyond URL format** — dropped (D-14). Custom 404 page, not-found redesign, route-change analytics, breadcrumbs, etc. are all out of scope for this expansion. File any ideas against a future routing/UX phase.

</deferred>

---

*Phase: 07-deep-linkable-anchors*
*Context gathered: 2026-04-15*
*Scope expansion (path routing): 2026-04-15 — see §"Scope expansion: path routing" in decisions*
