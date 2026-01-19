import { useState, FormEvent } from 'react';
import { User, Loader2, Check, AlertCircle, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function ChangeNameForm() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const result = await updateProfile(fullName || undefined);
    
    if (result.success) {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } else {
      setError(result.error || 'Ошибка изменения имени');
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    setFullName(user?.fullName || '');
    setIsEditing(false);
    setError('');
    setSuccess(false);
  };

  return (
    <div>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Введите ваше имя"
              autoFocus
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-3 py-2 border border-secondary/40 text-heading rounded-lg hover:bg-secondary/40 transition-colors disabled:opacity-50 text-sm"
            >
              Отмена
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Имя успешно изменено
            </p>
          )}
        </form>
      ) : (
        <h2 className="text-lg font-semibold text-heading inline-flex items-center gap-2">
          {user?.fullName || user?.email}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-muted hover:text-heading hover:bg-secondary/40 rounded transition-colors"
            title="Изменить имя"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </h2>
      )}
    </div>
  );
}

