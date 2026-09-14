import { Component, ErrorInfo, ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled application error", error, info);
  }

  private reload = () => window.location.reload();

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-lg">
          <h1 className="font-display text-xl font-bold text-on-surface">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            The application could not complete this screen. Reload to try again.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
