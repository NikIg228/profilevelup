import { useState, FormEvent, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Mail, Lock, Loader2, Eye, EyeOff, Check } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  registeredEmail?: string;
  isAlreadyRegistered?: boolean;
}

export default function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword, registeredEmail, isAlreadyRegistered }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (registeredEmail) {
      if (isAlreadyRegistered) {
        setShowAlreadyRegistered(true);
        setEmail(registeredEmail); // Автоматически заполняем email
        // Автоматически скрываем уведомление через 10 секунд
        const timer = setTimeout(() => {
          setShowAlreadyRegistered(false);
        }, 10000);
        return () => clearTimeout(timer);
      } else {
        setShowRegistrationSuccess(true);
        // Автоматически скрываем уведомление через 10 секунд
        const timer = setTimeout(() => {
          setShowRegistrationSuccess(false);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [registeredEmail, isAlreadyRegistered]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Ошибка входа');
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-heading mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ваш email"
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-heading mb-2">
          Пароль
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-12 py-3 rounded-xl border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {showRegistrationSuccess && registeredEmail && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-1">Регистрация успешна!</p>
              <p className="text-xs">
                Мы отправили письмо с подтверждением на адрес <strong>{registeredEmail}</strong>. 
                Пожалуйста, проверьте почту и перейдите по ссылке для подтверждения регистрации.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRegistrationSuccess(false)}
              className="text-green-600 hover:text-green-700 transition-colors ml-2"
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showAlreadyRegistered && registeredEmail && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-1">Вы уже зарегистрированы!</p>
              <p className="text-xs">
                Пользователь с email <strong>{registeredEmail}</strong> уже существует. 
                Войдите, используя свой пароль.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAlreadyRegistered(false)}
              className="text-blue-600 hover:text-blue-700 transition-colors ml-2"
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Вход...</span>
          </>
        ) : (
          'Войти'
        )}
      </button>

      <div className="space-y-2">
        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="w-full text-center text-sm text-muted hover:text-primary transition-colors"
          >
            Забыли пароль?
          </button>
        )}
        {onSwitchToRegister && (
          <p className="text-center text-sm text-muted">
            Нет аккаунта?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-medium"
            >
              Зарегистрироваться
            </button>
          </p>
        )}
      </div>
    </form>
  );
}

