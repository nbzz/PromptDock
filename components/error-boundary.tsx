'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-700 dark:bg-rose-900/30">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-200">页面出错</h2>
          <p className="text-sm text-rose-600 dark:text-rose-400">
            遇到了一些问题，请刷新页面重试
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-600 dark:bg-rose-800 dark:text-rose-200 dark:hover:bg-rose-900"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
