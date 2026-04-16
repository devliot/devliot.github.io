import { LitElement, html, unsafeCSS } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import articleStyles from '../styles/article.css?inline';
import codeStyles from '../styles/code.css?inline';
import diagramStyles from '../styles/devliot-diagram.css?inline';
import type { ArticleRegistry, Author } from '../types/article.js';

/** Allowlist: only alphanumeric characters, hyphens, and underscores (T-03-02: path traversal prevention). */
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

@customElement('devliot-article-page')
export class DevliotArticlePage extends LitElement {
  static styles = [unsafeCSS(articleStyles), unsafeCSS(codeStyles), unsafeCSS(diagramStyles)];

  @property({ type: String }) slug = '';

  @state() private _html = '';
  @state() private _error = '';
  @state() private _tags: string[] = [];
  @state() private _category = '';
  @state() private _date = '';
  @state() private _readingTime = 0;
  @state() private _authors: Author[] = [];

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this._onPopState);
    // After content loads, scroll to ?section= anchor if present in URL
    this._scrollToSectionFromUrl();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._onPopState);
  }

  willUpdate(changed: PropertyValues) {
    if (changed.has('slug') && this.slug) {
      this._loadArticle();
    }
  }

  updated(changed: PropertyValues) {
    if (changed.has('_html') && this._html) {
      // Use microtask to ensure the DOM has been updated before processing headings
      this.updateComplete.then(() => {
        this._injectHeadingAnchors();
        this._scrollToSectionFromUrl();
      });
    }
  }

  private async _loadArticle(): Promise<void> {
    const currentSlug = this.slug;

    // T-03-02: Validate slug before constructing URL — reject path traversal attempts
    if (!SLUG_PATTERN.test(currentSlug)) {
      this._error = 'Article not found.';
      this._html = '';
      return;
    }

    this._error = '';
    this._html = '';
    this._tags = [];
    this._category = '';
    this._date = '';
    this._readingTime = 0;
    this._authors = [];

    try {
      const url = `${import.meta.env.BASE_URL}articles/${currentSlug}/index.html`;
      const res = await fetch(url);
      if (this.slug !== currentSlug) return; // slug changed during fetch

      if (res.ok) {
        const text = await res.text();
        if (this.slug !== currentSlug) return;
        // Guard against Vite SPA fallback: if the response is the app shell
        // (contains <!DOCTYPE or <devliot-app>), treat as 404 to prevent
        // recursive rendering.
        if (text.trimStart().startsWith('<!DOCTYPE') || text.includes('<devliot-app')) {
          this._error = 'Article not found.';
          return;
        }
        this._html = text;
      } else if (res.status === 404) {
        this._error = 'Article not found.';
      } else {
        this._error = 'Could not load article. Check your connection and try again.';
      }
    } catch {
      if (this.slug !== currentSlug) return;
      this._error = 'Could not load article. Check your connection and try again.';
    }

    // Fetch article metadata for tags (non-critical — failure is silent)
    try {
      const regRes = await fetch(`${import.meta.env.BASE_URL}articles/index.json`);
      if (this.slug !== currentSlug) return; // slug changed during metadata fetch
      if (regRes.ok) {
        const registry: ArticleRegistry = await regRes.json();
        if (this.slug !== currentSlug) return;
        const meta = registry.articles.find(a => a.slug === currentSlug);
        if (meta) {
          this._tags = meta.tags || [];
          this._category = meta.category || '';
          this._date = meta.date || '';
          this._readingTime = meta.readingTime || 0;
          this._authors = meta.authors || [];
        }
      }
    } catch {
      // Metadata fetch failure is non-critical — tags just won't show
    }
  }

  private _navigateToTag(tag: string): void {
    window.location.href = `/?tag=${encodeURIComponent(tag)}`;
  }

  private _injectHeadingAnchors(): void {
    const article = this.shadowRoot?.querySelector('article');
    if (!article) return;

    const headings = article.querySelectorAll<HTMLHeadingElement>('h2, h3');

    headings.forEach((heading) => {
      // Avoid double-injecting if updated is called multiple times
      if (heading.querySelector('.heading-anchor')) return;

      const id = (heading.textContent ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

      heading.id = id;

      const anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = '#';
      anchor.textContent = '#';
      anchor.setAttribute('aria-hidden', 'true');

      anchor.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('section', id);
        history.pushState({ section: id }, '', url.toString());
        heading.scrollIntoView({ behavior: 'smooth' });
      });

      heading.prepend(anchor);
    });
  }

  private _formatDate(iso: string): string {
    // Append T12:00:00 to avoid UTC midnight timezone shift (RESEARCH.md Pitfall 2)
    const d = new Date(`${iso}T12:00:00`);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  private _renderByline() {
    const DEFAULT_AUTHOR: Author = { name: 'Devliot', url: 'https://github.com/devliot' };
    const authors = this._authors.length > 0 ? this._authors : [DEFAULT_AUTHOR];

    const renderAuthor = (a: Author) =>
      a.url
        ? html`<a href="${a.url}" target="_blank" rel="noopener">${a.name}</a>`
        : html`${a.name}`;

    let formatted: unknown;
    if (authors.length === 1) {
      formatted = renderAuthor(authors[0]);
    } else if (authors.length === 2) {
      formatted = html`${renderAuthor(authors[0])} et ${renderAuthor(authors[1])}`;
    } else {
      const parts = authors.slice(0, -1).map((a, i) =>
        i === 0 ? renderAuthor(a) : html`, ${renderAuthor(a)}`
      );
      formatted = html`${parts} et ${renderAuthor(authors[authors.length - 1])}`;
    }

    return html`<p class="article-byline">par ${formatted}</p>`;
  }

  // D-04: popstate handler re-scrolls to ?section= heading on back/forward navigation
  private _onPopState = (): void => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) {
      const article = this.shadowRoot?.querySelector('article');
      const target = article?.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // If no ?section= present, do nothing -- user backed to initial article state or left article
  };

  private _scrollToSectionFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (!section) return;

    const article = this.shadowRoot?.querySelector('article');
    if (!article) return;

    const target = article.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
    if (target) {
      // D-03: replaceState on initial load so back button leaves cleanly
      history.replaceState({ section }, '', window.location.href);
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      // D-08: silent miss -- strip invalid ?section= from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('section');
      history.replaceState(null, '', url.toString());
    }
  }

  render() {
    if (this._error) {
      return html`<article class="error-state"><p>${this._error}</p></article>`;
    }
    return html`
      ${this._date || this._readingTime > 0 ? html`
        <p class="article-meta">
          ${this._date ? html`<time datetime="${this._date}">${this._formatDate(this._date)}</time>` : ''}${this._date && this._readingTime > 0 ? html`\u00a0\u00b7\u00a0` : ''}${this._readingTime > 0 ? html`${this._readingTime} min read` : ''}
        </p>
      ` : ''}
      ${this._renderByline()}
      <article>${unsafeHTML(this._html)}</article>
      ${this._tags.length > 0 || this._category ? html`
        <nav class="article-tags" aria-label="Article tags">
          ${this._category ? html`<button class="tag-link" @click=${() => this._navigateToTag(this._category)}>${this._category}</button>` : ''}
          ${this._tags.map(tag => html`<button class="tag-link" @click=${() => this._navigateToTag(tag)}>${tag}</button>`)}
        </nav>
      ` : ''}
    `;
  }
}
