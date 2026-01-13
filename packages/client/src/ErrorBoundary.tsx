import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorIngestor } from "./ErrorIngestor";

export interface ErrorBoundaryProps {
  /** Content to render when no error */
  children: ReactNode;
  /** Fallback UI or render function when error occurs */
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional callback when boundary resets */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary that automatically reports errors to ErrorIngestor.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<ErrorScreen />}
 *   onError={(error) => console.log('Error:', error)}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example With reset function
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <View>
 *       <Text>Something went wrong: {error.message}</Text>
 *       <Button title="Try Again" onPress={reset} />
 *     </View>
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report to error ingestion service
    ErrorIngestor.capture(error, {
      metadata: {
        componentStack: errorInfo.componentStack ?? undefined,
      },
      tags: {
        source: "error-boundary",
      },
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === "function") {
        return fallback(error, this.resetError);
      }
      return fallback;
    }

    return children;
  }
}
