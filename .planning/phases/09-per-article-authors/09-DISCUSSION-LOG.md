# Phase 9: Per-article Authors - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 09-per-article-authors
**Areas discussed:** Byline format and placement, Graceful degradation, JSON-LD structured data, Author linking

---

## Byline Format

| Option | Description | Selected |
|--------|-------------|----------|
| Eliott · Sample Coauthor | Same middle-dot separator as date/reading-time | |
| par Eliott et Sample Coauthor | French 'par X et Y' format, matches French site language | ✓ |
| Eliott, Sample Coauthor | Simple comma-separated, no prefix | |

**User's choice:** French format "par X et Y"
**Notes:** Consistent with French site metadata (search placeholder, aria-labels).

## Byline Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Same line, after reading time | One compact metadata line | |
| Same line, before date | Author leads, date follows | |
| Separate line below | Byline on its own line below date/reading-time | ✓ |

**User's choice:** Separate line below
**Notes:** Gives the byline its own visual weight.

## Author Linking

**User's choice:** Authors with a URL are clickable links. Authors without URL are plain text.
**Notes:** User proactively stated "Je veux que les auteurs soient des liens clicables vers une url définie" — decided before the formal question was asked.

## No-URL Authors

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text (no link) | Only authors with URL are clickable | ✓ |
| Always link, fallback to # | Every name styled as link, no-URL gets # href | |

**User's choice:** Plain text (no link)

## Graceful Degradation

| Option | Description | Selected |
|--------|-------------|----------|
| Line disappears | No byline at all when no authors | |
| Show 'Auteur inconnu' | Placeholder text | |

**User's choice:** Default to "par Devliot" with link to https://github.com/devliot
**Notes:** User chose neither option — provided custom answer: "Auteur Devliot par défaut, le lien renvoie vers https://github.com/devliot"

## JSON-LD Injection Method

| Option | Description | Selected |
|--------|-------------|----------|
| Inject at render time | Component appends to document.head at runtime | |
| Generate static at build | Build script generates into static HTML | ✓ |

**User's choice:** Static generation at build time
**Notes:** Prioritizes crawler reliability.

## JSON-LD Target File

| Option | Description | Selected |
|--------|-------------|----------|
| Into existing index.html | Append to existing article HTML | |
| Dedicated og.html | New file per article with JSON-LD | ✓ |

**User's choice:** Dedicated og.html
**Notes:** Keeps content and SEO markup separate.

## JSON-LD Fields

| Option | Description | Selected |
|--------|-------------|----------|
| headline + datePublished | Minimum viable BlogPosting | ✓ |
| description + image | Richer search snippets | ✓ |
| publisher (DEVLIOT) | Declare DEVLIOT as Organization | ✓ |

**User's choice:** All three — full BlogPosting with headline, date, description, image, publisher, and author.

---

## Claude's Discretion

- Byline CSS styling (font-size, color, spacing)
- Build script implementation approach
- og.html structure beyond the JSON-LD script block
- Default author handling in JSON-LD (include Devliot or omit author field)

## Deferred Ideas

- Home page logo malformation (user bug report: "Le logo de la page principale est malformé")
- Author profile pages
- Author avatars
