import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary для модальных окон (например, при ошибке загрузки чанка).
 * Показывает overlay с сообщением и кнопками «Повторить» / «Закрыть».
 */
export default class ModalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ModalErrorBoundary]', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-4"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            minHeight: '100dvh',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            className="card w-full max-w-sm p-6 flex flex-col gap-4 rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
            <h3 className="text-lg font-semibold text-heading">
              Не удалось загрузить форму
            </h3>
            <p className="text-sm text-muted">
              Проверьте интернет и попробуйте снова или закройте окно.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Повторить
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                className="btn btn-secondary flex items-center justify-center gap-2 min-w-[44px]"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
