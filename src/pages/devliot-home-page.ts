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
  @state() private _searchMatchSlugs: Set<string> | null = null;

  // FlexSearch state (not reactive)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _searchIndex: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _searchData: any[] | null = null;
  private _searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._fetchArticles();
    window.addEventListener('hashchange', this._onHashChange);
    document.addEventListener('devliot-search', this._onSearch as unknown as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('hashchange', this._onHashChange);
    document.removeEventListener('devliot-search', this._onSearch as unknown as EventListener);
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

    // Read initial tag and query from URL after fetch
    const hash = window.location.hash.slice(1) || '/';
    const qIdx = hash.indexOf('?');
    if (qIdx !== -1) {
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      const tag = params.get('tag');
      if (tag) this._activeTag = tag;

      const q = params.get('q');
      if (q) {
        this._searchQuery = q;
        // Trigger search after a small delay to allow component to render first
        setTimeout(async () => {
          await this._initSearch();
          if (this._searchIndex) {
            const raw = this._searchIndex.search(q, { limit: 50 });
            this._searchMatchSlugs = new Set(raw.flatMap((r: { field: string; result: string[] }) => r.result));
          }
        }, 100);
      }
    }
  }

  private _onHashChange = () => {
    const hash = window.location.hash.slice(1) || '/';
    const qIdx = hash.indexOf('?');
    if (qIdx !== -1) {
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      this._activeTag = params.get('tag');
      // Do not clear search from hashchange — search is managed by header events
    } else {
      this._activeTag = null;
    }
  };

  private async _initSearch(): Promise<void> {
    if (this._searchIndex) return;
    try {
      const { Document } = await import('flexsearch');
      const res = await fetch(`${import.meta.env.BASE_URL}search-data.json`);
      if (!res.ok) return;
      this._searchData = await res.json();
      this._searchIndex = new Document({
        document: {
          id: 'slug',
          index: [
            { field: 'title', tokenize: 'forward' },
            { field: 'body', tokenize: 'strict' },
            { field: 'tags', tokenize: 'strict' },
          ],
        },
      });
      for (const entry of this._searchData!) {
        this._searchIndex.add(entry);
      }
    } catch {
      // Search init failure — search will be non-functional, article list still works
    }
  }

  private _onSearch = async (e: CustomEvent<{ query: string }>) => {
    const query = e.detail.query;

    if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);

    if (!query.trim()) {
      this._searchMatchSlugs = null;
      return;
    }

    this._searchDebounceTimer = setTimeout(async () => {
      await this._initSearch();
      if (!this._searchIndex) return;
      const raw = this._searchIndex.search(query, { limit: 50 });
      const slugs = new Set<string>(raw.flatMap((r: { field: string; result: string[] }) => r.result));
      this._searchMatchSlugs = slugs;
    }, 200);
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
    let result = [...this._articles];
    // Tag filter
    if (this._activeTag) {
      result = result.filter(a => a.tags.includes(this._activeTag!) || a.category === this._activeTag);
    }
    // Search filter (AND logic with tag filter)
    if (this._searchMatchSlugs !== null) {
      result = result.filter(a => this._searchMatchSlugs!.has(a.slug));
    }
    // Sort newest first
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }

  private _setActiveTag(tag: string | null): void {
    // Toggle: clicking the active tag deactivates it
    const next = (tag !== null && this._activeTag === tag) ? null : tag;
    this._activeTag = next;
    const hash = next ? `/?tag=${encodeURIComponent(next)}` : '/';
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
          ${filtered.length === 0 && (this._articles.length > 0 || this._searchMatchSlugs !== null)
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
