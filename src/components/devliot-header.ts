import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import headerStyles from '../styles/header.css?inline';

@customElement('devliot-header')
export class DevliotHeader extends LitElement {
  static styles = unsafeCSS(headerStyles);

  @state() private _searchOpen = false;
  @state() private _searchValue = '';

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
    return html`
      <a href="/" aria-label="DEVLIOT — accueil">
        <pre aria-label="DEVLIOT" class="logo logo--small">
██████╗ ███████╗██╗   ██╗██╗     ██╗ ██████╗ ████████╗
██╔══██╗██╔════╝██║   ██║██║     ██║██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ██║   ██║██║     ██║██║   ██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║     ██║██║   ██║   ██║
██████╔╝███████╗ ╚████╔╝ ███████╗██║╚██████╔╝   ██║
╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝ ╚═════╝    ╚═╝</pre>
      </a>
      <div class="header-actions">
        <div class="search-container ${this._searchOpen ? 'search-container--open' : ''}">
          ${this._searchOpen ? html`
            <input
              class="search-input"
              type="text"
              placeholder="Search articles…"
              aria-label="Search articles"
              role="search"
              .value=${this._searchValue}
              @input=${this._onSearchInput}
              @keydown=${this._onSearchKeydown}
            />
          ` : ''}
          <button
            class="search-btn"
            aria-label="Search articles"
            aria-expanded="${this._searchOpen}"
            @click=${this._toggleSearch}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        <button class="menu-toggle" aria-label="Ouvrir le menu">
          <span class="hamburger-icon">&#9776;</span>
        </button>
      </div>
    `;
  }
}
