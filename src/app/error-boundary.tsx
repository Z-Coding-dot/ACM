import { Component, type ReactNode } from 'react';
import i18n from '../i18n';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="system-page"><h1>{i18n.t('error.generic')}</h1><button className="button button-primary" onClick={() => window.location.reload()}>{i18n.t('common.retry')}</button></main> : this.props.children; }
}
