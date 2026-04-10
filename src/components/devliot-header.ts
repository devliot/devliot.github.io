import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import headerStyles from '../styles/header.css?inline';

@customElement('devliot-header')
export class DevliotHeader extends LitElement {
  static styles = unsafeCSS(headerStyles);

  render() {
    return html`
      <header>
        <a href="/#/">DEVLIOT</a>
      </header>
    `;
  }
}
