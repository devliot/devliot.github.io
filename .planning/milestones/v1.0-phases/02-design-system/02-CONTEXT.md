# Phase 2: Design System - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The site gets a recognizable DEVLIOT brand identity (logo, colors, typography) and a responsive layout that renders correctly on mobile (375px), tablet (768px), and desktop (1280px). This phase replaces the skeleton design tokens from Phase 1 with the real brand. No article rendering components, no navigation features, no content — just the visual foundation.

</domain>

<decisions>
## Implementation Decisions

### Logo & brand mark
- **D-01:** ASCII art logo in block letter style — large blocky characters, bold terminal aesthetic (inspired by OPENCODE)
- **D-02:** Logo appears in two places: full-size ASCII art in the home page hero section, and a smaller scaled version in the site header
- **D-03:** On mobile, the ASCII logo scales down via font-size reduction rather than switching to plain text — ASCII art is preserved at all breakpoints

### Color palette
- **D-04:** Light minimal theme — white background (`#ffffff`), dark text (`#1a1a1a`), ocean blue accent (`#0077b6`), light gray surface (`#f8f9fa`)
- **D-05:** Code blocks use a light/gray background that blends with the page (no dark code blocks)

### Typography
- **D-06:** Body font: Inter (sans-serif) — clean, modern, highly readable at all sizes
- **D-07:** Code font: Fira Code (monospace with coding ligatures)
- **D-08:** Fonts are self-hosted — font files bundled in the repo, no external CDN requests

### Responsive layout
- **D-09:** Content max-width is 720px on desktop, centered with generous margins — optimal for long-form reading (~65-75 chars per line)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/REQUIREMENTS.md` — BRAND-01, BRAND-02, INFRA-05 define what this phase must deliver
- `.planning/ROADMAP.md` §Phase 2 — Success criteria and phase goal
- `CLAUDE.md` §Technology Stack — Recommended versions and rationale

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-03 (external CSS files), D-04 (Shadow DOM), D-08 (app shell structure), D-10 (header structure)

### Existing design tokens
- `src/styles/reset.css` — Current CSS custom properties (spacing scale, placeholder colors, typography) that Phase 2 must override

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/styles/reset.css` — CSS custom properties already defined (spacing scale: 4px–64px, color vars, typography vars). Phase 2 overrides these values.
- `src/devliot-app.ts` — App shell with header/main/footer flex layout. Responsive modifications go here.
- `src/components/devliot-header.ts` — Currently a plain `<a>DEVLIOT</a>` link. Will hold the scaled ASCII logo.

### Established Patterns
- External CSS with `?inline` imports and `unsafeCSS()` — all styling follows this pattern (D-03 from Phase 1)
- Shadow DOM on all components — CSS custom properties from `:root` pierce Shadow DOM, so design tokens in `reset.css` propagate everywhere
- Spacing scale uses multiples of 4 (4px to 64px) — maintain this convention

### Integration Points
- `index.html` — `<link rel="stylesheet" href="/src/styles/reset.css">` loads global tokens. Font `@font-face` declarations go here or in a new fonts CSS file.
- `src/styles/app.css` — App shell layout (flex column, min-height 100vh). Responsive breakpoints and content max-width apply here.
- `src/styles/header.css` — Header styling. Will need updates for sticky behavior and ASCII logo.
- `src/styles/home.css` — Home page hero section. Will hold the full-size ASCII logo.

</code_context>

<specifics>
## Specific Ideas

- The user specifically requested **ASCII art** for the logo — not an SVG or image. This is a distinctive choice that defines the brand aesthetic.
- OPENCODE-inspired style: bold, terminal-feel block letters.
- The user explicitly chose `#0077b6` as the accent color (rejected generic blue `#0066cc`). This exact value is non-negotiable.
- Light code blocks chosen deliberately to maintain visual cohesion with the light theme — the user rejected dark code blocks.
- Self-hosted fonts chosen for independence from external services — consistent with the handcrafted, no-CDN philosophy.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-design-system*
*Context gathered: 2026-04-10*
