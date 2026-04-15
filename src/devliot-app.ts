import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { HashRouter } from './utils/hash-router.js';
import './components/devliot-header.js';
import './components/devliot-footer.js';
import './pages/devliot-home-page.js';
import './pages/devliot-article-page.js';
import appStyles from './styles/app.css?inline';

@customElement('devliot-app')
export class DevliotApp extends LitElement {
  static styles = unsafeCSS(appStyles);

  private router = new HashRouter(this, [
    { pattern: '/', render: () => html`<devliot-home-page></devliot-home-page>` },
    { pattern: '/article/:slug', render: (params) => html`<devliot-article-page .slug=${params['slug']}></devliot-article-page>` },
  ]);

  private _headerObserver?: ResizeObserver;

  firstUpdated() {
    const header = this.renderRoot.querySelector('devliot-header');
    if (header) {
      this._headerObserver = new ResizeObserver(([entry]) => {
        const height = entry.borderBoxSize?.[0]?.blockSize
          ?? (entry.target as HTMLElement).offsetHeight;
        document.documentElement.style.setProperty(
          '--header-height', `${height}px`
        );
      });
      this._headerObserver.observe(header);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._headerObserver?.disconnect();
  }

  render() {
    return html`
      <devliot-header></devliot-header>
      <main>${this.router.outlet()}</main>
      <devliot-footer></devliot-footer>
    `;
  }
}
