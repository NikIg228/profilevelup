import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { User, Loader2, Check } from 'lucide-react';

export default function ChangeNameForm() {
  const user = useAuthStore((state) => state.user);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const changeFullName = useAuthStore((state) => state.changeFullName);
  const loadUserProfile = useAuthStore((state) => state.loadUserProfile);

  // Обновляем поле при изменении пользователя
  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const result = await changeFullName(fullName);
    
    if (result.success) {
      setSuccess(true);
      await loadUserProfile();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Ошибка изменения имени');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-secondary/20 rounded-xl p-4 border border-secondary">
      <h3 className="text-base font-semibold text-heading mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Имя пользователя
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-heading mb-1.5">
            Ваше имя
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="Введите ваше имя"
            />
          </div>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs flex items-center gap-2">
            <Check className="w-3 h-3" />
            Имя успешно изменено
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Сохранение...</span>
            </>
          ) : (
            'Сохранить имя'
          )}
        </button>
      </form>
    </div>
  );
}

