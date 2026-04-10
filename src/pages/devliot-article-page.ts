import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import articleStyles from '../styles/article.css?inline';

@customElement('devliot-article-page')
export class DevliotArticlePage extends LitElement {
  static styles = unsafeCSS(articleStyles);

  @property({ type: String }) slug = '';

  render() {
    return html`
      <article>
        <h1>Article: ${this.slug}</h1>
        <p>Article content coming in Phase 3.</p>
      </article>
    `;
  }
}
