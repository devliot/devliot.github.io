---
phase: 03-article-components
plan: "02"
subsystem: article-rendering
tags: [lit, shiki, katex, copy-button, line-numbers, css-counters, inline-math, block-math]
dependency_graph:
  requires: [03-01]
  provides: [devliot-code, devliot-math]
  affects: [src/components/devliot-code.ts, src/styles/devliot-code.css, src/components/devliot-math.ts, src/styles/devliot-math.css, src/main.ts]
tech_stack:
  added: []
  patterns: [dynamic-import-shiki, katex-renderToString-unsafeHTML, CSS-counter-line-numbers, clipboard-api-copy, hover-reveal-copy-button]
key_files:
  created:
    - src/components/devliot-code.ts
    - src/styles/devliot-code.css
    - src/components/devliot-math.ts
    - src/styles/devliot-math.css
  modified:
    - src/main.ts
decisions:
  - "Shiki loaded via dynamic import() in _highlight() rather than static top-level import — keeps initial bundle lean; grammars lazy-load on demand per Shiki 4 default behavior"
  - "Copy button width auto-expands via :has(.copy-feedback) selector when showing Copied!/Copy failed text — avoids separate state for button sizing"
  - "counter-reset: step placed on pre.shiki code (not pre) to align counter with .line spans that Shiki emits inside the code element"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 03 Plan 02: Code and Math Components Summary

**One-liner:** Shiki-highlighted code blocks with CSS-counter line numbers, hover-reveal copy button, and language badge, plus synchronous KaTeX math rendering for inline and display modes.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Build devliot-code component with Shiki, copy button, line numbers, language badge | 1f58e26 | src/components/devliot-code.ts, src/styles/devliot-code.css, src/main.ts |
| 2 | Build devliot-math component with KaTeX inline and block rendering | d312221 | src/components/devliot-math.ts, src/styles/devliot-math.css, src/main.ts |

---

## What Was Built

### devliot-code (src/components/devliot-code.ts)

Lit element that renders Shiki-highlighted code with GitHub Light theme:

- **Lifecycle:** `connectedCallback` captures raw `this.textContent` into `_code` before Lit renders, clears textContent to suppress raw display. `firstUpdated` triggers `_highlight()`.
- **Highlighting:** Dynamic `import('shiki')` in `_highlight()` calls `codeToHtml(code, { lang, theme: 'github-light' })`. Output injected via `unsafeHTML`. Falls back to plain `<pre><code>` while Shiki loads.
- **Line numbers:** CSS counters on `.line::before` pseudo-element — `counter-reset: step` on `pre.shiki code`, `counter-increment: step` on `.line::before`. Shiki emits `.line` spans per line in its output.
- **Language badge:** `<span class="lang-badge">` positioned absolute top-right, always visible, shows `lang.toUpperCase()`.
- **Copy button:** `<button class="copy-btn" aria-label="Copy code">` — 44x44px touch target, `opacity: 0` default, `opacity: 1` on `.code-block:hover`. Calls `navigator.clipboard.writeText(_code)`. Shows "Copied!" for 2s on success, "Copy failed" for 2s on error. Button auto-widens via `:has(.copy-feedback)`.
- **Registered** in `src/main.ts` as second import after `katex/dist/katex.min.css`.

### devliot-math (src/components/devliot-math.ts)

Lit element wrapping KaTeX for synchronous math rendering:

- **Lifecycle:** `connectedCallback` captures `this.textContent` into `_latex`, clears textContent. `firstUpdated` calls `_renderMath()`.
- **Rendering:** `katex.renderToString(_latex, { throwOnError: false, displayMode: this.hasAttribute('display') })`. `throwOnError: false` means invalid LaTeX renders KaTeX's native red error inline. `catch` block adds a `.math-error` span for truly unexpected errors.
- **Inline mode (default):** `:host { display: inline; vertical-align: baseline }` — renders flush with surrounding prose baseline.
- **Block mode (`display` attribute):** `:host([display]) { display: block; text-align: center; margin: var(--space-xl) 0 }` — centered with 32px vertical margins.
- **KaTeX CSS** already imported globally in `main.ts` (from Plan 01) — `devliot-math` relies on this global CSS; no per-shadow-DOM KaTeX style injection needed.
- **Registered** in `src/main.ts` as third import.

### src/main.ts (updated)

Final import order:
```typescript
import 'katex/dist/katex.min.css';      // must be first
import './components/devliot-code.js';
import './components/devliot-math.js';
import './devliot-app.js';
```

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written with two minor additions:

1. Added `_copyFailed` state (separate boolean from `_copied`) to cleanly track "Copy failed" vs "Copied!" states — the plan described both states but used a single `_copied` state. Separate booleans are cleaner.
2. Added `:has(.copy-feedback)` selector to auto-expand copy button width when showing text feedback — needed to prevent text clipping at fixed 44px width.

Both additions are cosmetic improvements that do not change the required behavior.

---

## Known Stubs

None — both components are fully wired. `devliot-code` reads actual code from `textContent` and calls Shiki. `devliot-math` reads actual LaTeX from `textContent` and calls KaTeX. No hardcoded or placeholder data.

---

## Threat Flags

None — all trust boundaries (textContent → Shiki/KaTeX, unsafeHTML injection, clipboard write) are covered by the plan's threat model (T-03-04 through T-03-07). All accepted. No new unmodeled attack surface introduced.

---

## Self-Check: PASSED

Files exist:
- src/components/devliot-code.ts: FOUND
- src/styles/devliot-code.css: FOUND
- src/components/devliot-math.ts: FOUND
- src/styles/devliot-math.css: FOUND

Commits exist:
- 1f58e26: FOUND (feat(03-02): build devliot-code component with Shiki, copy button, line numbers, language badge)
- d312221: FOUND (feat(03-02): build devliot-math component with KaTeX inline and block rendering)
