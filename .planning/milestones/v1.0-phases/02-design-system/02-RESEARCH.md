# Phase 2: Design System - Research

**Researched:** 2026-04-10
**Domain:** CSS design tokens, self-hosted fonts, responsive layout, ASCII art branding, Playwright E2E testing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** ASCII art logo in block letter style — large blocky characters, bold terminal aesthetic (inspired by OPENCODE)
- **D-02:** Logo appears in two places: full-size ASCII art in the home page hero section, and a smaller scaled version in the site header
- **D-03:** On mobile, the ASCII logo scales down via font-size reduction rather than switching to plain text — ASCII art is preserved at all breakpoints
- **D-04:** Light minimal theme — white background (`#ffffff`), dark text (`#1a1a1a`), ocean blue accent (`#0077b6`), light gray surface (`#f8f9fa`)
- **D-05:** Code blocks use a light/gray background that blends with the page (no dark code blocks)
- **D-06:** Body font: Inter (sans-serif) — clean, modern, highly readable at all sizes
- **D-07:** Code font: Fira Code (monospace with coding ligatures)
- **D-08:** Fonts are self-hosted — font files bundled in the repo, no external CDN requests
- **D-09:** Content max-width is 720px on desktop, centered with generous margins — optimal for long-form reading
- **D-10:** Header is sticky on mobile — stays visible when scrolling. Includes a hamburger menu placeholder for Phase 4 navigation links
- **D-11:** Code blocks use horizontal scroll on mobile (no line wrapping) — preserves formatting and indentation

### Claude's Discretion

- Exact ASCII art generation for the DEVLIOT block letters
- Heading font treatment (Inter at different weight, or same as body)
- Breakpoint values beyond the three required (375/768/1280)
- Spacing adjustments between breakpoints
- Footer responsive behavior
- Font file formats and @font-face declarations
- CSS custom property naming for new design tokens

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-01 | Logo DEVLIOT stylé (inspiré du style OPENCODE) | ASCII art via box-drawing Unicode characters in `<pre>`, Fira Code monospace, two placements |
| BRAND-02 | Design minimaliste, focus contenu, typographie soignée | Inter + Fira Code via @fontsource npm packages, CSS custom property override in reset.css |
| INFRA-05 | Layout responsive (mobile/tablette/desktop) | CSS media queries at 768px / 1280px, max-width 720px centered, sticky header, horizontal scroll for code |
</phase_requirements>

---

## Summary

Phase 2 replaces the Phase 1 skeleton design tokens with the real DEVLIOT brand. The work is entirely CSS and Lit component modification — no new npm packages for the feature implementation itself, except self-hosted fonts via Fontsource. The three pillars are: (1) CSS custom property override in `reset.css`, (2) self-hosted fonts via `@fontsource/inter` and `@fontsource/fira-code` npm packages, and (3) responsive layout via standard CSS media queries.

The ASCII art logo is a distinctive brand choice rendered in a `<pre>` element using box-drawing Unicode characters (the same character set shown in the UI-SPEC). It must be wrapped with `aria-label="DEVLIOT"` for accessibility. Font size governs scale across breakpoints — the art is never transformed or replaced with plain text (D-03).

Playwright E2E tests (user preference from memory) are the validation layer. Tests set `page.setViewportSize()` at three breakpoints (375/768/1280) and use `expect(locator).toHaveCSS()` assertions to verify layout, sticky positioning, and overflow behavior.

**Primary recommendation:** Install `@fontsource/inter@5.2.8` and `@fontsource/fira-code@5.2.7`, import their CSS files in `index.html`, update `reset.css` custom properties, then modify the three Lit components (header, home page, footer) and two CSS files (app.css, header.css) per the UI-SPEC contract.

---

## Standard Stack

### Core (no new packages — all CSS)

No new runtime libraries are required. All design system work uses native CSS features that are already available in the Vite + Lit project.

### Supporting (new packages for fonts)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource/inter` | 5.2.8 | Self-hosted Inter font files + @font-face CSS | Fontsource is the canonical npm distribution for self-hosted Google Fonts; Vite rewrites asset URLs automatically during build |
| `@fontsource/fira-code` | 5.2.7 | Self-hosted Fira Code font files + @font-face CSS | Same Fontsource ecosystem; variable font available via `@fontsource-variable/fira-code` if ligatures need variable weight axis |
| `@playwright/test` | 1.59.1 | E2E test framework for responsive layout validation | User explicitly prefers Playwright E2E over manual browser verification (from memory.md) |

