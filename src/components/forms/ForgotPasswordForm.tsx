import { useState, FormEvent } from 'react';
import { Mail, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Ошибка отправки письма');
    }
    
    setIsLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-heading mb-2">Восстановление пароля</h2>
        <p className="text-sm text-muted">
          Введите ваш email, и мы отправим вам ссылку для сброса пароля
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 flex items-start gap-3">
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Письмо отправлено!</p>
              <p className="text-sm">
                Проверьте почту <strong>{email}</strong> и перейдите по ссылке для сброса пароля.
              </p>
            </div>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Вернуться к входу
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-heading mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
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
                <span>Отправка...</span>
              </>
            ) : (
              'Отправить ссылку'
            )}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 border border-secondary/40 text-heading rounded-lg font-medium hover:bg-secondary/40 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <ArrowLeft className="w-5 h-5" />
              Вернуться к входу
            </button>
          )}
        </form>
      )}
    </div>
  );
}

