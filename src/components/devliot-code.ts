import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import styles from '../styles/devliot-code.css?inline';

@customElement('devliot-code')
export class DevliotCode extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String }) lang = 'text';

  @state() private _highlightedHtml = '';
  @state() private _copied = false;
  @state() private _copyFailed = false;

  private _code = '';

  connectedCallback() {
    super.connectedCallback();
    this._code = this.textContent?.trim() ?? '';
    this.textContent = '';
  }

  firstUpdated() {
    this._highlight();
  }

  private async _highlight() {
    try {
      const { codeToHtml } = await import('shiki');
      const result = await codeToHtml(this._code, {
        lang: this.lang || 'text',
        theme: 'github-light',
      });
      this._highlightedHtml = result;
    } catch {
      // If Shiki fails (unknown lang, etc.), fall back to plain pre/code display
      this._highlightedHtml = '';
    }
  }

  private async _copyCode() {
    try {
      await navigator.clipboard.writeText(this._code);
      this._copied = true;
      this._copyFailed = false;
      setTimeout(() => {
        this._copied = false;
      }, 2000);
    } catch {
      this._copyFailed = true;
      this._copied = false;
      setTimeout(() => {
        this._copyFailed = false;
      }, 2000);
    }
  }

  render() {
    let buttonContent;
    if (this._copied) {
      buttonContent = html`<span class="copy-feedback">Copied!</span>`;
    } else if (this._copyFailed) {
      buttonContent = html`<span class="copy-feedback copy-feedback--error">Copy failed</span>`;
    } else {
      buttonContent = html`
        <svg class="copy-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      `;
    }

    return html`
      <div class="code-block">
        <span class="lang-badge">${this.lang.toUpperCase()}</span>
        <button class="copy-btn" aria-label="Copy code" @click=${this._copyCode}>
          ${buttonContent}
        </button>
        ${this._highlightedHtml
          ? unsafeHTML(this._highlightedHtml)
          : html`<pre><code>${this._code}</code></pre>`
        }
      </div>
    `;
  }
}