[VERIFIED: npm registry — `npm view @fontsource/inter version` → 5.2.8, `npm view @fontsource/fira-code version` → 5.2.7, `npm view @playwright/test version` → 1.59.1]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/inter` | Manual woff2 download into `src/assets/fonts/` | Manual download is valid but more tedious; Fontsource handles subsetting, weights, formats, and Vite integration automatically |
| `@fontsource/fira-code` | `@fontsource-variable/fira-code` | Variable font is a single file covering all weights; static packages are lighter if only one weight is needed |
| CSS media queries | CSS container queries | Container queries are component-scoped and production-ready in 2025, but for page-level layout breakpoints (global header, main width) media queries remain the idiomatic choice |

**Installation:**
```bash
npm install @fontsource/inter @fontsource/fira-code
npm install -D @playwright/test
npx playwright install chromium
```

---

## Architecture Patterns

### Recommended Project Structure

The Phase 1 structure is already correct. Phase 2 adds:

```
src/
├── styles/
│   ├── reset.css        # MODIFY — update --color-accent, --color-surface-alt, add new tokens
│   ├── fonts.css        # NEW — @font-face declarations for Inter + Fira Code
│   ├── app.css          # MODIFY — add responsive max-width, media queries
│   ├── header.css       # MODIFY — sticky, ASCII logo sizing, hamburger button
│   ├── home.css         # MODIFY — hero section with full-size ASCII logo
│   └── footer.css       # MODIFY — color tokens, responsive padding
├── components/
│   ├── devliot-header.ts  # MODIFY — <pre aria-label="DEVLIOT"> + hamburger button
│   └── devliot-footer.ts  # no TS change needed
└── pages/
    └── devliot-home-page.ts  # MODIFY — hero section with ASCII art <pre>
index.html               # MODIFY — add <link rel="stylesheet" href="/src/styles/fonts.css">
tests/
└── design-system.spec.ts  # NEW — Playwright E2E tests
```

### Pattern 1: Fontsource Import in Vite

**What:** Import font CSS from Fontsource package directly into the HTML head. Vite's build pipeline rewrites the `url()` references in the CSS to point to hashed output files in `dist/`, ensuring the fonts are self-hosted in the build output.

**When to use:** Any time a font must be self-hosted (D-08 — no CDN).

**Two valid approaches:**

Option A — Import the Fontsource CSS file in `index.html` (recommended for this project since fonts are global):
```html
<!-- index.html -->
<link rel="stylesheet" href="/node_modules/@fontsource/inter/400.css" />
<link rel="stylesheet" href="/node_modules/@fontsource/inter/600.css" />
<link rel="stylesheet" href="/node_modules/@fontsource/fira-code/400.css" />
```

Option B — Import in the custom `src/styles/fonts.css` file (keeps index.html clean, aligns with existing pattern):
```css
/* src/styles/fonts.css */
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/fira-code/400.css';
```
Then in `index.html`: `<link rel="stylesheet" href="/src/styles/fonts.css" />`

**Recommendation:** Option B (custom fonts.css with `@import`) — matches the established project pattern of keeping `index.html` minimal and using dedicated CSS files. The UI-SPEC specifies a `fonts.css` file.

[CITED: https://fontsource.org/fonts/inter/install]

### Pattern 2: CSS Custom Property Override

**What:** Phase 2 does NOT add a new CSS file — it updates the values in `reset.css` to replace the Phase 1 skeleton placeholders. CSS custom properties cascade normally; because `:root` in `reset.css` is the global root, all Shadow DOM components that consume `var(--color-accent)` etc. automatically receive the updated value.

[VERIFIED: existing codebase — `reset.css` has `--color-accent: #0000ee` and `--color-surface-alt: #f5f5f5`, both flagged as Phase 2 overrides in source comments]

```css
/* reset.css :root — Phase 2 overrides */
--color-surface: #ffffff;
--color-surface-alt: #f8f9fa;   /* was #f5f5f5 */
--color-accent: #0077b6;        /* was #0000ee */
--color-text: #1a1a1a;          /* NEW */
--color-text-muted: #666666;    /* NEW */
--font-family: 'Inter', system-ui, -apple-system, sans-serif;
--font-family-mono: 'Fira Code', 'Courier New', monospace;
--breakpoint-tablet: 768px;     /* NEW — informational; not usable in media queries */
--breakpoint-desktop: 1280px;   /* NEW — informational */
```

