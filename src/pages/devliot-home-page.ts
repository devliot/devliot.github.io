import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import homeStyles from '../styles/home.css?inline';

interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
}

@customElement('devliot-home-page')
export class DevliotHomePage extends LitElement {
  static styles = unsafeCSS(homeStyles);

  @state() private _articles: Article[] = [];
  @state() private _activeTag: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._fetchArticles();
    window.addEventListener('hashchange', this._onHashChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._onHashChange);
  }

  private async _fetchArticles(): Promise<void> {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}articles/index.json`);
      if (res.ok) {
        const data = await res.json();
        this._articles = data.articles || [];
      }
    } catch {
      // Fetch failure — articles remain empty
    }

    // Read initial tag from URL after fetch
    const hash = window.location.hash.slice(1) || '/';
    const qIdx = hash.indexOf('?');
    if (qIdx !== -1) {
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      const tag = params.get('tag');
      if (tag) this._activeTag = tag;
    }
  }

  private _onHashChange = () => {
    const hash = window.location.hash.slice(1) || '/';
    const qIdx = hash.indexOf('?');
    if (qIdx !== -1) {
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      this._activeTag = params.get('tag');
    } else {
      this._activeTag = null;
    }
  };

  private get _allTags(): string[] {
    const tagSet = new Set<string>();
    for (const a of this._articles) {
      if (a.category) tagSet.add(a.category);
      for (const t of a.tags) tagSet.add(t);
    }
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }

  private get _filteredArticles(): Article[] {
    const active = this._activeTag;
    const articles = active
      ? this._articles.filter(
          (a) => a.tags.includes(active) || a.category === active
        )
      : [...this._articles];
    return articles.sort((a, b) => b.date.localeCompare(a.date));
  }

  private _setActiveTag(tag: string | null): void {
    this._activeTag = tag;
    const hash = tag ? `/?tag=${encodeURIComponent(tag)}` : '/';
    window.location.hash = hash;
  }

  render() {
    const filtered = this._filteredArticles;
    const tags = this._allTags;

    return html`
      <section class="hero">
        <div class="hero__logo-wrapper">
          <pre aria-label="DEVLIOT" class="logo logo--hero">
██████╗ ███████╗██╗   ██╗██╗     ██╗ ██████╗ ████████╗
██╔══██╗██╔════╝██║   ██║██║     ██║██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ██║   ██║██║     ██║██║   ██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║     ██║██║   ██║   ██║
██████╔╝███████╗ ╚████╔╝ ███████╗██║╚██████╔╝   ██║
╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝ ╚═════╝    ╚═╝</pre>
        </div>
        <p class="hero__tagline">Articles on AI, Java, and mathematics. Well-formatted code, math, and diagrams.</p>
      </section>

      <section class="filter-strip">
        <div class="filter-chips" role="group" aria-label="Filter by tag">
          <button
            class="chip ${!this._activeTag ? 'chip--active' : ''}"
            aria-pressed="${!this._activeTag}"
            @click=${() => this._setActiveTag(null)}
          >All</button>
          ${map(tags, (tag) => html`
            <button
              class="chip ${this._activeTag === tag ? 'chip--active' : ''}"
              aria-pressed="${this._activeTag === tag}"
              @click=${() => this._setActiveTag(tag)}
            >${tag}</button>
          `)}
        </div>
      </section>

      <section class="article-list">
        <ul class="article-rows" aria-live="polite">
          ${filtered.length === 0 && this._articles.length > 0
            ? html`<p class="empty-state">No articles found.</p>`
            : map(filtered, (article) => html`
              <li class="article-row">
                <span class="article-row__date">${article.date}</span>
                <span class="article-row__category">${article.category}</span>
                <a class="article-row__title" href="/#/article/${article.slug}">${article.title}</a>
                <span class="article-row__tags">
                  ${map(article.tags, (t) => html`
                    <button
                      class="tag-link"
                      @click=${(e: Event) => { e.preventDefault(); this._setActiveTag(t); }}
                    >${t}</button>
                  `)}
                </span>
              </li>
            `)
          }
        </ul>
      </section>
    `;
  }
}
