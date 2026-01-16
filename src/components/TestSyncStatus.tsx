import { CheckCircle, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { useTestStore } from '../stores/useTestStore';

export default function TestSyncStatus() {
  const { isSaving, lastSyncStatus, syncError, syncWithServer } = useTestStore();

  if (isSaving) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-card border border-secondary/40 rounded-lg shadow-lg text-sm z-50">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-muted">Сохранение...</span>
      </div>
    );
  }

  if (lastSyncStatus === false || syncError) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg text-sm z-50">
        <WifiOff className="w-4 h-4 text-yellow-600" />
        <span className="text-yellow-800">Сохранено локально</span>
        <button
          onClick={() => syncWithServer()}
          className="ml-2 text-yellow-800 underline text-xs hover:text-yellow-900 transition-colors"
          aria-label="Повторить синхронизацию"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (lastSyncStatus === true) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg shadow-lg text-sm z-50 animate-fade-out">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-green-800">Сохранено</span>
      </div>
    );
  }

  return null;
}

