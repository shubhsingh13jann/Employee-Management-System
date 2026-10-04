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
        <div className="p-6 my-4 mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 mb-2">
            <i className="bi bi-exclamation-triangle-fill text-xl text-rose-600"></i>
            <h4 className="text-base font-bold text-rose-900 mb-0">
              {this.props.fallbackTitle || "Section Temporarily Unavailable"}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-rose-700 mb-3 leading-relaxed">
            {this.props.fallbackMessage ||
              "An unexpected error occurred in this module. The rest of the application remains fully functional."}
          </p>

          {this.state.error && (
            <div className="mb-4 p-3 rounded-xl bg-white/90 border border-rose-200 text-xs font-mono text-rose-900 overflow-auto max-h-48">
              <div className="font-bold text-rose-700 mb-1">
                {this.state.error.name}: {this.state.error.message}
              </div>
              {this.state.error.stack && (
                <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-mono mb-0">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm shadow-rose-600/30 cursor-pointer"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Retry Section</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

