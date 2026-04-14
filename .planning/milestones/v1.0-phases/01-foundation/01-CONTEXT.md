# Phase 1: Foundation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

A working Lit.js + Vite + TypeScript site that compiles, runs locally, and auto-deploys to GitHub Pages on push. Hash-based SPA routing resolves routes without 404s. This phase delivers the skeleton — no styling, no content rendering, no navigation features.

</domain>

<decisions>
## Implementation Decisions

### Project structure
- **D-01:** Organize src/ by type: `src/components/`, `src/pages/`, `src/styles/`, `src/utils/`, `src/articles/`
- **D-02:** Article content lives in `src/articles/` — each article is a Lit component file
- **D-03:** Styles managed via external CSS files imported into components (adoptedStyleSheets / constructable stylesheets), not Lit's `static styles` with `css` tagged templates
- **D-04:** All components use Shadow DOM (default Lit behavior)

### Routing strategy
- **D-05:** Use `@lit-labs/router` for hash-based SPA routing — listen to hashchange, strip `#`, feed path to router
- **D-06:** Two initial routes: `/` (home page) and `/article/:slug` (article page stub)
- **D-07:** Hash route URL format: `/#/path/style` — e.g., `/#/`, `/#/article/hello-world`, `/#/cat/java`

### App shell layout
- **D-08:** App shell has three sections: header, main content area (router outlet), footer
- **D-09:** Home page shows a placeholder with site intro text ("DEVLIOT — Technical blog" + brief intro). Replaced with article list in Phase 4.
- **D-10:** Header nav contains only the DEVLIOT logo/title linking to home. Category nav links come in Phase 4.

### Deploy config
- **D-11:** GitHub Actions deploys via manual dispatch only (workflow_dispatch) — no auto-deploy on push
- **D-12:** GitHub Pages base path is `/` (root) — assumes custom domain or username.github.io repo
- **D-13:** CI checks: build only — if `npm run build` succeeds, deploy. No lint or test step in Phase 1.

### Claude's Discretion
- Vite configuration details (plugins, dev server port, build output dir)
- TypeScript strictness level and tsconfig options
- Exact component naming conventions (kebab-case tag names are standard for Lit)
- Footer content (minimal copyright text)
- How external CSS files are structured and imported

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above and in the following project files:

### Project context
- `.planning/REQUIREMENTS.md` — INFRA-01 through INFRA-04 define what this phase must deliver
- `.planning/ROADMAP.md` §Phase 1 — Success criteria and phase goal
- `CLAUDE.md` §Technology Stack — Recommended versions and rationale for Lit 3.3.1, Vite 8.x, @lit-labs/router, TypeScript 5.x

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes the foundational patterns

### Integration Points
- Vite entry point (`index.html` + `src/index.ts`) bootstraps the app shell
- `@lit-labs/router` integrates as a Lit controller inside the app shell component
- GitHub Actions workflow file (`.github/workflows/`) connects repo to GitHub Pages

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user consistently chose recommended/standard options, indicating preference for conventional Lit.js project structure.

One notable choice: external CSS files over Lit's built-in `static styles` — suggests preference for CSS authoring in dedicated files rather than inline in TypeScript.

Another notable choice: manual deploy only — the user wants control over when the site publishes, not auto-deploy on every push.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-09*
