# Phase 10: Per-article Bibliography - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 10-per-article-bibliography
**Areas discussed:** References section presentation, Inline citation style, Bidirectional linking UX, Section label language

---

## References section presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal rule + heading | A thin 1px line (like existing tag separator) followed by an h2-level heading. Consistent with .article-tags pattern. | ✓ |
| Heading only | Just the heading, no visual separator line. Clean and minimal. | |
| You decide | Claude picks based on existing patterns | |

**User's choice:** Horizontal rule + heading
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Compact single-line | Each entry on one line: [N] Authors — Title. Publisher/URL, Year. Title is clickable link when URL exists. | ✓ |
| Card-style blocks | Each reference as a distinct block with subtle background, fields on separate lines. | |
| You decide | Claude picks based on existing typography | |

**User's choice:** Compact single-line
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Title as link | Title text is the clickable link (underlined). No raw URL shown. Cleaner look, standard academic web style. | ✓ |
| Visible URL below title | Title is plain text, raw URL displayed below as a clickable link. More transparent. | |

**User's choice:** Title as link
**Notes:** None

---

## Inline citation style

| Option | Description | Selected |
|--------|-------------|----------|
| Superscript number | Like academic papers: small raised number. Unobtrusive in reading flow. | |
| Bracketed number | Text [1] inline at normal text size. More visible, matches [N] numbering in references section. | ✓ |
| You decide | Claude picks based on readability | |

**User's choice:** Bracketed number [N] at normal text size
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Muted text, underline on hover | Uses --color-text-muted. Underlines only on hover. Distinct from content links (--color-accent). | ✓ |
| Accent color like regular links | Same --color-accent + underline as normal article links. Consistent but may look cluttered. | |
| You decide | Claude picks based on monochrome palette | |

**User's choice:** Muted text, underline on hover
**Notes:** None

---

## Bidirectional linking UX

| Option | Description | Selected |
|--------|-------------|----------|
| Smooth scroll | Animated smooth scroll to target. Consistent with Phase 7 heading anchor behavior. | ✓ |
| Instant jump | No animation, instant jump. Faster but disorienting on long articles. | |
| You decide | Claude picks based on Phase 7 patterns | |

**User's choice:** Smooth scroll
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| ↩ arrow | Small ↩ character after reference entry. Standard academic/Wikipedia convention. Muted color, clickable. | ✓ |
| Caret ▴ | Small upward caret after reference. Less conventional but visually clean. | |
| You decide | Claude picks most readable option | |

**User's choice:** ↩ arrow
**Notes:** None

---

## Section label language

| Option | Description | Selected |
|--------|-------------|----------|
| Références (French) | Consistent with French UI pattern from Phase 8 and Phase 9. | ✓ |
| References (English) | Standard academic convention. May feel inconsistent with French byline/search. | |

**User's choice:** Références (French)
**Notes:** None

---

## Claude's Discretion

- CSS specifics (font sizes, spacing, indentation)
- DOM manipulation vs regex for `[id]` → `[N]` transformation
- Render method extraction (`_renderReferences()`)
- Anchor `id` attribute naming scheme

## Deferred Ideas

None — discussion stayed within phase scope.
