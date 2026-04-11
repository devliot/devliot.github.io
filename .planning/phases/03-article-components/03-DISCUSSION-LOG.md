# Phase 3: Article Components - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 03-article-components
**Areas discussed:** Article authoring model, Code block behavior, Math & diagram rendering, Article typography & spacing

---

## Article Authoring Model

| Option | Description | Selected |
|--------|-------------|----------|
| One component per article | Each article is a dedicated Lit class with HTML in render() | |
| Generic renderer + HTML files | One devliot-article-page that fetches external .html files | ✓ |
| You decide | Claude picks | |

**User's choice:** Generic renderer + HTML files
**Notes:** Cleaner separation — author writes HTML, not TypeScript.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Custom elements in HTML | Articles use `<devliot-code>`, `<devliot-math>` etc. Lit auto-upgrades | ✓ |
| Plain HTML + post-processing | Standard HTML with script-based init for Shiki/KaTeX/Mermaid | |
| You decide | Claude picks | |

**User's choice:** Custom elements in HTML
**Notes:** Fits the Lit architecture — clean authoring with auto-upgrade.

---

| Option | Description | Selected |
|--------|-------------|----------|
| articles/ folder + JSON frontmatter | HTML files + companion .json metadata + index.json registry | ✓ |
| articles/ folder + JS module metadata | TypeScript metadata exports + HTML content | |
| You decide | Claude picks | |

**User's choice:** articles/ folder + JSON frontmatter
**Notes:** Simplest approach for a static blog.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Include a demo article | Real article exercising all content types | ✓ |
| Components only, no demo | Build components, test with E2E only | |

**User's choice:** Include a demo article

---

## Code Block Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Light | Clean, neutral, widely recognized | ✓ |
| Vitesse Light | Minimal, muted tones | |
| Min Light | Almost monochrome | |
| You decide | Claude picks | |

**User's choice:** GitHub Light
**Notes:** Compatible with grayscale aesthetic while keeping syntax readable.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right corner, icon only | Clipboard icon on hover, "Copied!" feedback | ✓ |
| Top-right, text label | "Copy" text button | |
| You decide | Claude picks | |

**User's choice:** Top-right corner, icon only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Language badge, no line numbers | Language label only, clean | |
| Language badge + line numbers | Both language label and line numbers | ✓ |
| Nothing extra | Maximum minimalism | |
| You decide | Claude picks | |

**User's choice:** Language badge + line numbers

---

## Math & Diagram Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| LaTeX in custom element | `<devliot-math>` with LaTeX content, `display` attribute for block | ✓ |
| Dollar-sign delimiters + post-processing | $...$ and $$...$$ with DOM scanning | |
| You decide | Claude picks | |

**User's choice:** LaTeX in custom element

---

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy-load both | Import Mermaid/Chart.js only when visible (IntersectionObserver) | ✓ |
| Eager-load everything | Import upfront | |
| You decide | Claude picks | |

**User's choice:** Lazy-load both
**Notes:** Performance priority — Mermaid ~200KB, Chart.js ~60KB.

---

| Option | Description | Selected |
|--------|-------------|----------|
| JSON config in element attribute | `config='{...}'` attribute on `<devliot-chart>` | ✓ |
| Inline script block | `<script type="application/json">` inside element | |
| You decide | Claude picks | |

**User's choice:** JSON config in element attribute

---

## Article Typography & Spacing

| Option | Description | Selected |
|--------|-------------|----------|
| Hover-reveal # symbol | '#' appears left of heading on hover, copies anchor URL | ✓ |
| Permanent link icon | Chain-link icon always visible | |
| You decide | Claude picks | |

**User's choice:** Hover-reveal # symbol

---

| Option | Description | Selected |
|--------|-------------|----------|
| Caption text only | Just descriptive text below image | |
| Numbered figures | "Figure 1: Description" formal style | ✓ |
| You decide | Claude picks | |

**User's choice:** Numbered figures with caption text
**Notes:** User specified "caption text + Numbered" — semi-academic style.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Generous spacing | 32-48px between major blocks, 16-24px between paragraphs | ✓ |
| Compact spacing | 16-24px between major blocks, 8-12px between paragraphs | |
| You decide | Claude picks | |

**User's choice:** Generous spacing

---

## Claude's Discretion

- Shiki language bundle selection
- Mermaid diagram container sizing
- Chart.js grayscale color palette
- KaTeX CSS loading strategy
- Article HTML fetching mechanism
- Error states for failed renders
- Figure auto-numbering implementation

## Deferred Ideas

None
