---
phase: 03-article-components
plan: "03"
subsystem: article-components
tags: [mermaid, chart.js, lazy-loading, intersection-observer, light-dom, web-components]
dependency_graph:
  requires: ["03-01", "03-02"]
  provides: ["devliot-diagram", "devliot-chart"]
  affects: ["src/main.ts", "src/pages/devliot-article-page.ts"]
tech_stack:
  added: ["mermaid (dynamic import)", "chart.js (dynamic import)"]
  patterns: ["IntersectionObserver lazy loading", "light DOM override (createRenderRoot)", "JSON config attribute"]
key_files:
  created:
    - src/components/devliot-diagram.ts
    - src/styles/devliot-diagram.css
    - src/components/devliot-chart.ts
    - src/styles/devliot-chart.css
  modified:
    - src/main.ts
    - src/pages/devliot-article-page.ts
decisions:
  - "devliot-diagram uses light DOM (createRenderRoot returns this) to bypass Mermaid Shadow DOM incompatibility (mermaid#6306)"
  - "devliot-chart uses Shadow DOM normally — Chart.js has no Shadow DOM issues"
  - "Both components use IntersectionObserver with 200px rootMargin for pre-viewport lazy loading"
  - "devliot-diagram CSS loaded via devliot-article-page styles array (shadow root contains devliot-diagram elements)"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-11"
  tasks_completed: 2
  files_modified: 6
---

# Phase 03 Plan 03: devliot-diagram and devliot-chart Components Summary

Lazy-loaded Mermaid diagram component (light DOM, createRenderRoot override) and lazy-loaded Chart.js chart component, both deferred via IntersectionObserver until viewport entry.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | devliot-diagram: lazy Mermaid, light DOM, neutral theme | 83703d4 |
| 2 | devliot-chart: lazy Chart.js, JSON config, canvas, destroy on disconnect | 740de47 |

## What Was Built

### devliot-diagram (`src/components/devliot-diagram.ts`)

A Lit web component that renders Mermaid diagrams on viewport entry:

- **Light DOM rendering**: `createRenderRoot()` returns `this` instead of a shadow root. This is required because Mermaid traverses the real DOM for CSS layout measurements and breaks inside Shadow DOM (mermaid#6306).
- **Lazy loading**: `IntersectionObserver` with `rootMargin: '200px'` defers `import('mermaid')` until the element is near the viewport. Mermaid (~2MB) is never loaded on pages without diagrams.
- **Definition capture**: `textContent` is read and cleared in `connectedCallback()` before rendering. The diagram definition is passed to `mermaid.render()` with a unique ID.
- **Error handling**: Mermaid syntax errors are caught and displayed as plain text in a `.diagram-error` div.
- **Neutral theme**: `mermaid.initialize({ startOnLoad: false, theme: 'neutral' })` for white-background compatibility.

### devliot-diagram.css (`src/styles/devliot-diagram.css`)

Global styles targeting `devliot-diagram` element (light DOM, loaded via article-page shadow root):
- `border: 1px solid #e0e0e0`, `padding: var(--space-md)`, `margin: var(--space-xl) 0`
- Centered SVG container with `max-width: 100%`
- Error display in monospace font

### devliot-chart (`src/components/devliot-chart.ts`)

A Lit web component that renders Chart.js charts on viewport entry:

- **Shadow DOM**: Standard Lit rendering — Chart.js works correctly in Shadow DOM.
- **Lazy loading**: `IntersectionObserver` with `rootMargin: '200px'` defers `import('chart.js')` until the chart is near the viewport.
- **JSON config**: Full Chart.js configuration passed as a JSON string via the `config` attribute. If `config` lacks a `type` field, the `type` attribute is used as fallback.
- **Instance lifecycle**: `this._chart?.destroy()` called in `disconnectedCallback()` to prevent "Canvas is already in use" errors on re-mount.
- **Registration**: `Chart.register(...registerables)` called once on first render to register all Chart.js components.

### devliot-chart.css (`src/styles/devliot-chart.css`)

Scoped styles (Shadow DOM):
- `:host { display: block; margin: var(--space-xl) 0 }`
- `.chart-container { max-width: 100%; width: 100% }`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit`: passed (no errors)
- `npm run build`: succeeded (415ms, all chunks built correctly)
- Mermaid and Chart.js are split into separate async chunks by Vite's dynamic import detection, confirming lazy loading will work correctly at runtime

## Known Stubs

None — both components are fully wired. Mermaid renders from textContent; Chart.js renders from `config` attribute JSON.

## Threat Flags

No new security surface beyond what was modeled in the plan's threat register. All threats accepted (T-03-08 through T-03-11): both `config` attribute (Chart.js) and `textContent` (Mermaid) are author-controlled static HTML, not user input.

## Self-Check

- [x] `src/components/devliot-diagram.ts` exists
- [x] `src/styles/devliot-diagram.css` exists
- [x] `src/components/devliot-chart.ts` exists
- [x] `src/styles/devliot-chart.css` exists
- [x] Commit 83703d4 exists (Task 1)
- [x] Commit 740de47 exists (Task 2)
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` succeeds

## Self-Check: PASSED
