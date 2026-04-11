import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from '../styles/devliot-chart.css?inline';

/**
 * devliot-chart
 *
 * Lazy-loaded Chart.js chart component.
 *
 * Chart.js works correctly in Shadow DOM — no createRenderRoot override needed.
 *
 * Usage:
 *   <devliot-chart type="bar" config='{"data":{"labels":["A","B","C"],"datasets":[{"data":[1,2,3],"backgroundColor":"#333333"}]}}'></devliot-chart>
 *
 * The `config` attribute accepts a full Chart.js config object as JSON.
 * If `config` does not include a `type` field, the `type` attribute is used as fallback.
 *
 * Mermaid renders on viewport entry via IntersectionObserver (rootMargin 200px lookahead).
 * The Chart.js instance is destroyed in disconnectedCallback to prevent canvas reuse errors.
 */
@customElement('devliot-chart')
export class DevliotChart extends LitElement {
  static styles = unsafeCSS(styles);

  /** Chart type (bar, line, scatter, pie, etc.) — fallback if not in config JSON */
  @property({ type: String }) type = 'bar';

  /** Full Chart.js config object as JSON string (per D-11) */
  @property({ type: String }) config = '';

  private _observer?: IntersectionObserver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _chart?: any;
  private _rendered = false;

  override connectedCallback() {
    super.connectedCallback();

    this._observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !this._rendered) {
          this._observer!.disconnect();
          await this._renderChart();
        }
      },
      { rootMargin: '200px' }
    );
  }

  override firstUpdated() {
    this._observer!.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._chart?.destroy();
  }

  private async _renderChart(): Promise<void> {
    try {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const canvas = this.shadowRoot!.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const chartConfig = JSON.parse(this.config);
      // Ensure type is set — fallback to `type` attribute if config lacks it
      if (!chartConfig.type) {
        chartConfig.type = this.type;
      }

      this._chart = new Chart(canvas.getContext('2d')!, chartConfig);
      this._rendered = true;
    } catch (e) {
      // Per UI-SPEC: console.error only, no visible error UI for chart failures
      console.error('Chart.js render error:', e);
    }
  }

  override render() {
    return html`
      <div class="chart-container">
        <canvas></canvas>
      </div>
    `;
  }
}
