import React, { Component, ErrorInfo, ReactNode } from 'react';
import { OrangeHealthLogo } from './OrangeHealthLogo';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-6 select-none font-sans">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-neutral-200 shadow-2xl space-y-6 text-center">
            <div className="flex justify-center">
              <OrangeHealthLogo variant="full" className="scale-110" />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                Application Rendering Interruption
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                An unexpected error occurred while loading this view. The system has prevented a blank screen.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-left">
                <p className="text-[11px] font-mono text-neutral-700 break-words leading-relaxed">
                  {this.state.error.message || 'Unknown error occurred'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleReload}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reload Application
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReset}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
