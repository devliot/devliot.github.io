import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import homeStyles from '../styles/home.css?inline';

@customElement('devliot-home-page')
export class DevliotHomePage extends LitElement {
  static styles = unsafeCSS(homeStyles);

  render() {
    return html`
      <section class="hero">
        <h1>DEVLIOT — Technical blog</h1>
        <p>Articles on AI, Java, and mathematics. Well-formatted code, math, and diagrams.</p>
      </section>
    `;
  }
}
