import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import headerStyles from '../styles/header.css?inline';

@customElement('devliot-header')
export class DevliotHeader extends LitElement {
  static styles = unsafeCSS(headerStyles);

  render() {
    return html`
      <a href="/#/" aria-label="DEVLIOT — accueil">
        <pre aria-label="DEVLIOT" class="logo logo--small">
██████╗ ███████╗██╗   ██╗██╗     ██╗ ██████╗ ████████╗
██╔══██╗██╔════╝██║   ██║██║     ██║██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ██║   ██║██║     ██║██║   ██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║     ██║██║   ██║   ██║
██████╔╝███████╗ ╚████╔╝ ███████╗██║╚██████╔╝   ██║
╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝ ╚═════╝    ╚═╝</pre>
      </a>
      <button class="menu-toggle" aria-label="Ouvrir le menu">
        <span class="hamburger-icon">&#9776;</span>
      </button>
    `;
  }
}
