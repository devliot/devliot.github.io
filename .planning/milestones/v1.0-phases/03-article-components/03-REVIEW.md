---
phase: 03-article-components
reviewed: 2026-04-11T08:00:33Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/components/devliot-chart.ts
  - src/components/devliot-code.ts
  - src/components/devliot-diagram.ts
  - src/components/devliot-math.ts
  - src/main.ts
  - src/pages/devliot-article-page.ts
  - src/styles/article.css
  - src/styles/code.css
  - src/styles/devliot-chart.css
  - src/styles/devliot-code.css
  - src/styles/devliot-diagram.css
  - src/styles/devliot-math.css
  - tests/article-components.spec.ts
  - public/articles/demo-article.html
findings:
  critical: 1
  warning: 3
  info: 5
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-11T08:00:33Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

This review covers the Phase 3 article components: `devliot-code` (Shiki), `devliot-math` (KaTeX), `devliot-diagram` (Mermaid), `devliot-chart` (Chart.js), and the `devliot-article-page` orchestrator. All five components implement their core responsibility correctly. Lazy loading via `IntersectionObserver`, copy-to-clipboard, heading anchor deep links, and slug path-traversal prevention are all well-implemented.

One critical XSS issue exists in `devliot-diagram`'s error path — raw error message text is injected into the DOM via `innerHTML` without escaping. Three warnings cover a silent failure when `config` is empty on the chart component, repeated Mermaid global re-initialization across diagram instances, and a missing guard that allows `firstUpdated` to call `observe()` on an already-disconnected observer. Five informational findings cover a stale JSDoc comment, inconsistent `override` keyword usage, a hardcoded color value, an external placeholder image dependency in the demo, and the fragile style-delivery pattern for the light-DOM diagram component.

## Critical Issues

### CR-01: XSS via unescaped error message in `devliot-diagram` innerHTML

**File:** `src/components/devliot-diagram.ts:84`
**Issue:** When Mermaid throws a render error, `(e as Error).message` is assigned to `this._error` and then interpolated directly into an `innerHTML` assignment. If an error message contains HTML metacharacters (e.g. `<`, `>`, `&`, `"`), they render as markup. Mermaid surfaces the raw diagram source in some error messages, meaning author-controlled content from `<devliot-diagram>` text nodes reaches the DOM as unescaped HTML.

**Fix:**
```typescript
// Replace the innerHTML assignment in the catch block with a text-safe alternative:
} catch (e) {
  console.error('Mermaid render error:', e);
  const msg = (e as Error).message ?? String(e);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'diagram-error';
  errorDiv.textContent = msg; // textContent never interprets HTML
  this.innerHTML = '';
  this.appendChild(errorDiv);
}
```
Remove the `_error` state field if it is only used to feed this innerHTML path — it is unused elsewhere.

## Warnings

### WR-01: `JSON.parse` called on empty-string default in `devliot-chart`

**File:** `src/components/devliot-chart.ts:68`
**Issue:** `this.config` defaults to `''` (line 29). When `_renderChart` is called with no `config` attribute set, `JSON.parse('')` throws a `SyntaxError`. This error is caught and `console.error`'d, but the chart silently renders nothing — the canvas remains blank with no fallback UI. Authors who forget the `config` attribute get no diagnostic feedback.

**Fix:**
```typescript
private async _renderChart(): Promise<void> {
  if (!this.config) {
    console.error('devliot-chart: missing required `config` attribute');
    return;
  }
  try {
    // ... existing code
    const chartConfig = JSON.parse(this.config);
```
The guard makes the failure explicit and avoids the catch path eating a preventable error.

### WR-02: `mermaid.initialize()` called on every diagram instance

**File:** `src/components/devliot-diagram.ts:66`
**Issue:** Each `devliot-diagram` element calls `mermaid.initialize({ startOnLoad: false, theme: 'neutral' })` during its render. Mermaid's `initialize` mutates shared global state. When multiple diagrams exist on one article page and render concurrently (they are all lazy-loaded), later `initialize` calls can overwrite or reset configuration state that an in-flight earlier `render` call depends on, causing unpredictable rendering failures.

**Fix:**
Initialize once per module load using a module-level flag:

