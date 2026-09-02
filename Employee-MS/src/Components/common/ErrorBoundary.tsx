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
        <div className="p-3 my-2 rounded-3 border border-danger-subtle bg-danger-subtle text-danger shadow-sm">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <strong className="fs-6">{this.props.fallbackTitle || "Section Temporarily Unavailable"}</strong>
          </div>
          <p className="small mb-2 text-danger-emphasis" style={{ fontSize: "12.5px" }}>
            {this.props.fallbackMessage || "An unexpected error occurred in this module. The rest of the application remains fully functional."}
          </p>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-medium"
              style={{ fontSize: "11.5px" }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Retry Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
