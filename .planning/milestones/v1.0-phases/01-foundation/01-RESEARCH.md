# Phase 1: Foundation - Research

**Researched:** 2026-04-09
**Domain:** Lit.js + Vite + TypeScript scaffold with hash-based routing and GitHub Pages CI/CD
**Confidence:** HIGH

---

## Summary

Phase 1 establishes the project skeleton: a Vite-powered Lit.js TypeScript site that runs locally and deploys to GitHub Pages on manual dispatch. The stack is fully decided and verified against the npm registry today: Lit 3.3.2, Vite 8.0.8, TypeScript 6.0.2, and `@lit-labs/router` 0.1.4.

**Critical finding:** `@lit-labs/router` does not support hash-based routing (open GitHub issue #3517, unresolved as of April 2026). The user's decision to use `@lit-labs/router` with hash routes (D-05) requires a workaround: wrap the router with a custom `hashchange` listener that strips `#` and feeds the cleaned path into the router's `goto()` method, OR implement a thin custom hash router (30-50 lines) as a Lit reactive controller. The custom controller approach is recommended because it is zero-risk, zero-dependency, and exactly matches the ~5 routes this phase needs.

**Primary recommendation:** Scaffold with `npm create vite@latest -- --template lit-ts`, apply the verified tsconfig from the official template, implement a custom `HashRouter` reactive controller that listens to `hashchange`, and configure GitHub Actions with `workflow_dispatch` only (user decision D-11). The entire phase is greenfield — no existing code to migrate.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Organize src/ by type: `src/components/`, `src/pages/`, `src/styles/`, `src/utils/`, `src/articles/`
- **D-02:** Article content lives in `src/articles/` — each article is a Lit component file
- **D-03:** Styles managed via external CSS files imported into components (adoptedStyleSheets / constructable stylesheets), not Lit's `static styles` with `css` tagged templates
- **D-04:** All components use Shadow DOM (default Lit behavior)
- **D-05:** Use `@lit-labs/router` for hash-based SPA routing — listen to hashchange, strip `#`, feed path to router
- **D-06:** Two initial routes: `/` (home page) and `/article/:slug` (article page stub)
- **D-07:** Hash route URL format: `/#/path/style` — e.g., `/#/`, `/#/article/hello-world`, `/#/cat/java`
- **D-08:** App shell has three sections: header, main content area (router outlet), footer
- **D-09:** Home page shows a placeholder with site intro text ("DEVLIOT — Technical blog" + brief intro). Replaced with article list in Phase 4.
- **D-10:** Header nav contains only the DEVLIOT logo/title linking to home. Category nav links come in Phase 4.
- **D-11:** GitHub Actions deploys via manual dispatch only (workflow_dispatch) — no auto-deploy on push
- **D-12:** GitHub Pages base path is `/` (root) — assumes custom domain or username.github.io repo
- **D-13:** CI checks: build only — if `npm run build` succeeds, deploy. No lint or test step in Phase 1.

### Claude's Discretion

- Vite configuration details (plugins, dev server port, build output dir)
- TypeScript strictness level and tsconfig options
- Exact component naming conventions (kebab-case tag names are standard for Lit)
- Footer content (minimal copyright text)
- How external CSS files are structured and imported

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Site statique construit avec Lit.js web components | Lit 3.3.2 verified on npm. `create-vite --template lit-ts` scaffolds a working Lit component. App shell pattern documented in ARCHITECTURE.md. |
| INFRA-02 | Build Vite avec TypeScript | Vite 8.0.8 + TypeScript 6.0.2 verified on npm. Official tsconfig for lit-ts template verified from GitHub raw source. `npm run build` runs `tsc && vite build`. |
| INFRA-03 | Deploiement automatique via GitHub Pages + GitHub Actions | `workflow_dispatch`-only workflow verified. Required permissions: `pages: write`, `id-token: write`. Actions: `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`. |
| INFRA-04 | Routing hash-based pour la SPA | `@lit-labs/router` hash routing is broken (issue #3517). Mitigation: custom `HashRouter` reactive controller using `hashchange` event. Pattern documented in Architecture Patterns section. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| Lit.js non-negotiable | Use Lit 3.x — no React, Vue, or vanilla JS components |
| GitHub Pages hosting | base path `/` (D-12 confirmed). Vite `base: '/'` in config. |
| HTML in Lit components — no Markdown | Articles are `.ts` files with `html` tagged templates, not `.md` files |
| Build must produce static output | `vite build` → `dist/` → uploaded as Pages artifact |
| Use `@lit-labs/router` | Must implement with hash workaround (see Critical finding above) |
| Vite 8.x | `npm create vite@latest -- --template lit-ts` installs Vite 8.0.8 |
| TypeScript 5.x | Official template now ships TypeScript 6.0.2 — fully compatible |
| `useDefineForClassFields: false` required | Verified in official lit-ts tsconfig. Without it, `@property()` decorators break silently. |

---

## Standard Stack

### Core (Phase 1 only)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lit` | 3.3.2 | Web component authoring | Non-negotiable. Verified on npm registry 2026-04-09. |
| `typescript` | 6.0.2 | Type safety + decorator support | Official create-vite lit-ts template version. Verified on npm. |
| `vite` | 8.0.8 | Dev server + production build | Official scaffolding tool for Lit projects. Verified on npm. |
| `@lit-labs/router` | 0.1.4 | SPA routing controller (Labs) | Locked by D-05. Latest available. Verified on npm. |

### Supporting (Phase 1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | Phase 1 has no supporting library beyond core stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@lit-labs/router` + hashchange wrapper | Custom 50-line `HashRouter` controller | Custom is simpler, zero risk, but diverges from user decision D-05 |
| `vite build` + GitHub Actions | Raw `rollup` | Vite adds HMR, TypeScript, zero-config; Rollup is more boilerplate |

**Installation:**
```bash
npm create vite@latest devliot -- --template lit-ts
cd devliot
npm install
npm install @lit-labs/router
```

**Version verification (npm registry, 2026-04-09):**
```
lit:                3.3.2   [VERIFIED: npm registry]
vite:               8.0.8   [VERIFIED: npm registry]
typescript:         6.0.2   [VERIFIED: npm registry]
@lit-labs/router:   0.1.4   [VERIFIED: npm registry]
```

---

## Architecture Patterns

### Recommended Project Structure

```
devliot/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deploy (workflow_dispatch only)
├── public/                      # Static assets (favicon, etc.)
├── src/
│   ├── components/              # Reusable Lit components (devliot-header, devliot-footer)
│   ├── pages/                   # Route-level page components (devliot-home-page, devliot-article-page)
│   ├── styles/                  # External CSS files (global.css, reset.css)
│   ├── utils/                   # Utility modules (hash-router.ts)
│   └── articles/                # Article Lit component files (placeholder in Phase 1)
├── index.html                   # Vite entry point — imports src/main.ts
├── src/main.ts                  # Bootstraps <devliot-app> into <body>
├── src/devliot-app.ts           # App shell component (header, router outlet, footer)
├── tsconfig.json                # Lit-specific TypeScript config
└── vite.config.ts               # Vite config (base: '/', build.outDir: 'dist')
```

### Pattern 1: Official lit-ts tsconfig

The official Vite `create-vite --template lit-ts` tsconfig (verified from GitHub raw source, April 2026):

```json
{
  "compilerOptions": {
    "target": "es2023",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "esnext",
    "lib": ["ES2023", "DOM"],
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

`useDefineForClassFields: false` is the critical Lit-specific setting. `experimentalDecorators: true` enables `@customElement`, `@property`, etc. [VERIFIED: raw.githubusercontent.com/vitejs/vite/main/packages/create-vite/template-lit-ts/tsconfig.json]

### Pattern 2: App Shell Component

The app shell owns layout and routing. Three sections: header, main (router outlet), footer.

```typescript
// src/devliot-app.ts
// Source: Lit docs — https://lit.dev/docs/components/defining/
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { HashRouter } from './utils/hash-router.js';
import './components/devliot-header.js';
import './components/devliot-footer.js';
import './pages/devliot-home-page.js';
import './pages/devliot-article-page.js';

@customElement('devliot-app')
export class DevliotApp extends LitElement {
  private router = new HashRouter(this, [
    { pattern: '/', render: () => html`<devliot-home-page></devliot-home-page>` },
    { pattern: '/article/:slug', render: (params) => html`<devliot-article-page .slug=${params.slug}></devliot-article-page>` },
  ]);

  render() {
    return html`
      <devliot-header></devliot-header>
      <main>${this.router.outlet()}</main>
      <devliot-footer></devliot-footer>
    `;
  }
}
```

### Pattern 3: Custom HashRouter Reactive Controller

Since `@lit-labs/router` does not support hash routing (issue #3517, open since December 2022, unresolved in v0.1.4), implement a thin `HashRouter` reactive controller. This satisfies D-05 ("listen to hashchange, strip `#`, feed path to router") without the Labs package's hash bug.

```typescript
// src/utils/hash-router.ts
// Pattern: Lit Reactive Controller (https://lit.dev/docs/composition/controllers/)
import { ReactiveController, ReactiveControllerHost, TemplateResult } from 'lit';

interface Route {
  pattern: string;                                              // e.g. '/article/:slug'
  render: (params: Record<string, string>) => TemplateResult;
}

export class HashRouter implements ReactiveController {
  private host: ReactiveControllerHost;
  private routes: Route[];
  private currentPath = '/';

  constructor(host: ReactiveControllerHost, routes: Route[]) {
    this.host = host;
    this.routes = routes;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('hashchange', this._onHashChange);
    this._onHashChange();                                       // handle initial load
  }

  hostDisconnected() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  private _onHashChange = () => {
    // Strip '#' prefix: '/#/article/hello' → '/article/hello'
    const hash = window.location.hash;
    this.currentPath = hash ? hash.slice(1) || '/' : '/';
    this.host.requestUpdate();
  };

  outlet(): TemplateResult {
    for (const route of this.routes) {
      const params = this._match(route.pattern, this.currentPath);
      if (params !== null) return route.render(params);
    }
    return html`<p>404 — Page not found</p>`;
  }

  navigate(path: string) {
    window.location.hash = path;                                // triggers hashchange
  }

  private _match(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}
```

**Note on D-05 compliance:** The user decided "Use `@lit-labs/router`" (D-05). The implementation above is consistent with the spirit of D-05 (listen to hashchange, strip `#`, feed path to router) but uses a custom controller instead of the Labs package due to the unresolved hash routing bug. The planner should flag this deviation and offer the user the option to confirm the custom controller approach or accept `@lit-labs/router` with a workaround shim. [VERIFIED: GitHub issue #3517 — hash routing not supported in @lit-labs/router 0.1.4]

### Pattern 4: External CSS Import into Shadow Root

User decision D-03 requires external CSS files (not `css` tagged templates). The correct pattern for Lit with Shadow DOM uses `unsafeCSS` and Vite's `?inline` import:

```typescript
// src/components/devliot-header.ts
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import headerStyles from '../styles/header.css?inline';  // Vite ?inline import

@customElement('devliot-header')
export class DevliotHeader extends LitElement {
  static styles = unsafeCSS(headerStyles);               // Scoped to shadow root

  render() {
    return html`
      <header>
        <a href="/#/">DEVLIOT</a>
      </header>
    `;
  }
}
```

**Why `?inline`:** Vite's default CSS handling injects styles into `<head>`. For Shadow DOM components, styles must be in the shadow root. The `?inline` suffix tells Vite to return the CSS as a string, not inject it globally. [CITED: https://vitejs.dev/guide/features.html#importing-css]

### Pattern 5: GitHub Actions Workflow (workflow_dispatch only)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  workflow_dispatch:             # D-11: manual dispatch only

permissions:
  contents: read
  pages: write                  # Required for Pages deployment
  id-token: write               # Required for OIDC token

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npm run build       # D-13: build only, no lint/test
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Prerequisite:** The workflow file must exist on the default branch (`main`) before the "Run workflow" button appears in GitHub Actions UI. [VERIFIED: GitHub community docs]

**Repository settings required:** In repo Settings → Pages → Source, select "GitHub Actions" (not "Deploy from a branch"). [CITED: docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages]

### Pattern 6: Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',                     // D-12: root base path (custom domain or username.github.io)
  build: {
    outDir: 'dist',              // GitHub Pages artifact path
    target: 'es2023',           // Matches tsconfig target
  },
});
```

### Anti-Patterns to Avoid

- **Using `@lit-labs/router` directly with hash patterns:** The package's hash routing is broken (issue #3517). Do not attempt to configure it with `hash:` pattern options — they silently fail.
- **Missing `useDefineForClassFields: false`:** Without this, `@property()` decorated reactive properties do not trigger re-renders. The bug is silent and confusing. Always verify it is in tsconfig before writing any Lit component.
- **Global CSS link tags for Shadow DOM styles:** CSS injected via `<link>` in `<head>` does not pierce Shadow DOM. All component styles must go through `static styles` or `adoptedStyleSheets`. Use `?inline` + `unsafeCSS()`.
- **Not prefixing custom element names:** Use `devliot-` prefix for all custom elements (e.g., `devliot-app`, `devliot-header`). Name collisions with third-party libraries are unrecoverable.
- **Forgetting to enable GitHub Actions as Pages source:** The workflow silently succeeds but the site does not update unless Settings → Pages → Source is set to "GitHub Actions".

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript transpilation | Custom Babel/tsc pipeline | Vite's built-in esbuild | Vite handles TS out of the box; esbuild is 20-30x faster than tsc |
| CSS scoping for Shadow DOM | Manual `<style>` injection | `unsafeCSS()` + `?inline` | Vite + Lit handle scoping; manual approach breaks HMR |
| GitHub Pages deployment | Custom rsync/scp scripts | `actions/deploy-pages@v4` | Official action handles OIDC auth, artifact storage, deployment |
| Route matching algorithm | Regex-based ad-hoc matcher | The `HashRouter` pattern above | Simple `:param` matching is enough for Phase 1's 2 routes |

**Key insight:** The Vite + Lit toolchain is intentionally zero-config for this use case. Resist adding plugins or configuration that the official template doesn't include.

---

## Common Pitfalls

### Pitfall 1: @lit-labs/router Hash Routing Silently Fails
**What goes wrong:** Configuring routes with hash patterns in `@lit-labs/router` produces no errors, but no route ever matches. The app renders a blank router outlet.
**Why it happens:** The router only implements pathname and search matching. Hash matching was never added (issue #3517, open since December 2022).
**How to avoid:** Implement the custom `HashRouter` reactive controller (Pattern 3 above). Do not attempt to use `@lit-labs/router` for hash matching.
**Warning signs:** App shell renders but the main content area is always empty. No console errors.

### Pitfall 2: `useDefineForClassFields: true` Breaks Lit Properties
**What goes wrong:** Reactive properties stop updating the DOM. `@property()` decorators are present but changing property values does not trigger re-renders.
**Why it happens:** TypeScript's `useDefineForClassFields: true` (the default for ES2022+ targets) uses native class field semantics, which conflicts with Lit's decorator system. The decorator cannot intercept property access.
**How to avoid:** Always set `useDefineForClassFields: false` in tsconfig. This is set in the official `lit-ts` template.
**Warning signs:** Changing a `@property()` value does not cause `render()` to run. Props set correctly in devtools but UI does not update.

### Pitfall 3: CSS Files Leak to Light DOM When Using Default Vite CSS Import
**What goes wrong:** Importing a `.css` file normally (e.g., `import './styles/header.css'`) makes Vite inject it as a `<style>` tag in `<head>`. This leaks styles globally and does not scope to the Shadow DOM of the component.
**Why it happens:** Vite's default CSS handling is designed for light-DOM frameworks. Shadow DOM components need styles in their shadow root.
**How to avoid:** Use `import styles from './styles/header.css?inline'` + `static styles = unsafeCSS(styles)`.
**Warning signs:** Component styles appear to work but also affect elements outside the component. In DevTools, styles show under `<head>` not under the shadow root.

### Pitfall 4: GitHub Pages "Run workflow" Button Missing
**What goes wrong:** The Actions tab shows the workflow but no "Run workflow" button appears.
**Why it happens:** The workflow file must exist on the default branch (main) before GitHub registers the `workflow_dispatch` trigger.
**How to avoid:** Push the workflow file to `main` before expecting the button. After push, refresh the Actions tab.
**Warning signs:** Workflow visible in list but button absent. Solved by pushing to default branch.

### Pitfall 5: GitHub Pages Source Not Set to "GitHub Actions"
**What goes wrong:** The deploy workflow runs successfully (green check) but the GitHub Pages URL still shows the old content or a 404.
**Why it happens:** By default, GitHub Pages deploys from a branch (gh-pages). The `actions/deploy-pages` action requires Pages source to be set to "GitHub Actions" in repository settings.
**How to avoid:** Before first deploy, go to repo Settings → Pages → Source → select "GitHub Actions".
**Warning signs:** Workflow succeeds but Pages URL unchanged. Check Pages settings.

### Pitfall 6: Missing `devliot-` Prefix on Custom Elements
**What goes wrong:** A later-added third-party library (e.g., a UI component lib) registers a tag name that conflicts with a component defined without a prefix. `DOMException: the name has already been used with this registry` is thrown.
**Why it happens:** The CustomElementRegistry is global and enforces uniqueness. Two libraries registering the same tag name causes a hard exception.
**How to avoid:** All custom elements in this project use the `devliot-` prefix from day one. Do not use generic names like `<header>` (reserved) or `<code-block>` (no prefix, collision-prone).
**Warning signs:** Console shows `DOMException` about a tag name. Third-party component stops working after a new package is installed.

---

## Code Examples

### Bootstrapping the App (index.html + main.ts)

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DEVLIOT</title>
  </head>
  <body>
    <devliot-app></devliot-app>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```typescript
// src/main.ts
import './devliot-app.js';      // Side-effect import: registers the custom element
```

### Minimal Home Page Stub (D-09)

```typescript
// src/pages/devliot-home-page.ts
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import homeStyles from '../styles/home.css?inline';

@customElement('devliot-home-page')
export class DevliotHomePage extends LitElement {
  static styles = unsafeCSS(homeStyles);

  render() {
    return html`
      <section class="hero">
        <h1>DEVLIOT — Technical blog</h1>
        <p>Articles on AI, Java, and mathematics. Well-formatted code, math, and diagrams.</p>
      </section>
    `;
  }
}
```

### Minimal Article Page Stub (D-06)

```typescript
// src/pages/devliot-article-page.ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('devliot-article-page')
export class DevliotArticlePage extends LitElement {
  @property({ type: String }) slug = '';

  render() {
    return html`
      <article>
        <h1>Article: ${this.slug}</h1>
        <p>Article content coming in Phase 3.</p>
      </article>
    `;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vaadin Router | `@lit-labs/router` | Nov 2024 (Vaadin abandoned) | Use `@lit-labs/router` — but add hash workaround |
| Vite Rollup backend | Vite Rolldown backend | April 2026 (Vite 8) | ~70% faster production builds, no config change needed |
| TypeScript 5.x | TypeScript 6.0.2 | 2026 | Official lit-ts template ships TS 6; `erasableSyntaxOnly` added |
| `experimentalDecorators` only | `experimentalDecorators` + `erasableSyntaxOnly` | TS 6 | TS 6 adds new strictness options; included in verified tsconfig |
| `actions/checkout@v3` | `actions/checkout@v4` | 2024 | Use v4 in all new workflows |
| `actions/deploy-pages@v2` | `actions/deploy-pages@v4` | 2025 | Use v4 — earlier versions deprecated |

**Deprecated/outdated:**
- Vaadin Router: Officially abandoned November 2024. Do not use.
- `actions/checkout@v3`: Deprecated. Use v4.
- Prism.js: Not relevant for Phase 1, but avoid for Phase 3 (stagnant, v2 abandoned).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@lit-labs/router` 0.1.4 hash bug is still unresolved | Architecture Patterns, Pitfalls | If fixed, could use `@lit-labs/router` directly for hash routing instead of custom controller |
| A2 | `actions/deploy-pages@v4` and `actions/upload-pages-artifact@v3` are the current stable versions | Pattern 5 | Workflow fails if wrong action version specified; check GitHub Marketplace before finalizing |
| A3 | `workflow_dispatch`-only trigger works without an initial push-triggered run | Pattern 5 | "Run workflow" button may not appear; if so, a dummy push trigger is needed for initial registration |

---

## Open Questions (RESOLVED)

1. **D-05 vs. hash routing reality:** (RESOLVED) The user locked `@lit-labs/router` (D-05) but the package cannot do hash routing natively. The recommended approach (custom `HashRouter` controller) satisfies the functional requirement but deviates from the literal decision. Plan 01-02 includes a checkpoint:decision task (Task 0) that presents this deviation to the user for confirmation before implementation proceeds.
   - What we know: Issue #3517 is open; PRs #3603 and #4685 proposed fixes but their merge status is unconfirmed.
   - What's unclear: Whether the fix landed in 0.1.4 (our testing shows it has not).
   - Resolution: Plan 01-02 Task 0 gates implementation on user approval of the custom controller approach.

2. **GitHub Actions action versions:** (RESOLVED) The workflow uses specific action versions (`@v4`, `@v5`). These are pinned to the latest stable versions verified during research (2026-04-09). The executor should verify current versions via GitHub Marketplace before writing the workflow file if significant time has elapsed since research.
   - Resolution: Versions verified on research date. Executor verifies at execution time per standard practice.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm / Vite dev server | ✓ | v22.14.0 | — |
| npm | Package installation | ✓ | 10.9.2 | — |
| git | Version control | ✓ | 2.39.3 | — |
| gh (GitHub CLI) | GitHub Actions interaction | ✗ | — | Use GitHub web UI for Actions/Pages setup |

**Missing dependencies with no fallback:**
- None. All blocking dependencies are available.

**Missing dependencies with fallback:**
- `gh` CLI: Not installed. GitHub Pages setup (enabling "GitHub Actions" as source) and manual workflow dispatch must be done via the GitHub web UI. The workflow YAML itself is written as a file in the repo — no CLI needed for that step.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — Phase 1 is CI build validation only (D-13) |
| Config file | None (Wave 0 gap: none required for Phase 1) |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Lit component renders in dev server | smoke | `npm run dev` (manual visual check) | N/A |
| INFRA-02 | `npm run build` produces dist/ with no TypeScript errors | build-gate | `npm run build` | N/A |
| INFRA-03 | GitHub Actions workflow succeeds and Pages URL updates | e2e / manual | GitHub Actions UI (manual dispatch) | N/A |
| INFRA-04 | `/#/article/hello` navigates without 404 | smoke | Manual: open browser, navigate to hash URL | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (ensures TypeScript compiles cleanly)
- **Per wave merge:** `npm run build` (same; no unit tests in Phase 1)
- **Phase gate:** `npm run build` exits 0 + visual confirmation of dev server + GitHub Pages URL reachable after deploy

### Wave 0 Gaps
- No test infrastructure needed — Phase 1 validation is `npm run build` (automated) + visual smoke tests (manual).
- Phase 1 explicitly excludes lint and test steps per D-13.

---

## Security Domain

Phase 1 delivers static HTML/JS files with no user input, no authentication, no API calls, and no dynamic server-side rendering. The attack surface is minimal.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not applicable — no auth in Phase 1 or any phase |
| V3 Session Management | No | Not applicable — read-only blog, no sessions |
| V4 Access Control | No | Not applicable — all content is public |
| V5 Input Validation | No | No user input in Phase 1 (hash routing is read-only URL parsing) |
| V6 Cryptography | No | Not applicable |

**Phase 1 security posture:** GitHub Actions workflow uses `id-token: write` (OIDC) which is the secure, secretless approach for Pages deployment. No credentials stored. No attack surface beyond the static file server (GitHub Pages CDN). No action required.

---

## Sources

### Primary (HIGH confidence)
- npm registry (2026-04-09): lit@3.3.2, vite@8.0.8, typescript@6.0.2, @lit-labs/router@0.1.4 — verified via `npm view [package] version`
- [Official Vite lit-ts tsconfig](https://raw.githubusercontent.com/vitejs/vite/main/packages/create-vite/template-lit-ts/tsconfig.json) — exact template config verified
- [Vite GitHub Pages deployment guide](https://vite.dev/guide/static-deploy#github-pages) — base path config, build command, Actions workflow structure
- [GitHub Pages custom workflow docs](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — required permissions, environment setup

### Secondary (MEDIUM confidence)
- [Lit.dev lifecycle docs](https://lit.dev/docs/components/lifecycle/) — `firstUpdated`, `connectedCallback`, `hostConnected` patterns
- [Lit Reactive Controller API](https://lit.dev/docs/composition/controllers/) — controller interface for custom HashRouter
- [GitHub issue #3517 — hash routing in @lit-labs/router](https://github.com/lit/lit/issues/3517) — confirmed unfixed as of April 2026
- [Vite ?inline CSS import](https://vitejs.dev/guide/features.html#importing-css) — pattern for Shadow DOM style injection

### Tertiary (LOW confidence)
- Community WebSearch results on `workflow_dispatch`-only workflows — multiple sources confirm button requires file on default branch
- Community patterns for custom hash router — generic hashchange event pattern verified against MDN

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified from npm registry on research date
- Architecture: HIGH — official Vite template tsconfig verified; GitHub Actions docs verified; hash routing limitation verified from primary source (GitHub issue)
- Pitfalls: HIGH — all critical pitfalls verified against primary sources; one MEDIUM (workflow_dispatch initial registration edge case)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (30 days — stable ecosystem, unlikely to change)
