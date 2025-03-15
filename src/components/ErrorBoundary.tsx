import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { TelemetryEvent } from '../types/ModelConfig';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private resetTimeout: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: undefined
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private logTelemetry(event: TelemetryEvent) {
    // Enhanced telemetry with more context
    const enhancedEvent = {
      ...event,
      context: {
        timestamp: new Date().toISOString(),
        retryCount: this.retryCount,
        componentStack: this.state.error?.stack
      }
    };
    console.info('Telemetry:', enhancedEvent);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.logTelemetry({
      timestamp: Date.now(),
      type: 'error',
      data: { 
        error: error.message,
        componentStack: errorInfo.componentStack,
        stack: error.stack
      }
    });
  }

  public componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  private handleRetry = async () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined });
      
      // Auto-reset retry count after 1 minute of successful operation
      this.resetTimeout = setTimeout(() => {
        this.retryCount = 0;
      }, 60000);
    } else {
      this.logTelemetry({
        timestamp: Date.now(),
        type: 'error',
        data: { message: 'Max retries reached', error: this.state.error }
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container pixel-text" role="alert">
          <h2>Something went wrong</h2>
          <p className="error-message">{this.state.error?.message}</p>
          {this.retryCount < this.maxRetries && (
            <button onClick={this.handleRetry} className="pixel-button">
              Try again ({this.maxRetries - this.retryCount} attempts left)
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
