'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from './icons';

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="academic-card"
      style={{
        padding: '2.5rem 2rem',
        display: 'grid',
        justifyItems: 'center',
        textAlign: 'center',
        gap: '1rem',
        maxWidth: 540,
        margin: '2rem auto',
        borderColor: 'rgba(225, 29, 72, 0.3)',
        backgroundColor: 'rgba(225, 29, 72, 0.01)',
      }}
    >
      <div style={{ color: 'var(--red-accent)' }}>
        <AlertTriangle size={32} />
      </div>
      <h3 className="serif-header" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Connection Error</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: 360 }}>
        {message}
      </p>
      <button className="btn btn-primary" onClick={onRetry} style={{ marginTop: '0.5rem' }}>
        <RefreshCw size={14} /> Retry Connection
      </button>
    </div>
  );
}

interface BoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface BoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class DataErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  public override state: BoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={this.state.error?.message ?? 'An unexpected rendering error occurred.'}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
