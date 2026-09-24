import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary.tsx
 * Enterprise-grade fault-isolation barrier.
 * Ensures that if an unhandled runtime error happens in any section (e.g. SignUp),
 * the blast radius is contained locally. The rest of the page, SignIn tab,
 * and global navigation remain 100% operational.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Fault-Isolation Boundary Caught Error]:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-2 rounded-lg border border-gray-200 border-gray-200 border-danger-subtle bg-danger-subtle text-red-600 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <i className="bi bi-exclamation-triangle-fill text-lg"></i>
            <strong className="text-base">{this.props.fallbackTitle || "Section Temporarily Unavailable"}</strong>
          </div>
          <p className="text-sm mb-2 text-danger-emphasis" style={{ fontSize: "12.5px" }}>
            {this.props.fallbackMessage || "An unexpected error occurred in this module. The rest of the application remains fully functional."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-outline-danger px-6 rounded-full font-medium"
              style={{ fontSize: "11.5px" }}
            >
              <i className="bi bi-arrow-clockwise mr-1"></i> Retry Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
