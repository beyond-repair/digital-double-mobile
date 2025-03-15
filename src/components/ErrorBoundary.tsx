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
  private lastErrorTime: number = 0;
  private metrics = {
    totalErrors: 0,
    recoveryAttempts: 0,
    lastRecoveryTime: 0
  };

  public state: State = {
    hasError: false,
    error: undefined
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private logTelemetry(event: TelemetryEvent) {
    const errorFrequency = this.lastErrorTime ? Date.now() - this.lastErrorTime : 0;
    const enhancedEvent = {
      ...event,
      metrics: this.metrics,
      context: {
        timestamp: new Date().toISOString(),
        retryCount: this.retryCount,
        componentStack: this.state.error?.stack,
        errorFrequency,
        memoryUsage: performance?.memory?.usedJSHeapSize,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          language: navigator.language
        },
        recoverySuccess: this.retryCount > 0 && !this.state.hasError,
        timeSinceLastError: this.lastErrorTime ? Date.now() - this.lastErrorTime : null,
        memoryState: {
          usage: performance?.memory?.usedJSHeapSize,
          limit: performance?.memory?.jsHeapSizeLimit,
          utilisationPercent: performance?.memory?.usedJSHeapSize 
            ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100 
            : null
        }
      }
    };
    this.lastErrorTime = Date.now();
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

  private cleanupResources() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
    this.lastErrorTime = 0;
  }

  public componentWillUnmount() {
    this.cleanupResources();
  }

  private handleRetry = async () => {
    if (this.retryCount < this.maxRetries) {
      this.metrics.recoveryAttempts++;
      this.metrics.lastRecoveryTime = Date.now();
      this.cleanupResources(); // Clean up before retry
      // Add exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      this.retryCount++;
      this.setState({ hasError: false, error: undefined });
      
      // Shorter reset timeout with progressive intervals
      const resetDelay = Math.max(15000, 30000 - (this.retryCount * 5000));
      this.resetTimeout = setTimeout(() => {
        this.retryCount = 0;
      }, resetDelay);
      
      // Send recovery attempt telemetry
      this.logTelemetry({
        timestamp: Date.now(),
        type: 'recovery',
        data: { 
          attemptNumber: this.retryCount,
          previousError: this.state.error?.message
        }
      });
    } else {
      this.logTelemetry({
        timestamp: Date.now(),
        type: 'error',
        data: { 
          message: 'Max retries exceeded',
          metrics: this.metrics
        }
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
