import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PropertyValues } from '@lit/reactive-element';
import headerStyles from '../styles/header.css?inline';

@customElement('devliot-header')
export class DevliotHeader extends LitElement {
  static styles = unsafeCSS(headerStyles);

  @property({ type: String, reflect: true }) variant: 'home' | 'article' = 'home';
  @property({ type: Boolean, reflect: true }) scrolled = false;

  @state() private _searchOpen = false;
  @state() private _searchValue = '';

  private _onScroll = () => {
    const scrolled = window.scrollY > 0;
    if (scrolled !== this.scrolled) {
      this.scrolled = scrolled;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this.scrolled = window.scrollY > 0;
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._onScroll);
    super.disconnectedCallback();
  }

  willUpdate(changed: PropertyValues) {
    if (changed.has('variant') && this.variant !== 'home') {
      this._searchOpen = false;
      this._searchValue = '';
    }
  }

  private _toggleSearch(): void {
    this._searchOpen = !this._searchOpen;
    if (this._searchOpen) {
      this.updateComplete.then(() => {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>('.search-input');
        input?.focus();
      });
    } else {
      this._searchValue = '';
      this._dispatchSearch('');
    }
  }

  private _onSearchInput(e: InputEvent): void {
    this._searchValue = (e.target as HTMLInputElement).value;
    this._dispatchSearch(this._searchValue);
  }

  private _onSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this._searchOpen = false;
      this._searchValue = '';
      this._dispatchSearch('');
    }
  }

  private _dispatchSearch(query: string): void {
    this.dispatchEvent(new CustomEvent('devliot-search', {
      detail: { query },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (this.variant === 'home') {
      return html`
        <div class="header-actions">
          <div class="search-container ${this._searchOpen ? 'search-container--open' : ''}">
            ${this._searchOpen ? html`
              <input
                class="search-input"
                type="text"
                placeholder="Rechercher un article\u2026"
                aria-label="Rechercher un article"
                role="search"
                .value=${this._searchValue}
                @input=${this._onSearchInput}
                @keydown=${this._onSearchKeydown}
              />
            ` : ''}
            <button
              class="search-btn"
              aria-label="Rechercher des articles"
              aria-expanded="${this._searchOpen}"
              @click=${this._toggleSearch}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    return html`
      <a href="/" aria-label="DEVLIOT \u2014 retour \u00e0 l'accueil">
        <pre aria-label="DEVLIOT" class="logo logo--small">
██████╗ ███████╗██╗   ██╗██╗     ██╗ ██████╗ ████████╗
██╔══██╗██╔════╝██║   ██║██║     ██║██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ██║   ██║██║     ██║██║   ██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║     ██║██║   ██║   ██║
██████╔╝███████╗ ╚████╔╝ ███████╗██║╚██████╔╝   ██║
╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝ ╚═════╝    ╚═╝</pre>
      </a>
    `;
  }
}
