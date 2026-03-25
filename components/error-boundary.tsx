'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
          <p className="mb-2 text-sm font-medium text-rose-700">组件加载失败</p>
          <p className="mb-3 text-xs text-rose-600">
            {this.state.error?.message ?? '未知错误'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs text-rose-700 transition hover:bg-rose-100"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
