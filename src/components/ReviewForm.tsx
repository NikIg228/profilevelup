import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { addReview } from '../utils/reviewsStorage';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewForm({ open, onClose, onSuccess }: ReviewFormProps) {
  const [form, setForm] = useState({ name: '', text: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = 'Укажите имя';
    }
    if (!form.text.trim()) {
      newErrors.text = 'Напишите отзыв';
    } else if (form.text.trim().length < 10) {
      newErrors.text = 'Отзыв должен содержать минимум 10 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      const date = new Date().toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });

      addReview({
        name: form.name.trim(),
        text: form.text.trim(),
        date,
      });

      setIsSuccess(true);
      setForm({ name: '', text: '' });
      setErrors({});

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
      setErrors({ submit: 'Произошла ошибка. Попробуйте позже.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-heading">Оставить отзыв</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-ink" />
            </button>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-primary mb-4" />
              <p className="text-lg font-semibold text-heading mb-2">Спасибо за отзыв!</p>
              <p className="text-sm text-muted text-center">
                Ваш отзыв отправлен на модерацию и будет опубликован после проверки.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-secondary/40 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  placeholder="Введите ваше имя"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Ваш отзыв *
                </label>
                <textarea
                  value={form.text}
                  onChange={(e) => {
                    setForm({ ...form, text: e.target.value });
                    if (errors.text) setErrors({ ...errors, text: '' });
                  }}
                  rows={5}
                  className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                    errors.text
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-secondary/40 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  placeholder="Поделитесь своими впечатлениями о тесте..."
                />
                {errors.text && (
                  <p className="mt-1 text-sm text-red-500">{errors.text}</p>
                )}
              </div>

              {errors.submit && (
                <p className="text-sm text-red-500">{errors.submit}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-primary rounded-xl text-primary font-semibold transition-all duration-300 hover:bg-primary/10"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold transition-all duration-300 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

