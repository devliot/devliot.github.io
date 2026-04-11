import { LitElement, html, unsafeCSS } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import articleStyles from '../styles/article.css?inline';
import codeStyles from '../styles/code.css?inline';
import diagramStyles from '../styles/devliot-diagram.css?inline';

/** Allowlist: only alphanumeric characters, hyphens, and underscores (T-03-02: path traversal prevention). */
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

@customElement('devliot-article-page')
export class DevliotArticlePage extends LitElement {
  static styles = [unsafeCSS(articleStyles), unsafeCSS(codeStyles), unsafeCSS(diagramStyles)];

  @property({ type: String }) slug = '';

  @state() private _html = '';
  @state() private _error = '';

  connectedCallback() {
    super.connectedCallback();
    // After content loads, scroll to ?section= anchor if present in URL
    this._scrollToSectionFromUrl();
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
    // T-03-02: Validate slug before constructing URL — reject path traversal attempts
    if (!SLUG_PATTERN.test(this.slug)) {
      this._error = 'Article not found.';
      this._html = '';
      return;
    }

    this._error = '';
    this._html = '';

    try {
      const url = `${import.meta.env.BASE_URL}articles/${this.slug}.html`;
      const res = await fetch(url);

      if (res.ok) {
        this._html = await res.text();
      } else if (res.status === 404) {
        this._error = 'Article not found.';
      } else {
        this._error = 'Could not load article. Check your connection and try again.';
      }
    } catch {
      this._error = 'Could not load article. Check your connection and try again.';
    }
  }

  private _injectHeadingAnchors(): void {
    const article = this.shadowRoot?.querySelector('article');
    if (!article) return;

    const headings = article.querySelectorAll<HTMLHeadingElement>('h2, h3, h4, h5, h6');

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
        const baseUrl = `${window.location.origin}${window.location.pathname}${window.location.hash.split('?')[0]}`;
        navigator.clipboard.writeText(`${baseUrl}?section=${id}`).catch(() => {
          // Clipboard write failed — silent fail (T-03-03: no sensitive data involved)
        });
        heading.scrollIntoView({ behavior: 'smooth' });
      });

      heading.prepend(anchor);
    });
  }

  private _scrollToSectionFromUrl(): void {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const section = params.get('section');
    if (!section) return;

    const article = this.shadowRoot?.querySelector('article');
    if (!article) return;

    const target = article.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  render() {
    if (this._error) {
      return html`<article class="error-state"><p>${this._error}</p></article>`;
    }
    return html`<article>${unsafeHTML(this._html)}</article>`;
  }
}
