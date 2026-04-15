# Phase 8: UI Refresh - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 08-ui-refresh
**Areas discussed:** Separator visual, Search bar on home, Logo on article, Page-variant detection

---

## Separator visual (UI-01 / UI-02)

### Q1: How should the header separate visually from the body on a white background?

| Option | Description | Selected |
|--------|-------------|----------|
| Static 1px bottom border always | Permanent 1px bottom border on the header. Simplest, always visible, no JS. Same treatment for footer top-border. | |
| Scroll-activated shadow | Header has no border at rest; a soft box-shadow (monochrome) appears only when scrolled past 0. Cleaner at rest, more modern feel, needs a scroll listener. | ✓ |
| 1px border + scroll shadow (layered) | Always-on border PLUS a subtle shadow on scroll. Strongest separation, most "designed", slightly more complexity. | |
| 1px border on header, none on footer | Header gets 1px bottom border; footer sits at page end with no top border. | |

**User's choice:** Scroll-activated shadow
**Notes:** No static border — shadow only appears on scroll. Must be monochrome (no colored accent per UI-01).

### Q2: Same border/shadow color token for both header and footer?

| Option | Description | Selected |
|--------|-------------|----------|
| Add a single new `--color-border` token | Introduce `--color-border` in reset.css. Both header and future separators use this token. Keeps monochrome system consistent. | ✓ |
| Reuse existing `--color-text-muted` | Use existing muted text color at low opacity. Fewer tokens but borders tied to text color could drift. | |
| Inline fixed hex (#e5e5e5) | No token — write color inline in header.css/footer.css. Fastest but breaks tokenized palette pattern. | |

**User's choice:** Add a single new `--color-border` token
**Notes:** Even though the chosen scroll-shadow may not directly use a border color, the token is introduced now for future consistency.

### Q3: Footer separator — the header uses scroll-activated shadow. What about the footer (which always sits at page end)?

| Option | Description | Selected |
|--------|-------------|----------|
| No separator | Footer is white on white with no separator. Readers understand it's the footer by position. Cleanest minimal look. | ✓ |
| 1px top border always | Static 1px top border using the new `--color-border` token. Consistent and visible as a distinct region. | |
| Inverted scroll shadow | Subtle box-shadow above footer appearing at page bottom. Mirrors header mechanically but overkill for footer. | |

**User's choice:** No separator
**Notes:** Footer blends with the body end — no border, no shadow.

---

## Search bar on home (UI-03)

### Q1: On the home page, how should the search bar appear in the header?

| Option | Description | Selected |
|--------|-------------|----------|
| Permanently-visible input | Always-rendered expanded input. Simplest, most discoverable. Takes more header width. | |
| Keep toggle (icon-only at rest) | Existing collapsible pattern — magnifier icon at rest, click reveals input. Header minimal when not searching. | ✓ |
| Full-width input with icon inside | Single centered input spanning header width with magnifier inside. Prominent, search-first design. | |

**User's choice:** Keep toggle (icon-only at rest)
**Notes:** "Only the search bar" in UI-03 is interpreted as "only the search affordance" — the toggle pattern stays.

### Q2: Placeholder / accessory details for the search input

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder "Search articles…" + magnifier icon | English placeholder matching current code. | |
| Placeholder "Rechercher un article…" + magnifier icon | French placeholder, consistent with site metadata language in index.json. | ✓ |
| No placeholder, icon-only hint | Clean empty input, visual affordance only. | |

**User's choice:** Placeholder "Rechercher un article…" + magnifier icon
**Notes:** Placeholder switches to French to match the site metadata language.

---

## Logo on article (UI-04)

### Q1: On article pages, how should the DEVLIOT logo be positioned in the header?

| Option | Description | Selected |
|--------|-------------|----------|
| Left-aligned (same as today) | Logo stays left-aligned; right side is empty. Consistent eye-tracking with home variant. | ✓ |
| Centered horizontally | Logo centered in header width. More "monument-like" but breaks left-anchored convention. | |
| Left + slightly larger | Left-aligned but bumped up one size tier since it's alone. More presence without repositioning. | |

**User's choice:** Left-aligned (same as today)
**Notes:** Same sizing (6/8/10px responsive). Right side of header is empty.

### Q2: Should the ASCII logo on article pages be clickable back to home?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, clickable (links to /) | Logo acts as home link, same as today. Standard pattern, discoverable. | ✓ |
| No, purely decorative | Logo is pure brand presence; users rely on browser back button. Cleaner semantic but adds friction. | |

**User's choice:** Yes, clickable (links to /)
**Notes:** Preserves the existing `<a href="/">` wrapper around the logo.

---

## Page-variant detection

### Q1: How should devliot-header detect which variant (home vs article) to render?

| Option | Description | Selected |
|--------|-------------|----------|
| Read window.location.pathname directly | Header inspects pathname at render; subscribes to popstate/pushstate. Self-contained, no router coupling. | |
| Prop/attribute driven from devliot-app | `<devliot-header variant="home\|article">`. Parent owns routing decision; header renders passively. | ✓ |
| Subscribe to PathRouter ReactiveController | Header registers a host controller listening to PathRouter. Tightest integration, more code. | |

**User's choice:** Prop/attribute driven from devliot-app
**Notes:** devliot-app already subscribes to PathRouter for its page rendering — it's the natural owner of the variant decision. Header stays passive and testable.

---

## Claude's Discretion

- Exact pixel values for the scroll-shadow (offset, blur, alpha)
- Exact pixel value for `--color-border` token
- Scroll threshold / transition timing for the shadow appearance
- Internal implementation of `variant` computation in `devliot-app` (`@state` vs computed getter over PathRouter)
- Re-render mechanism on SPA route changes (Lit's reactive property system covers this)

## Deferred Ideas

- Hamburger menu functionality (removed in this phase; needs its own phase when menu content is designed)
- Dark mode / theme toggle (out of scope — monochrome palette is non-negotiable)
- SPA route transition animations (variant swap is instantaneous in this phase)
- Mobile navigation drawer (no menu content exists)
