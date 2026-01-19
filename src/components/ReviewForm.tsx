import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Modal from './Modal';
import { addReview } from '../utils/reviewsStorage';
import { sanitizeName, sanitizeReviewText } from '../utils/sanitize';
import { logger } from '../utils/logger';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewForm({ open, onClose, onSuccess }: ReviewFormProps) {
  const [form, setForm] = useState({ name: '', testType: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = 'Укажите имя';
    }
    if (!form.testType) {
      newErrors.testType = 'Выберите уровень навигации';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      // Санитизируем пользовательский ввод перед сохранением
      const sanitizedName = sanitizeName(form.name.trim());
      
      // Генерируем текст отзыва на основе уровня навигации
      const reviewTexts: Record<string, string> = {
        'Первичное понимание': 'Прошёл опрос "Первичное понимание" — всё зашло! Теперь понятно, куда двигаться. Рекомендую.',
        'Персональный разбор': 'Купил опрос "Персональный разбор" — не пожалел! Отчёт реально помог разобраться в себе. Стоит своих денег.',
        'Семейная навигация': 'Проходили опрос "Семейная навигация" вместе с родителями — было прикольно! Теперь лучше понимаем друг друга.',
      };
      
      addReview({
        name: sanitizedName,
        text: reviewTexts[form.testType] || `Прошёл опрос "${form.testType}". Понравилось!`,
        testType: form.testType,
      });

      setIsSuccess(true);
      setForm({ name: '', testType: '' });
      setErrors({});

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      logger.error('Ошибка при отправке отзыва:', error);
      setErrors({ submit: 'Произошла ошибка. Попробуйте позже.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-heading mb-6">Оставить отзыв</h2>

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
                  id="review-name"
                  name="name"
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
                  Уровень навигации *
                </label>
                <select
                  id="review-testType"
                  name="testType"
                  value={form.testType}
                  onChange={(e) => {
                    setForm({ ...form, testType: e.target.value });
                    if (errors.testType) setErrors({ ...errors, testType: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${
                    errors.testType
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-secondary/40 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                >
                  <option value="">Выберите уровень навигации</option>
                  <option value="Первичное понимание">Первичное понимание</option>
                  <option value="Персональный разбор">Персональный разбор</option>
                  <option value="Семейная навигация">Семейная навигация</option>
                </select>
                {errors.testType && (
                  <p className="mt-1 text-sm text-red-500">{errors.testType}</p>
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
      </div>
    </Modal>
  );
}

