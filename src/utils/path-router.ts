import type { ReactiveController, ReactiveControllerHost, TemplateResult } from 'lit';
import { html } from 'lit';

interface Route {
  pattern: string;
  render: (params: Record<string, string>) => TemplateResult;
}

export class PathRouter implements ReactiveController {
  private host: ReactiveControllerHost;
  private routes: Route[];
  private currentPath = '/';

  constructor(host: ReactiveControllerHost, routes: Route[]) {
    this.host = host;
    this.routes = routes;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('popstate', this._onPopState);
    this._resolve();
  }

  hostDisconnected() {
    window.removeEventListener('popstate', this._onPopState);
  }

  private _onPopState = () => {
    const newPath = window.location.pathname;
    // Only trigger re-render if the pathname actually changed.
    // Query-only changes (?section=) must NOT cause a route re-evaluation --
    // that would remount the article page and break ANCH-04.
    if (newPath !== this.currentPath) {
      this._resolve();
    }
  };

  private _resolve() {
    this.currentPath = window.location.pathname;
    this.host.requestUpdate();
  }

  outlet(): TemplateResult {
    for (const route of this.routes) {
      const params = this._match(route.pattern, this.currentPath);
      if (params !== null) return route.render(params);
    }
    return html`<p>404 — Page not found</p>`;
  }

  navigate(path: string) {
    window.history.pushState({}, '', path);
    this._resolve();
  }

  private _match(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const value = pathParts[i];
        if (!value) return null;
        params[patternParts[i].slice(1)] = decodeURIComponent(value);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}
