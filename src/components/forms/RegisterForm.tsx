import { useState, FormEvent } from 'react';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: (email?: string) => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Валидация
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    const result = await register(email, password, fullName || undefined);
    
    if (result.success) {
      // После успешной регистрации сразу переключаемся на форму входа
      // с предзаполненным email
      onSwitchToLogin?.(email);
    } else {
      setError(result.error || 'Ошибка регистрации');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full-name" className="block text-sm font-medium text-heading mb-2">
          Имя (необязательно)
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="full-name"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError('');
            }}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Ваше имя"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-heading mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Ваш email"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-heading mb-2">
          Пароль
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="w-full pl-10 pr-12 py-3 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Минимум 6 символов"
            required
            minLength={6}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-heading mb-2">
          Подтвердите пароль
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            className="w-full pl-10 pr-12 py-3 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Повторите пароль"
            required
            disabled={isLoading}
          />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
              disabled={isLoading}
              aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
        </div>
      </div>

      {error && (
        <div className={`p-3 rounded-lg border text-sm ${
          success 
            ? 'bg-blue-50 border-blue-200 text-blue-600' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Регистрация...</span>
          </>
        ) : (
          'Зарегистрироваться'
        )}
      </button>

      {onSwitchToLogin && (
        <div className="text-center text-sm">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
            }}
            className="text-muted hover:text-heading transition-colors"
            disabled={isLoading}
          >
            Уже есть аккаунт? <span className="text-primary font-medium">Войти</span>
          </button>
        </div>
      )}
    </form>
  );
}

