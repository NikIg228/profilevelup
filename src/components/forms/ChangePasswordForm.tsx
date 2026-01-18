import { useState, FormEvent } from 'react';
import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function ChangePasswordForm() {
  const changePassword = useAuthStore((state) => state.changePassword);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    // Валидация
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (oldPassword === newPassword) {
      setError('Новый пароль должен отличаться от текущего');
      setIsLoading(false);
      return;
    }

    const result = await changePassword(oldPassword, newPassword);
    
    if (result.success) {
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } else {
      setError(result.error || 'Ошибка изменения пароля');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-secondary/40 shadow-sm p-4">
      <h3 className="text-base font-semibold text-heading mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        Изменить пароль
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="old-password" className="block text-xs font-medium text-heading mb-1">
            Текущий пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="old-password"
              type={showOldPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-12 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Введите текущий пароль"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
              disabled={isLoading}
            >
              {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="block text-xs font-medium text-heading mb-1">
            Новый пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-12 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Минимум 6 символов"
              required
              minLength={6}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
              disabled={isLoading}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-xs font-medium text-heading mb-1">
            Подтвердите новый пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-12 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Повторите новый пароль"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-600 text-xs flex items-center gap-2">
            <Check className="w-3 h-3" />
            Пароль успешно изменен
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm"
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

