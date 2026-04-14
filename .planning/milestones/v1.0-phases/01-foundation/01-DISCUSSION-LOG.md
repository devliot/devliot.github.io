# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 01-foundation
**Areas discussed:** Project structure, Routing strategy, App shell layout, Deploy config

---

## Project structure

| Option | Description | Selected |
|--------|-------------|----------|
| By type | src/components/, src/pages/, src/styles/, src/utils/ — standard Lit convention | ✓ |
| By feature | src/home/, src/article/, src/shared/ — each feature self-contained | |
| Flat | Everything in src/ root — simplest start | |

**User's choice:** By type
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| src/articles/ | Dedicated folder inside src/ — each article is a Lit component file | ✓ |
| content/ at root | Top-level directory outside src/ — needs extra Vite config | |
| Inside pages/ | Articles alongside page components | |

**User's choice:** src/articles/
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Lit static styles | Built-in css`` tagged template literals, scoped via Shadow DOM | |
| External CSS files | Import .css files via adoptedStyleSheets or constructable stylesheets | ✓ |
| You decide | Claude picks most idiomatic approach | |

**User's choice:** External CSS files
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Shadow DOM | Default Lit behavior, scoped styles, no CSS leaking | ✓ |
| Light DOM | No style encapsulation, global CSS works directly | |
| Mix: pages Light, components Shadow | Page-level Light DOM, reusable UI Shadow DOM | |

**User's choice:** Shadow DOM
**Notes:** None

---

## Routing strategy

| Option | Description | Selected |
|--------|-------------|----------|
| @lit-labs/router | Lit team's official router, URLPattern API, hash via custom config | ✓ |
| Custom hash router | Hand-rolled ~50 lines, zero dependencies | |
| Path-based with fallback | Real URL paths, requires 404.html trick for GitHub Pages | |

**User's choice:** @lit-labs/router
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Home + Article placeholder | Two routes: / and /article/:slug — minimum to prove routing | ✓ |
| Home + Article + Category | Three routes including /cat/:name | |
| Home only | Single route, article routing deferred | |

**User's choice:** Home + Article placeholder
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| /#/article/slug | Hash + path style, clean and readable | ✓ |
| #article-slug (flat) | Simple flat hash, harder to distinguish route types | |

**User's choice:** /#/article/slug style
**Notes:** None

---

## App shell layout

| Option | Description | Selected |
|--------|-------------|----------|
| Header + main + footer | Classic blog layout: fixed header, scrollable main, simple footer | ✓ |
| Header + main only | No footer, added in Phase 2 | |
| Bare shell | Just router outlet, all visual structure deferred | |

**User's choice:** Header + main + footer
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder with site intro | Welcome message: 'DEVLIOT — Technical blog' + brief intro | ✓ |
| Empty state with sample article link | 'No articles yet' + link to test article | |
| You decide | Claude picks to validate success criteria | |

**User's choice:** Placeholder with site intro
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Logo/title + Home link only | DEVLIOT name linking to home, category nav comes in Phase 4 | ✓ |
| Logo + placeholder category links | Stubbed nav links showing intended structure | |
| You decide | Claude picks based on shell needs | |

**User's choice:** Logo/title + Home link only
**Notes:** None

---

## Deploy config

| Option | Description | Selected |
|--------|-------------|----------|
| Push to main | Every push triggers build + deploy, standard for blogs | |
| Manual dispatch only | Deploy when manually triggered from GitHub Actions UI | ✓ |
| Push to main + manual | Auto-deploy on push AND allow manual trigger | |

**User's choice:** Manual dispatch only
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Root / | Assumes custom domain or username.github.io repo | ✓ |
| /devliot/ | Standard for project repos, Vite base set to '/devliot/' | |
| Not sure yet | Claude configures both with easy toggle | |

**User's choice:** Root /
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Build only | Run npm run build — TypeScript errors fail naturally | ✓ |
| Build + lint | Run ESLint before building, adds config overhead | |
| You decide | Claude sets up whatever makes sense | |

**User's choice:** Build only
**Notes:** None

---

## Claude's Discretion

- Vite configuration details (plugins, dev server port, build output dir)
- TypeScript strictness level and tsconfig options
- Exact component naming conventions
- Footer content
- How external CSS files are structured and imported

## Deferred Ideas

None — discussion stayed within phase scope.
