---
phase: 01-foundation
reviewed: 2026-04-10T12:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - .github/workflows/deploy.yml
  - index.html
  - package.json
  - src/components/devliot-footer.ts
  - src/components/devliot-header.ts
  - src/devliot-app.ts
  - src/main.ts
  - src/pages/devliot-article-page.ts
  - src/pages/devliot-home-page.ts
  - src/styles/app.css
  - src/styles/article.css
  - src/styles/footer.css
  - src/styles/header.css
  - src/styles/home.css
  - src/styles/reset.css
  - src/utils/hash-router.ts
  - src/vite-env.d.ts
  - tsconfig.json
  - vite.config.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-10T12:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The foundation scaffold is clean and well-structured. The Lit web component architecture follows idiomatic patterns: CSS modules via `?inline` imports with `unsafeCSS`, decorator-based custom elements, and a reactive controller for hash-based routing. The TypeScript configuration correctly accounts for Lit's decorator requirements (`useDefineForClassFields: false`). No security vulnerabilities or critical bugs were found.

Three warnings relate to the custom `HashRouter` implementation (trailing slash handling, empty param segments) and a potential GitHub Pages deployment misconfiguration in `vite.config.ts`. Three informational items cover missing `strict` mode in tsconfig, hardcoded colors in CSS, and a minor version discrepancy in the deploy workflow.

## Warnings

### WR-01: HashRouter does not normalize trailing slashes

**File:** `src/utils/hash-router.ts:48-50`
**Issue:** The `_match` method compares `patternParts.length` against `pathParts.length` after splitting on `/`. A URL like `#/article/my-post/` splits into `['', 'article', 'my-post', '']` (4 parts), while the pattern `/article/:slug` splits into `['', 'article', ':slug']` (3 parts). This causes a length mismatch and returns a 404 for any URL with a trailing slash. Users clicking links from external sources or manually editing the URL can trigger this.
**Fix:**
```typescript
private _onHashChange = () => {
  const hash = window.location.hash;
  const raw = hash ? hash.slice(1) || '/' : '/';
  // Normalize: strip trailing slash (but keep root '/')
  this.currentPath = raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;
  this.host.requestUpdate();
};
```

### WR-02: HashRouter allows empty dynamic segments

**File:** `src/utils/hash-router.ts:52-58`
**Issue:** The `:slug` parameter matcher accepts empty strings. A URL like `#/article//` splits into `['', 'article', '', '']` -- while the trailing slash issue (WR-01) would mask this in practice, if WR-01 is fixed with normalization, `#/article/` would normalize to `#/article` which would not match due to length. However, `#/article//something` (double slash) would match with an empty first dynamic segment depending on pattern. More importantly, any captured params are not validated for non-emptiness, so route handlers receive potentially empty slug strings.
**Fix:**
```typescript
if (patternParts[i].startsWith(':')) {
  const value = pathParts[i];
  if (!value) return null; // reject empty segments
  params[patternParts[i].slice(1)] = decodeURIComponent(value);
} else if (patternParts[i] !== pathParts[i]) {
  return null;
}
```

### WR-03: Vite base path may break GitHub Pages asset loading

**File:** `vite.config.ts:4`
**Issue:** `base: '/'` assumes the site is served from the root domain (e.g., `username.github.io`). If this project is deployed as a project page at `username.github.io/devliot/`, all asset paths in the production build will be wrong -- CSS, JS bundles, and any static assets will 404. This depends on the GitHub Pages configuration, but it is a common deployment pitfall.
**Fix:** If deploying as a project page, update the base path:
```typescript
export default defineConfig({
  base: '/devliot/',
  build: {
    outDir: 'dist',
    target: 'es2023',
  },
});
```
If deploying to a custom domain or as the root user page, `base: '/'` is correct. Verify the intended deployment target.

## Info

### IN-01: TypeScript strict mode not enabled

**File:** `tsconfig.json:2-19`
**Issue:** The `strict` compiler option is not set. While not a bug, enabling `strict: true` activates `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, and `noImplicitThis`. These catch common type errors at compile time, especially null/undefined issues as the codebase grows.
**Fix:** Add `"strict": true` to `compilerOptions`. This may surface some type errors that should be fixed.

### IN-02: Hardcoded colors instead of CSS custom properties

**File:** `src/styles/footer.css:7`, `src/styles/reset.css:39`
**Issue:** `footer.css` uses a hardcoded `color: #666` and `reset.css` uses `color: #1a1a1a` for body text. The rest of the CSS consistently uses custom properties for colors (`--color-surface`, `--color-surface-alt`, `--color-accent`). Adding `--color-text` and `--color-text-muted` custom properties would keep theming consistent and make dark mode easier to implement later.
**Fix:**
```css
/* In reset.css :root */
--color-text: #1a1a1a;
--color-text-muted: #666;

/* In reset.css body */
color: var(--color-text);

/* In footer.css */
color: var(--color-text-muted);
```

### IN-03: Deploy workflow uses deploy-pages v4 instead of v5

**File:** `.github/workflows/deploy.yml:38`
**Issue:** The workflow uses `actions/deploy-pages@v4`. The project's technology stack documentation (CLAUDE.md) recommends `actions/deploy-pages@v5`. Both work, but using v5 aligns with the documented recommendations.
**Fix:**
```yaml
- uses: actions/deploy-pages@v5
```

---

_Reviewed: 2026-04-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
