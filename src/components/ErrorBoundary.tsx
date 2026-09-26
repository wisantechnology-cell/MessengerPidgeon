import { Component, ReactNode, ErrorInfo } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('birdmessage_user_profile_v1');
      localStorage.removeItem('birdmessage_chats_data_v1');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0f131c] text-[#dfe2ee] flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#181c24] border border-white/10 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ef4444]/20 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-[#dfe2ee]">Algo no cargó correctamente</h2>
              <p className="text-xs text-[#8d90a0]">
                Ocurrió un inconveniente temporal al cargar la vista de MessengerPidgeon.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full p-2.5 rounded-xl bg-black/40 text-[11px] text-left text-[#ffb4ab] font-mono overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-2">
              <button
                onClick={this.handleRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-[#262a33] hover:bg-[#353942] text-[#dfe2ee] font-semibold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Restaurar datos</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
