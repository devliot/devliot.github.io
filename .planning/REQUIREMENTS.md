# Requirements: devliot v2.0

**Defined:** 2026-04-15
**Milestone:** v2.0 Deep links, épuration UI, attribution & discovery
**Core Value:** Readers can consume well-formatted technical articles where code, math, diagrams, and charts render beautifully and are easy to follow.

## v2.0 Requirements

Requirements for milestone v2.0. Each will map to a roadmap phase.

### Deep-linkable anchors

- [ ] **ANCH-01**: Cliquer sur l'ancre d'un titre h2/h3 met à jour l'URL avec `?section={id}` via `history.replaceState` (sans recharger l'article ni modifier le hash route)
- [ ] **ANCH-02**: Ouvrir une URL d'article avec `?section={id}` navigue vers l'article et scrolle automatiquement jusqu'au titre correspondant
- [ ] **ANCH-03**: Le scroll automatique (clic ou URL) dépose le titre visible sous le header sticky (non masqué), offset basé sur la hauteur réelle du header
- [ ] **ANCH-04**: Les boutons back/forward du navigateur naviguent entre les états `?section=` successifs sans remonter l'article
- [ ] **ANCH-05**: Les ancres deep-link fonctionnent pour les h2 ET les h3 (pas les h4+)

### UI refresh

- [ ] **UI-01**: Fond du header en blanc (plus de gris), avec une séparation minimale du corps (border 1px ou ombre au scroll, pas d'accent coloré)
- [ ] **UI-02**: Fond du footer en blanc (plus de gris), typographie contrastée mais monochrome
- [ ] **UI-03**: Sur la page d'accueil, le header contient uniquement la barre de recherche (pas de logo, pas d'icône menu)
- [ ] **UI-04**: Sur les pages article, le header contient uniquement le logo DEVLIOT (pas de recherche, pas d'icône menu)

### Bibliography (per-article references)

- [ ] **REF-01**: Un article peut déclarer une bibliographie dans `index.json` (tableau `bibliography[]` avec id, type, title, authors, url, year, etc.)
- [ ] **REF-02**: La section "References" s'affiche en bas de l'article sous forme de liste numérotée `[1]`, `[2]`, ... avec un rendu adapté au type (article / book / web)
- [ ] **REF-03**: Les citations inline `[N]` dans le corps d'article linkent vers leur référence correspondante ; chaque référence a un lien retour vers la citation

### Per-article author(s)

- [ ] **AUTHOR-01**: Un article peut déclarer un ou plusieurs auteurs dans `index.json` (champ `authors[]` avec `name` + `url` optionnel)
- [ ] **AUTHOR-02**: La byline auteur(s) s'affiche dans l'en-tête d'article à côté de la date de publication et du reading time
- [ ] **AUTHOR-03**: Chaque article émet un JSON-LD `schema.org/BlogPosting` avec `author: Person[]` dans sa page OG pour le SEO

### Sitemap XML

- [ ] **SITE-01**: Un fichier `/sitemap.xml` est généré au build listant la racine du site et une entrée par article (URL = page OG `/articles/{slug}/og.html`), avec `<loc>` + `<lastmod>`
- [ ] **SITE-02**: `robots.txt` déclare le sitemap via une directive `Sitemap: https://devliot.github.io/sitemap.xml`

## Future Requirements

Déférés à un milestone ultérieur (raison entre parenthèses) :

- RSS feed (`/rss.xml` ou `/atom.xml`) — mentionné dans l'Out of Scope v1.0 "planned for v2", reporté ici pour garder v2 focalisé sur deep-links + attribution + UI
- Dark mode / theming — utile mais hors scope v2
- Table of contents (TOC) auto-générée par article — complémentaire aux deep-links, à évaluer en v2.1

## Out of Scope

Exclus explicitement pour v2.0 (conservent les exclusions v1.0 sauf mention) :

- Deep links sur h4/h5/h6 — complexité d'URL et pertinence douteuse pour des sous-sous-titres
- Hamburger menu / navigation multi-pages — le site reste mono-vue (accueil + articles)
- Dynamic OG image generation — statiques par article comme en v1.0
- Schema.org JSON-LD autre que `BlogPosting` — Breadcrumbs, ItemList, Organization reportés
- `changefreq` / `priority` dans le sitemap — Google et Bing les ignorent (2025)
- Citations inline avec format autre que `[N]` — pas d'APA/MLA/Chicago en v2

## Traceability

Filled after roadmap creation.

| REQ-ID | Phase | Plan |
|--------|-------|------|
| (pending roadmap) | | |

---

**Total requirements:** 17
**Categories:** 5 (ANCH, UI, REF, AUTHOR, SITE)