**Important gotcha:** CSS custom properties cannot be used inside `@media` query conditions (e.g., `@media (min-width: var(--breakpoint-tablet))` is invalid). The breakpoint tokens are documentation/reference only. Actual media queries must use literal pixel values.

[ASSUMED — standard CSS specification behavior, well-established]

### Pattern 3: Responsive Layout with Media Queries

**What:** Mobile-first media queries using `min-width`. The content max-width column is applied to `<main>` in `app.css`.

```css
/* src/styles/app.css */
:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  width: 100%;
  padding-inline: var(--space-md); /* 16px on mobile */
}

@media (min-width: 768px) {
  main {
    padding-inline: var(--space-lg); /* 24px on tablet */
  }
}

@media (min-width: 1280px) {
  main {
    max-width: 720px;
    margin-inline: auto;
    padding-inline: var(--space-md);
  }
}
```

### Pattern 4: Sticky Header in Shadow DOM Component

**What:** `position: sticky; top: 0; z-index: 100` applies on `:host` in `header.css`. The `:host` selector styles the custom element itself (which is the Shadow DOM host). Since `devliot-header` renders inside `devliot-app`'s flex column, applying `sticky` on `:host` makes the header stick to the top of the scroll container.

```css
/* src/styles/header.css */
:host {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-surface-alt);
  position: sticky;
  top: 0;
  z-index: 100;
}
```

[ASSUMED — standard CSS positioning; behavior in Shadow DOM host elements is consistent with non-Shadow DOM, verified by MDN documentation pattern]

### Pattern 5: ASCII Art Logo Rendering

**What:** Box-drawing Unicode characters rendered in a `<pre>` element with Fira Code monospace font. Line height set to 1.0 to keep block proportions tight.

```html
<!-- In devliot-header.ts render() -->
<a href="/#/" aria-label="DEVLIOT — accueil">
  <pre aria-label="DEVLIOT" class="logo logo--small">
██████╗ ███████╗██╗   ██╗██╗     ██╗ ██████╗ ████████╗
██╔══██╗██╔════╝██║   ██║██║     ██║██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ██║   ██║██║     ██║██║   ██║   ██║   
██║  ██║██╔══╝  ╚██╗ ██╔╝██║     ██║██║   ██║   ██║   
██████╔╝███████╗ ╚████╔╝ ███████╗██║╚██████╔╝   ██║   
╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝ ╚═════╝    ╚═╝  
  </pre>
</a>
```

```css
/* In header.css */
.logo {
  font-family: var(--font-family-mono);
  line-height: 1.0;
  white-space: pre;
  overflow: visible;
  margin: 0;
  color: var(--color-text);
}

.logo--small {
  font-size: 10px; /* mobile + tablet */
}

@media (min-width: 1280px) {
  .logo--small {
    font-size: 12px;
  }
}

/* In home.css */
.logo--hero {
  font-size: 12px; /* mobile */
}

@media (min-width: 768px) {
  .logo--hero {
    font-size: 14px;
  }
}
```

**Tool for generating ASCII art:** patorjk.com/software/taag/ with the "ANSI Shadow" font produces the `█ ╗ ╔ ╝ ╚ ║` box-drawing style shown in the UI-SPEC example. The exact art string is generated by the executor, not locked in research.

[CITED: https://patorjk.com/software/taag/]

### Pattern 6: Playwright Responsive Testing

**What:** E2E tests that set viewport size and assert computed CSS properties and element visibility.

```typescript
// tests/design-system.spec.ts
import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

test.describe('Responsive layout', () => {
  for (const bp of BREAKPOINTS) {
    test(`no horizontal overflow at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/');
      const body = page.locator('body');
      const scrollWidth = await body.evaluate(el => el.scrollWidth);
      const clientWidth = await body.evaluate(el => el.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});
