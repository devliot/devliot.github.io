# Phase 2: Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 02-design-system
**Areas discussed:** Logo & brand mark, Color palette, Typography, Responsive layout

---

## Logo & brand mark

| Option | Description | Selected |
|--------|-------------|----------|
| Block letters | Large blocky ASCII characters, bold terminal aesthetic | ✓ |
| Minimal line art | Thin, clean ASCII lines, lighter weight | |
| Figlet / banner style | Classic figlet-generated banner, retro | |
| You decide | Claude picks | |

**User's choice:** Block letters — bold ASCII art inspired by OPENCODE style
**Notes:** User specifically requested ASCII art logo (not SVG or image). This was a clarification before the first question was presented.

| Option | Description | Selected |
|--------|-------------|----------|
| Header only | ASCII logo in site header on every page | |
| Header + home hero | Full-size in hero, smaller in header | ✓ |
| Home hero only | ASCII logo only on home page, simple text in header | |

**User's choice:** Header + home hero

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text on mobile | Switch to styled "DEVLIOT" text below 768px | |
| Scaled ASCII everywhere | Keep ASCII art on all screens via font-size reduction | ✓ |
| You decide | Claude picks | |

**User's choice:** Scaled ASCII everywhere

---

## Color palette

| Option | Description | Selected |
|--------|-------------|----------|
| Dark theme | Dark bg (#0d1117), light text, blue accent | |
| Light minimal | White bg, dark text, ocean blue #0077b6 accent | ✓ |
| High contrast terminal | Black bg, green/amber text, retro CRT | |

**User's choice:** Light minimal with #0077b6 accent
**Notes:** User rejected the initial blue accent (#0066cc) and specified #0077b6 explicitly. This exact value is a deliberate choice.

| Option | Description | Selected |
|--------|-------------|----------|
| Dark code blocks | Dark background for visual separation | |
| Light code blocks | Light/gray background that blends with page | ✓ |
| You decide | Claude picks | |

**User's choice:** Light code blocks

---

## Typography

| Option | Description | Selected |
|--------|-------------|----------|
| Inter | Clean modern sans-serif, used by GitHub/Vercel/Linear | ✓ |
| Source Sans 3 | Adobe's open-source, warmer, good for long-form | |
| System fonts only | No external fonts, fastest performance | |
| Serif (Merriweather) | Editorial feel, less common for tech blogs | |

**User's choice:** Inter

| Option | Description | Selected |
|--------|-------------|----------|
| JetBrains Mono | Monospace with ligatures, popular in dev tools | |
| Fira Code | Mozilla's monospace with ligatures, rounder | ✓ |
| System monospace | No extra font to load | |

**User's choice:** Fira Code

| Option | Description | Selected |
|--------|-------------|----------|
| Google Fonts | Load from CDN, easiest setup | |
| Self-hosted | Font files in repo, no external requests | ✓ |
| You decide | Claude picks | |

**User's choice:** Self-hosted

---

## Responsive layout

| Option | Description | Selected |
|--------|-------------|----------|
| 720px | Classic blog reading width, ~65-75 chars/line | ✓ |
| 900px | Wider, more room for code blocks | |
| Full width | Stretches to viewport | |

**User's choice:** 720px content max-width

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky compact header | Stays visible, logo scales, hamburger placeholder | ✓ |
| Static header | Scrolls away with page | |
| You decide | Claude picks | |

**User's choice:** Sticky compact header

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll | Code stays on one line, user scrolls sideways | ✓ |
| Wrap lines | Long lines wrap, no scroll needed | |
| You decide | Claude picks | |

**User's choice:** Horizontal scroll for code blocks on mobile

---

## Claude's Discretion

- Exact ASCII art generation for the DEVLIOT block letters
- Heading font treatment
- Breakpoint values beyond 375/768/1280
- Spacing adjustments between breakpoints
- Footer responsive behavior
- Font file formats and @font-face declarations
- CSS custom property naming

## Deferred Ideas

None — discussion stayed within phase scope.