```typescript
// At module scope, outside the class:
let _mermaidInitialized = false;

// Inside _renderDiagram, before mermaid.render():
const { default: mermaid } = await import('mermaid');
if (!_mermaidInitialized) {
  mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
  _mermaidInitialized = true;
}
```

### WR-03: `firstUpdated` calls `observe()` on potentially disconnected observer

**File:** `src/components/devliot-chart.ts:51`
**Issue:** `connectedCallback` creates `this._observer`. `firstUpdated` then calls `this._observer!.observe(this)`. If the element is disconnected between `connectedCallback` and `firstUpdated` (e.g., rapid route navigation), `disconnectedCallback` runs first — calling `this._observer?.disconnect()` and `this._chart?.destroy()` — and then `firstUpdated` fires and registers an observation on the already-disconnected observer. The element will never receive intersection events, leaking the observer reference until GC.

**Fix:**
```typescript
override firstUpdated() {
  // Guard against the element being detached before first render
  if (this.isConnected) {
    this._observer!.observe(this);
  }
}
```

## Info

### IN-01: Stale JSDoc comment references Mermaid instead of Chart.js

**File:** `src/components/devliot-chart.ts:19`
**Issue:** The JSDoc block says "Mermaid renders on viewport entry via IntersectionObserver" — this is a copy-paste from `devliot-diagram.ts`. The component is Chart.js, not Mermaid.

**Fix:** Change to "Chart.js renders on viewport entry via IntersectionObserver (rootMargin 200px lookahead)."

### IN-02: Missing `override` keyword on `connectedCallback` and `firstUpdated` in `devliot-code`

**File:** `src/components/devliot-code.ts:18,24`
**Issue:** `connectedCallback` and `firstUpdated` are defined without the `override` keyword, inconsistent with `devliot-chart.ts`, `devliot-diagram.ts`, and `devliot-article-page.ts` which all use `override`. With `noImplicitOverride` enabled this would be a compile error; without it, it is a maintainability inconsistency.

**Fix:**
```typescript
override connectedCallback() {
  super.connectedCallback();
  // ...
}

override firstUpdated() {
  this._highlight();
}
```
Same pattern applies to `devliot-math.ts` lines 15 and 21.

### IN-03: Hardcoded color value in `devliot-code.css`

**File:** `src/styles/devliot-code.css:41`
**Issue:** `border: 1px solid #e0e0e0` uses a hardcoded hex color for the copy button border. Every other border in the stylesheets uses this same value (`devliot-diagram.css:4`, `article.css`), but none abstract it into a CSS variable. If the design token changes, all instances need updating manually.

**Fix:** Define `--color-border: #e0e0e0` in the global design token sheet and replace hardcoded occurrences:
```css
border: 1px solid var(--color-border);
```

### IN-04: External placeholder image service in demo article

**File:** `public/articles/demo-article.html:52`
**Issue:** The demo article references `https://via.placeholder.com/800x400/...` — an external CDN that has had availability issues in the past. If the service is down, the ART-04 Playwright test fails (the `<img>` renders but may show a broken image). For a static blog on GitHub Pages, demo assets should be local.

**Fix:** Add a small placeholder SVG or PNG to `public/assets/` and reference it with a relative path:
```html
<img src="/assets/demo-placeholder.png" alt="A placeholder technical diagram" />
```

### IN-05: Diagram component styles delivered via light-DOM external CSS selector

**File:** `src/styles/devliot-diagram.css:1-29`
**Issue:** Because `devliot-diagram` uses light DOM (no shadow root), its styles are injected into `devliot-article-page`'s shadow root via `diagramStyles` import (see `devliot-article-page.ts:7,14`). This means `devliot-diagram` is only styled correctly when used inside `devliot-article-page`. Using the component standalone or in any other host would produce an unstyled element. The coupling is implicit and not documented.

**Fix:** Add a comment to both files documenting the coupling:
```typescript
// devliot-article-page.ts
// NOTE: devliot-diagram uses light DOM; its styles are injected here
// because Shadow DOM scoping cannot apply to the element's own host.
import diagramStyles from '../styles/devliot-diagram.css?inline';
```
This is an architectural constraint (Mermaid's Shadow DOM incompatibility), not a bug, but the dependency should be explicit.

---

_Reviewed: 2026-04-11T08:00:33Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
