import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Lock, Loader2, Check } from 'lucide-react';

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const changePassword = useAuthStore((state) => state.changePassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    const result = await changePassword(oldPassword, newPassword);
    
    if (result.success) {
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Ошибка изменения пароля');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-secondary/20 rounded-xl p-4 border border-secondary">
      <h3 className="text-base font-semibold text-heading mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4" />
        Пароль
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="old-password" className="block text-sm font-medium text-heading mb-1.5">
            Текущий пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-heading mb-1.5">
            Новый пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="Минимум 6 символов"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-heading mb-1.5">
            Подтвердите новый пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="Повторите новый пароль"
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
            Пароль успешно изменен
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
              <span>Изменение...</span>
            </>
          ) : (
            'Изменить пароль'
          )}
        </button>
      </form>
    </div>
  );
}

