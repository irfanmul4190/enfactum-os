"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Title shown in the fallback. Defaults to a generic message. */
  fallbackTitle?: string;
  /** Optional handler. If omitted, dev builds log to console; prod is silent. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level React error boundary lifted from profit-navigator. Imported by
 * every secured SPA so a render crash shows a recovery card instead of a
 * blank white page. Tailwind classes use design tokens that exist in all
 * five apps (`--card`, `--border`, `--destructive`, etc.) — they resolve
 * to each app's theme automatically.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
      return;
    }
    // Hard React crash — always log. Consumers can pass `onError` to override
    // (e.g. ship to Sentry, suppress in prod, etc.).
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/50 p-8 text-center min-h-[200px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {this.props.fallbackTitle ?? "Something went wrong"}
        </p>
        {this.state.error && (
          <p className="max-w-md text-xs text-muted-foreground truncate">
            {this.state.error.message}
          </p>
        )}
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  }
}
