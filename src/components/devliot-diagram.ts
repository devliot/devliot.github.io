import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * devliot-diagram
 *
 * Lazy-loaded Mermaid diagram component.
 *
 * CRITICAL: Uses light DOM (createRenderRoot returns this) to avoid Mermaid's
 * Shadow DOM incompatibility (github.com/mermaid-js/mermaid/issues/6306).
 *
 * Usage:
 *   <devliot-diagram>graph TD; A-->B;</devliot-diagram>
 *
 * The diagram definition is captured from textContent in connectedCallback,
 * then the element content is cleared. Mermaid renders on viewport entry
 * via IntersectionObserver (rootMargin 200px lookahead).
 */
@customElement('devliot-diagram')
export class DevliotDiagram extends LitElement {
  private static _counter = 0;

  private _definition = '';
  private _observer?: IntersectionObserver;
  private _rendered = false;

  @state() private _error = '';

  /**
   * CRITICAL: Return this (light DOM) instead of shadow root.
   * Mermaid cannot render inside Shadow DOM due to CSS scoping issues.
   */
  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    // Capture diagram definition from text content before clearing
    this._definition = this.textContent?.trim() ?? '';
    this.textContent = '';

    this._observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !this._rendered) {
          this._observer!.disconnect();
          await this._renderDiagram();
        }
      },
      { rootMargin: '200px' }
    );

    // Use queueMicrotask to ensure the element is in the DOM before observing
    queueMicrotask(() => this._observer?.observe(this));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  private async _renderDiagram(): Promise<void> {
    try {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' });

      const id = `mermaid-${DevliotDiagram._counter++}`;
      const { svg, bindFunctions } = await mermaid.render(id, this._definition);

      const container = document.createElement('div');
      container.className = 'diagram-svg-container';
      container.innerHTML = svg;

      this.innerHTML = '';
      this.appendChild(container);

      if (bindFunctions) bindFunctions(container);

      this._rendered = true;
    } catch (e) {
      console.error('Mermaid render error:', e);
      this._error = (e as Error).message;
      this.innerHTML = `<div class="diagram-error">${this._error}</div>`;
    }
  }

  override render() {
    // Light DOM: render returns empty — content is managed directly via innerHTML in _renderDiagram
    return html``;
  }
}