```

[CITED: https://playwright.dev/docs/emulation]

### Anti-Patterns to Avoid

- **Using CSS variables in media query conditions:** `@media (min-width: var(--breakpoint-tablet))` is invalid CSS — custom properties are not resolved at the media query level. Use literal `768px`.
- **`transform: scale()` on ASCII logo:** Distorts spacing unevenly. Scale via `font-size` only (D-03).
- **Hardcoded colors in component CSS:** Always reference CSS custom properties (`var(--color-accent)`) — the `footer.css` currently has `color: #666` hardcoded and needs updating to `var(--color-text-muted)`.
- **Setting `overflow: hidden` on `:host` for the header:** Sticky positioning requires the header to be in a scrolling ancestor, not clipped. Do not add `overflow: hidden` to the app shell flex container.
- **`white-space: nowrap` on the ASCII `<pre>`:** Use `white-space: pre` — `nowrap` would collapse newlines and destroy the block art structure.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font file hosting | Manual woff2 download + custom @font-face | `@fontsource/inter` + `@fontsource/fira-code` | Fontsource handles subsetting, weights, formats, WOFF2+WOFF fallback, and Vite asset rewriting |
| ASCII art generation | Writing block letters by hand character by character | patorjk.com TAAG with "ANSI Shadow" font | Generates the exact `█ ╗ ╔ ╝` style in seconds; executor pastes result |
| Responsive test viewport control | Browser DevTools manual resize | `page.setViewportSize()` in Playwright | Deterministic, CI-compatible, matches user's stated preference |

**Key insight:** Self-hosting fonts is not complex once Fontsource is used — the npm package IS the font files, and Vite handles the asset pipeline automatically.

---

## Common Pitfalls

### Pitfall 1: Fontsource Import Fails at Build Time

**What goes wrong:** Font files are served correctly in dev (`vite dev`) but missing from the production build (`dist/`).
**Why it happens:** If the font CSS is imported via a direct path like `/node_modules/@fontsource/inter/400.css`, Vite dev resolves it but the production build does not copy `node_modules` to `dist/`.
**How to avoid:** Always import Fontsource CSS through either `src/styles/fonts.css` with `@import '@fontsource/inter/400.css'` (Vite resolves npm specifiers in CSS `@import`), or via a JS import in the main entry point. Never use a bare `/node_modules/` path in `<link href>`.
**Warning signs:** Font renders in `npm run dev` but falls back to system font in `npm run preview`.

### Pitfall 2: ASCII Art Breaks Due to Font Fallback

**What goes wrong:** The ASCII art looks correct on one machine but misaligned on another.
**Why it happens:** The box-drawing characters (`█ ╗ ║` etc.) are full-width in Fira Code but may have different metrics in fallback fonts. If Fira Code fails to load, the art scrambles.
**How to avoid:** Ensure Fira Code loads before first render via `font-display: swap` (swap shows fallback briefly, then swaps to Fira Code — art may flash). Alternative: `font-display: block` (invisible text until font loads — no flash but brief blank). For a logo, `font-display: block` is preferable.
**Warning signs:** Misaligned columns in the `<pre>` block on fresh page load before font swap.

### Pitfall 3: Sticky Header Broken Inside Shadow DOM Flex Column

**What goes wrong:** The header does not stick — it scrolls away with the page.
**Why it happens:** `position: sticky` requires the element to be inside a scrolling ancestor with a defined height. The `devliot-app` Shadow DOM host uses `min-height: 100vh` with `display: flex; flex-direction: column`. This is compatible with sticky positioning as long as the host itself does not have `overflow: hidden` or `overflow: auto`.
**How to avoid:** Do not set `overflow` on `:host` in `app.css`. Verify `position: sticky; top: 0` is on the `:host` selector in `header.css` (i.e., on the custom element itself in the light DOM, not on an inner element).
**Warning signs:** In Playwright, `expect(header).toHaveCSS('position', 'sticky')` passes but the header visually scrolls — indicates `overflow` is set on an ancestor.

### Pitfall 4: Horizontal Overflow at Mobile Breakpoint

**What goes wrong:** The body has a horizontal scrollbar at 375px.
**Why it happens:** A child element (often the ASCII `<pre>` in the hero section) is wider than the viewport. The `<pre>` element with `white-space: pre` does not wrap and can exceed container width.
**How to avoid:** The home page hero must apply `overflow-x: auto` to the `.logo--hero` container, not to `<body>`. For the header logo, ensure the header uses `overflow: hidden` on its inner container (not on `:host`) so sticky is unaffected. Apply `max-width: 100%` with `overflow-x: auto` on the `.hero` section wrapping the ASCII art.
**Warning signs:** Playwright `scrollWidth > clientWidth` assertion fails at 375px.

### Pitfall 5: `color: #666` Hardcoded in footer.css

