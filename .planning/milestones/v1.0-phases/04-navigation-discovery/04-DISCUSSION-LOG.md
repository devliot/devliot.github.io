# Phase 4: Navigation & Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 04-navigation-discovery
**Areas discussed:** Article listing layout, Category & tag navigation, Search experience, Empty & edge states

---

## Article Listing Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Compact list | Title + date + category on one line. Dense, scannable. | ✓ |
| Cards | Each article as a card with excerpt. More visual. | |
| Grouped by category | Articles grouped under category headings. | |

**User's choice:** Compact list
**Notes:** Fits the minimalist brand. Dense and scannable like a table of contents.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep hero + list below | Hero logo stays, list appears below | ✓ |
| Remove hero, list only | Pure article listing | |
| Smaller hero | Compact hero, then list | |

**User's choice:** Keep hero + list below

---

## Category & Tag Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Filter chips above list | Clickable chips, filters in-place | ✓ |
| Dedicated category pages | Each category gets its own route | |
| Sidebar navigation | Persistent sidebar with category list | |

**User's choice:** Filter chips above list

**Tags vs Categories:** User clarified that tags and categories are the same thing for now — one flat set of filter chips.

---

## Search Experience

| Option | Description | Selected |
|--------|-------------|----------|
| In the article listing | Search bar between chips and list | |
| In the header | Search icon in sticky header, expands on click | ✓ |
| Both | Header icon + home page search bar | |

**User's choice:** In the header

| Option | Description | Selected |
|--------|-------------|----------|
| Title + tags only | Lightweight index | |
| Full article text | Full HTML content indexed | ✓ |

**User's choice:** Title + full article text + tags (all three)

---

## Empty & Edge States

| Option | Description | Selected |
|--------|-------------|----------|
| Simple text message | "No articles found." | ✓ |
| Message + suggestion | Message with reset link | |

**User's choice:** Simple text message

---

## Deferred Ideas

- Article sources/references — bibliography at bottom of articles (Phase 5)
- Article co-authors — name/pseudo + GitHub/LinkedIn link (Phase 5)
