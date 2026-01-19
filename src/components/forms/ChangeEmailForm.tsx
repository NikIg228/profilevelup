import { useState, FormEvent } from 'react';
import { Mail, Lock, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export default function ChangeEmailForm() {
  const user = useAuthStore((state) => state.user);
  const changeEmail = useAuthStore((state) => state.changeEmail);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    if (!newEmail || !password) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    if (newEmail === user?.email) {
      setError('Новый email совпадает с текущим');
      setIsLoading(false);
      return;
    }

    const result = await changeEmail(newEmail, password);
    
    if (result.success) {
      setSuccess(true);
      setNewEmail('');
      setPassword('');
      if (result.requiresConfirmation) {
        setError(result.error || 'Проверьте новую почту и подтвердите изменение email');
      } else {
        setError('');
      }
      setTimeout(() => {
        setSuccess(false);
        setError('');
      }, 5000);
    } else {
      setError(result.error || 'Ошибка изменения email');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-secondary/40 shadow-sm p-4">
      <h3 className="text-base font-semibold text-heading mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        Изменить email
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="current-email" className="block text-xs font-medium text-heading mb-1">
            Текущий email
          </label>
          <input
            id="current-email"
            type="email"
            value={user?.email || ''}
            className="w-full px-4 py-2 rounded-lg border border-secondary/40 bg-base text-ink text-sm"
            disabled
          />
        </div>

        <div>
          <label htmlFor="new-email" className="block text-xs font-medium text-heading mb-1">
            Новый email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="new@email.com"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email-password" className="block text-xs font-medium text-heading mb-1">
            Текущий пароль (для подтверждения)
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="email-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full pl-9 pr-12 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Введите текущий пароль"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
              disabled={isLoading}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
            success 
              ? 'bg-blue-50 border border-blue-200 text-blue-600' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && !error && (
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-600 text-xs flex items-center gap-2">
            <Check className="w-3 h-3" />
            Email успешно изменен
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
            'Изменить email'
          )}
        </button>
      </form>
    </div>
  );
}