**What goes wrong:** Footer text color does not update if design tokens change.
**Why it happens:** The existing `src/styles/footer.css` has `color: #666` as a literal value instead of `var(--color-text-muted)`.
**How to avoid:** Replace with `color: var(--color-text-muted)` in the Phase 2 footer.css update.
**Warning signs:** Footer text remains `#666` when `--color-text-muted` is inspected in DevTools.

---

## Code Examples

### @font-face via Fontsource in fonts.css

```css
/* src/styles/fonts.css */
/* Source: https://fontsource.org/fonts/inter/install */
@import '@fontsource/inter/400.css';  /* Regular */
@import '@fontsource/inter/600.css';  /* Semibold */
@import '@fontsource/fira-code/400.css';
```

### Full reset.css :root Override

```css
/* src/styles/reset.css :root section — Phase 2 values */
:root {
  /* Colors */
  --color-surface: #ffffff;
  --color-surface-alt: #f8f9fa;
  --color-accent: #0077b6;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;

  /* Spacing scale — unchanged from Phase 1 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Typography */
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --font-family-mono: 'Fira Code', 'Courier New', monospace;
  --font-size-body: 16px;
  --font-size-label: 14px;
  --font-size-heading: 28px;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --line-height-body: 1.5;
  --line-height-heading: 1.2;

  /* Breakpoints — informational only, cannot be used in @media */
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1280px;
}
```

### Code Block Global Style in reset.css

```css
/* reset.css — global code block behavior (D-05, D-11) */
pre, code {
  font-family: var(--font-family-mono);
  background-color: var(--color-surface-alt);
  border-radius: 4px;
}

pre {
  overflow-x: auto;
  white-space: pre;
  padding: var(--space-md);
}

code {
  padding: 2px var(--space-xs);
}
```

### Playwright playwright.config.ts

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173/devliot/',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/devliot/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual woff/woff2 font download | Fontsource npm packages | ~2020, mainstream by 2023 | Fonts versioned with project, Vite handles asset pipeline |
| `@import url('https://fonts.googleapis.com/...')` | Self-hosted via Fontsource | Privacy regulations (GDPR 2022 court ruling) | No third-party request at runtime |
| `transform: scale()` for ASCII art resize | `font-size` reduction | — | Maintains character proportions; scale() distorts spacing |
| `/deep/` and `::shadow` CSS combinators | CSS custom properties as the pierce mechanism | Deprecated in Chrome 60 (2017) | Removed; custom properties now the only supported pierce technique |

**Deprecated/outdated:**
- `/deep/` combinator: Removed. CSS custom properties are the correct mechanism for cross-Shadow-DOM styling.
- Google Fonts CDN for production: Still works but triggers GDPR-reportable third-party requests. Fontsource is the correct alternative.

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a greenfield styling phase, not a rename/refactor/migration. No stored data, live service config, OS-registered state, secrets, or build artifacts carry old names that need updating.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | v22.14.0 | — |
| npm | Package installation | ✓ | 10.9.2 | — |
| Vite dev server | Playwright webServer | ✓ (installed) | 8.0.8 | — |
| Playwright Chromium | E2E tests | ✗ (not yet installed) | — | Run `npx playwright install chromium` in Wave 0 |
| `@fontsource/inter` | Self-hosted fonts | ✗ (not yet installed) | 5.2.8 available | — |
| `@fontsource/fira-code` | Self-hosted fonts | ✗ (not yet installed) | 5.2.7 available | — |
| `@playwright/test` | E2E test framework | ✗ (not yet installed) | 1.59.1 available | — |

**Missing dependencies with no fallback:**
- `@fontsource/inter` and `@fontsource/fira-code` — fonts are locked decisions (D-06, D-07, D-08); must be installed before font CSS can be built

**Missing dependencies with fallback:**
- None — Playwright Chromium is required for tests; `npx playwright install chromium` is the install command

---

## Validation Architecture

