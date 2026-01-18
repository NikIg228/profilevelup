import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Mail, Lock, Loader2, Check, Eye, EyeOff } from 'lucide-react';

export default function ChangeEmailForm() {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const changeEmail = useAuthStore((state) => state.changeEmail);
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const result = await changeEmail(newEmail, password);
    
    if (result.success) {
      setSuccess(true);
      setNewEmail('');
      setPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Ошибка изменения email');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-secondary/20 rounded-xl p-4 border border-secondary">
      <h3 className="text-base font-semibold text-heading mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        Email
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="current-email" className="block text-sm font-medium text-heading mb-1.5">
            Текущий email
          </label>
          <input
            id="current-email"
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-secondary bg-base/50 text-ink opacity-60 cursor-not-allowed text-sm"
          />
        </div>

        <div>
          <label htmlFor="new-email" className="block text-sm font-medium text-heading mb-1.5">
            Новый email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="new@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email-password" className="block text-sm font-medium text-heading mb-1.5">
            Пароль для подтверждения
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="email-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-9 pr-10 py-2 rounded-lg border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
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
            Email успешно изменен
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
            'Изменить email'
          )}
        </button>
      </form>
    </div>
  );
}

