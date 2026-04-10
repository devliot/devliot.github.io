---
phase: 02-design-system
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - index.html
  - package.json
  - playwright.config.ts
  - src/components/devliot-header.ts
  - src/pages/devliot-home-page.ts
  - src/styles/app.css
  - src/styles/fonts.css
  - src/styles/footer.css
  - src/styles/header.css
  - src/styles/home.css
  - src/styles/reset.css
  - tests/design-system.spec.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-10
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 2 delivers a clean, well-structured design system: CSS custom properties are centralised in `reset.css`, fonts are self-hosted via Fontsource, the ASCII art logo renders in two sizes with appropriate responsive breakpoints, and the sticky header is in place. The Playwright suite covers the core design contracts sensibly.

Four warnings were found — none are data-loss or security risks, but two of them will cause silent test failures or missing interactivity on production. Three info items flag minor maintainability improvements.

---

## Warnings

### WR-01: `pre` global style from `reset.css` bleeds onto the ASCII logo inside Shadow DOM via `:host` inheritance

**File:** `src/styles/reset.css:51-61` and `src/styles/header.css:27-36`

**Issue:** `reset.css` sets `pre { background-color: var(--color-surface-alt); padding: var(--space-md); }` on the global stylesheet. Shadow DOM blocks inherited *properties* but not *styles applied via `:host`* — however, the critical point here is that `reset.css` is a global stylesheet that applies to all `pre` elements in the light DOM, while the Shadow DOM encapsulates the `pre` inside `devliot-header` and `devliot-home-page`. The Shadow DOM `pre` in those components is *not* affected by the global `pre` rule — which means the logo is correct.

However, the `home.css` `.logo` rule does **not** set `background-color: transparent` (unlike `header.css` line 35 which does). If any ancestor style ever leaks in, the home logo will pick up a grey background unexpectedly. More importantly: `reset.css` applies globally to `<pre>` in the light DOM. If a future component renders a `<pre>` in the light DOM (e.g., an article page not using Shadow DOM), it will get `background-color: var(--color-surface-alt)` and `padding: var(--space-md)` applied to it automatically — including the ASCII logo if it were ever moved to light DOM. This is a latent correctness issue.

The concrete present-day bug is simpler: `home.css` `.logo` is missing the `background-color: transparent` guard present in `header.css` line 35.

**Fix:**
```css
/* src/styles/home.css — add to .logo rule */
.logo {
  font-family: var(--font-family-mono);
  line-height: 1.0;
  white-space: pre;
  margin: 0;
  padding: 0;
  color: var(--color-text);
  background-color: transparent; /* add this, mirrors header.css:35 */
}
```

---

### WR-02: Hamburger button has no `click` handler — it is interactive but non-functional

**File:** `src/components/devliot-header.ts:20`

**Issue:** The `<button class="menu-toggle" aria-label="Ouvrir le menu">` renders on mobile and tablet but has zero event handling. Clicking it does nothing. For a placeholder this is acceptable, but the `aria-label="Ouvrir le menu"` announces it as a real control to screen-reader users. A non-functional button with an interactive role is a WCAG 4.1.2 violation (name, role, value). Until the navigation menu is implemented, the button should either be removed or use `aria-disabled="true"` and `aria-expanded="false"` to signal its pending state.

**Fix:**
```ts
// Option A — disable until nav is implemented
<button class="menu-toggle" aria-label="Ouvrir le menu" aria-disabled="true" aria-expanded="false">
  <span class="hamburger-icon">&#9776;</span>
</button>

// Option B — remove until nav is implemented and re-add with handler
```

---

### WR-03: `playwright.config.ts` — `baseURL` includes `/devliot/` path prefix that does not match the local Vite dev server

**File:** `playwright.config.ts:6-10`

**Issue:** `baseURL` is set to `http://localhost:5173/devliot/` and the `webServer.url` to the same. The local Vite dev server started by `npm run dev` serves at `http://localhost:5173/` (root), not `/devliot/`. The `/devliot/` prefix is the GitHub Pages sub-path (the repo is deployed at `https://username.github.io/devliot/`). Tests running against `npm run dev` will navigate to `http://localhost:5173/devliot/` which returns a 404, making **every test fail** unless Vite's `base` is configured in `vite.config.*`. No `vite.config.*` file is present in the reviewed files. If a `vite.config.ts` sets `base: '/devliot/'` this issue is already mitigated, but its absence from the reviewed file list means this cannot be confirmed.