nyquist_validation is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 |
| Config file | `playwright.config.ts` (does not exist — Wave 0 creates it) |
| Quick run command | `npx playwright test --project=chromium tests/design-system.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-01 | ASCII logo visible in header | E2E | `npx playwright test --grep "header logo"` | ❌ Wave 0 |
| BRAND-01 | ASCII logo visible in hero section | E2E | `npx playwright test --grep "hero logo"` | ❌ Wave 0 |
| BRAND-02 | Inter font applied to body text | E2E | `npx playwright test --grep "body font"` | ❌ Wave 0 |
| BRAND-02 | Fira Code font applied to code elements | E2E | `npx playwright test --grep "code font"` | ❌ Wave 0 |
| BRAND-02 | Accent color is #0077b6 | E2E | `npx playwright test --grep "accent color"` | ❌ Wave 0 |
| INFRA-05 | No horizontal overflow at 375px | E2E | `npx playwright test --grep "overflow.*mobile"` | ❌ Wave 0 |
| INFRA-05 | No horizontal overflow at 768px | E2E | `npx playwright test --grep "overflow.*tablet"` | ❌ Wave 0 |
| INFRA-05 | No horizontal overflow at 1280px | E2E | `npx playwright test --grep "overflow.*desktop"` | ❌ Wave 0 |
| INFRA-05 | Header is sticky (position: sticky) | E2E | `npx playwright test --grep "sticky header"` | ❌ Wave 0 |
| INFRA-05 | Content max-width 720px at 1280px breakpoint | E2E | `npx playwright test --grep "max-width"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx playwright test --project=chromium tests/design-system.spec.ts`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `playwright.config.ts` — root config, webServer setup pointing to Vite dev server
- [ ] `tests/design-system.spec.ts` — all responsive + brand assertions
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Security Domain

This phase introduces no authentication, no user input, no data persistence, no API calls, and no secrets. The only external interaction is loading font files that will be self-hosted after build.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |

No threat patterns apply to a CSS-only, static, self-hosted font phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CSS `position: sticky` on `:host` in a Lit Shadow DOM component works correctly when the scroll ancestor has `min-height: 100vh` and no overflow set | Architecture Patterns / Pitfalls | If sticky fails in Shadow DOM, the header may need to be moved to a non-Shadow component or the app shell layout restructured |
| A2 | CSS custom properties cannot be used inside `@media` query conditions | Architecture Patterns (Pattern 2) | Negligible — this is a fundamental CSS specification fact; risk is essentially zero |
| A3 | The ASCII art example in the UI-SPEC uses the "ANSI Shadow" figlet font style | Architecture Patterns (Pattern 5) | Executor generates the art; if the exact style differs from OPENCODE aesthetic, it must be regenerated |

---

## Open Questions (RESOLVED)

1. **Hamburger button placeholder — markup structure**
   - What we know: D-10 says a hamburger button placeholder should be present in the header, with functionality deferred to Phase 4.
   - What's unclear: Should it be a `<button>` element styled with `display: none` at desktop, or omitted from DOM at desktop via JS? The UI-SPEC says "hamburger visible on mobile and tablet; hidden on desktop."
   - Recommendation: Use a CSS-only approach — `<button class="menu-toggle" aria-label="Ouvrir le menu">` with `display: none` via media query at `min-width: 1280px`. No JS needed in Phase 2.

2. **Inter font weights — which subset to load**
   - What we know: The design uses weight 400 (body) and 600 (semibold headings). D-08 says self-hosted.
   - What's unclear: Loading all weights adds ~300KB; loading only 400 and 600 reduces this significantly.
   - Recommendation: Import only `@fontsource/inter/400.css` and `@fontsource/inter/600.css`. The `index.css` default (which loads all weights) should not be used.

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: npm registry] — `@fontsource/inter` v5.2.8, `@fontsource/fira-code` v5.2.7, `@playwright/test` v1.59.1 — confirmed via `npm view` commands
- [VERIFIED: codebase] — `src/styles/reset.css`, `src/styles/app.css`, `src/styles/header.css`, `src/styles/footer.css`, `src/styles/home.css` — read directly to confirm current state
- [VERIFIED: codebase] — `package.json` — confirms existing dependencies and absence of Playwright
- [CITED: https://fontsource.org/fonts/inter/install] — Fontsource Vite import patterns
- [CITED: https://playwright.dev/docs/emulation] — Playwright viewport and responsive testing

### Secondary (MEDIUM confidence)

- [WebSearch verified] — Fontsource is the canonical npm distribution mechanism for Google Fonts self-hosting; confirmed by multiple npm packages with active maintenance
- [WebSearch verified] — Playwright 1.59.1 is current version as of April 2026

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry
- Architecture: HIGH — based on existing codebase patterns (Phase 1 code read directly) and official Fontsource/Playwright docs
- Pitfalls: MEDIUM — derived from CSS specification knowledge and common Shadow DOM patterns; one assumption (A1) flagged

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable domain — CSS, fonts, Playwright — 30-day validity)
