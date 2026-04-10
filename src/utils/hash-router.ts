import type { ReactiveController, ReactiveControllerHost, TemplateResult } from 'lit';
import { html } from 'lit';

interface Route {
  pattern: string;
  render: (params: Record<string, string>) => TemplateResult;
}

export class HashRouter implements ReactiveController {
  private host: ReactiveControllerHost;
  private routes: Route[];
  private currentPath = '/';

  constructor(host: ReactiveControllerHost, routes: Route[]) {
    this.host = host;
    this.routes = routes;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('hashchange', this._onHashChange);
    this._onHashChange();
  }

  hostDisconnected() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  private _onHashChange = () => {
    const hash = window.location.hash;
    this.currentPath = hash ? hash.slice(1) || '/' : '/';
    this.host.requestUpdate();
  };

  outlet(): TemplateResult {
    for (const route of this.routes) {
      const params = this._match(route.pattern, this.currentPath);
      if (params !== null) return route.render(params);
    }
    return html`<p>404 — Page not found</p>`;
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  private _match(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}
