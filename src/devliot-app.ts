import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('devliot-app')
export class DevliotApp extends LitElement {
  render() {
    return html`<main><p>DEVLIOT loading...</p></main>`;
  }
}
