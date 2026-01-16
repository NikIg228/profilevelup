import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Mail, Loader2, Check, ArrowLeft } from 'lucide-react';

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
      setEmail('');
    } else {
      setError(result.error || 'Ошибка отправки письма');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted hover:text-heading transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к входу
        </button>
      )}

      <div>
        <h2 className="text-xl font-semibold text-heading mb-2">Восстановление пароля</h2>
        <p className="text-sm text-muted mb-4">
          Введите ваш email, и мы отправим вам ссылку для сброса пароля
        </p>
      </div>

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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-secondary bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            <div>
              <p className="font-medium">Письмо отправлено!</p>
              <p className="text-xs mt-1">Проверьте вашу почту и следуйте инструкциям для сброса пароля.</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Отправка...</span>
            </>
          ) : (
            'Отправить ссылку для сброса'
          )}
        </button>
      </form>
    </div>
  );
}


