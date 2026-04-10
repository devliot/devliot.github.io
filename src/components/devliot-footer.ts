import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import footerStyles from '../styles/footer.css?inline';

@customElement('devliot-footer')
export class DevliotFooter extends LitElement {
  static styles = unsafeCSS(footerStyles);

  render() {
    return html`
      <footer>
        <p>&copy; 2026 DEVLIOT</p>
      </footer>
    `;
  }
}
