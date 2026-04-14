import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import katex from 'katex';
import katexStyles from 'katex/dist/katex.min.css?inline';
import styles from '../styles/devliot-math.css?inline';

@customElement('devliot-math')
export class DevliotMath extends LitElement {
  static styles = [unsafeCSS(katexStyles), unsafeCSS(styles)];

  @state() private _rendered = '';

  private _latex = '';

  connectedCallback() {
    super.connectedCallback();
    this._latex = this.textContent?.trim() ?? '';
    this.textContent = '';
  }

  firstUpdated() {
    this._renderMath();
  }

  private _renderMath() {
    try {
      this._rendered = katex.renderToString(this._latex, {
        throwOnError: false,
        displayMode: this.hasAttribute('display'),
      });
    } catch (e) {
      this._rendered = `<span class="math-error">${(e as Error).message}</span>`;
    }
  }

  render() {
    return html`${unsafeHTML(this._rendered)}`;
  }
}
