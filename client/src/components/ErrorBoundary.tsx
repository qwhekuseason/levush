import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Last-resort screen so an unexpected error never leaves shoppers on a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[levush] page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink p-8 text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="heading-serif text-3xl text-bone">Sorry — this page hit a snag.</h1>
        <p className="max-w-sm text-bone/60">Your bag is safe. Reloading usually fixes it.</p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
          <a href="/" className="btn-outline">Go home</a>
        </div>
      </div>
    );
  }
}
