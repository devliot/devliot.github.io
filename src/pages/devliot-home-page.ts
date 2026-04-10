import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import homeStyles from '../styles/home.css?inline';

@customElement('devliot-home-page')
export class DevliotHomePage extends LitElement {
  static styles = unsafeCSS(homeStyles);

  render() {
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
    `;
  }
}