**Fix:** Either:
1. Confirm `vite.config.ts` contains `base: '/devliot/'` so local dev also serves at that path.
2. Or use environment-based baseURL so local tests hit `/` and CI/CD tests hit `/devliot/`:
```ts
// playwright.config.ts
use: {
  baseURL: process.env.CI ? 'http://localhost:5173/devliot/' : 'http://localhost:5173/',
},
webServer: {
  command: 'npm run dev',
  url: process.env.CI ? 'http://localhost:5173/devliot/' : 'http://localhost:5173/',
  reuseExistingServer: !process.env.CI,
},
```

---

### WR-04: Shadow DOM CSS custom properties require `:host` to inherit from `:root` — `app.css` references tokens not declared in its shadow scope

**File:** `src/styles/app.css:17,21,29`

**Issue:** `app.css` uses `var(--space-md)`, `var(--space-lg)`, `var(--space-3xl)`, etc. CSS custom properties *do* inherit through the Shadow DOM boundary from `:root` to `:host`, so this works correctly at runtime. However, `header.css`, `home.css`, and `footer.css` all use tokens (`--color-accent`, `--font-family-mono`, `--space-sm`, etc.) that are only defined in `reset.css` `:root`. This is architecturally correct (Shadow DOM inherits custom properties from `:root`), but it creates an implicit hard dependency: any component stylesheet that uses these tokens silently breaks if `reset.css` is not loaded globally. This is not currently a bug because `index.html` loads `reset.css` explicitly. However, the `app.css` comment on line 8 notes "Shadow DOM does not inherit global box-sizing" — the same reasoning should be applied to custom properties: components should document or assert that they depend on the global token sheet.

This is a low-severity latent issue, not an immediate bug. Flagged as warning because it will silently produce unstyled output (using browser default values) if `reset.css` is ever excluded (e.g., in isolated Storybook-style component previews).

**Fix:** Add a comment to each component stylesheet noting the token dependency:
```css
/* src/styles/header.css */
/* Depends on CSS custom properties defined in reset.css (:root). */
/* Custom properties inherit through Shadow DOM — reset.css must be loaded globally. */
```
Alternatively, long-term, consider a CSS layer or `@layer` structure to make this dependency explicit.

---

## Info

### IN-01: Duplicated ASCII art string across two components

**File:** `src/components/devliot-header.ts:13-18` and `src/pages/devliot-home-page.ts:14-19`

**Issue:** The six-line ASCII art block is copy-pasted verbatim into both `devliot-header.ts` and `devliot-home-page.ts`. If the logo ever changes (e.g., rebranding), it must be updated in two places. This is a maintenance smell.

**Fix:** Extract the logo string to a shared constant:
```ts
// src/utils/logo.ts
export const ASCII_LOGO = `\
██████╗ ███████╗██╗   ██╗██╗     ██╗ ██████╗ ████████╗
██╔══██╗██╔════╝██║   ██║██║     ██║██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ██║   ██║██║     ██║██║   ██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║     ██║██║   ██║   ██║
██████╔╝███████╗ ╚████╔╝ ███████╗██║╚██████╔╝   ██║
╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝ ╚═════╝    ╚═╝`;
```
Then use `${ASCII_LOGO}` inside the Lit `html` template.

---

### IN-02: `test-e2e` script runs only Chromium — no cross-browser coverage configured

**File:** `package.json:10`

**Issue:** `"test-e2e": "npx playwright test --project=chromium"` hard-codes the Chromium project. The `playwright.config.ts` also only declares `chromium`. For a design system phase (fonts, layout), rendering differences in Firefox and WebKit (Safari) are relevant — especially for `position: sticky` (which has known Safari quirks) and font loading.

**Fix:** Add Firefox and WebKit to `playwright.config.ts` projects and remove the `--project=chromium` flag from the script, or create separate scripts:
```ts
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

---

### IN-03: Magic number `500px` in `home.css` is not a design token

**File:** `src/styles/home.css:53`

**Issue:** `.hero__tagline { max-width: 500px; }` uses a magic number that is not part of the spacing scale or any documented token. The spacing scale goes `--space-xs` through `--space-3xl` (4px–64px), so 500px falls outside it. For a content-width constraint this is reasonable, but it should be documented or added as a token for consistency.

**Fix:** Add a token to `reset.css`:
```css
/* reset.css :root */
--content-width-narrow: 500px; /* tagline and short-form content */
--content-width-article: 720px; /* article body max-width */
```
Then use `max-width: var(--content-width-narrow)` in `home.css`.

---

_Reviewed: 2026-04-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
