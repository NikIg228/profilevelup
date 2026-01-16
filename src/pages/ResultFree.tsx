import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Download, Share2 } from 'lucide-react';
import { useTestStore } from '../stores/useTestStore';

export default function ResultFree() {
  const navigate = useNavigate();
  const { resultIndex, tariff, ageGroup, resetTest } = useTestStore();

  useEffect(() => {
    // Если нет результата, перенаправляем на главную
    if (!resultIndex || tariff !== 'FREE') {
      navigate('/');
      return;
    }
  }, [resultIndex, tariff, navigate]);

  if (!resultIndex || tariff !== 'FREE') {
    return null;
  }

  const handleStartNew = () => {
    resetTest();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base via-section-bg to-base">
      <div className="container-balanced py-12 md:py-20">
        {/* Заголовок с анимацией */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-heading mb-4">
            Тест завершён!
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Вы прошли бесплатный тест. Результаты помогут вам лучше понять свои предпочтения.
          </p>
        </motion.div>

        {/* Основной блок результата */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="card p-8 md:p-12 mb-8 relative overflow-hidden">
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              {/* Описание */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-heading mb-4">
                  Что дальше?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-heading mb-1">
                        Изучите подробный отчёт
                      </p>
                      <p className="text-sm text-muted">
                        Получите детальное описание вашего типа личности, сильных сторон и рекомендаций
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-heading mb-1">
                        Узнайте о подходящих профессиях
                      </p>
                      <p className="text-sm text-muted">
                        Получите список профессий, которые лучше всего подходят вашему типу
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-heading mb-1">
                        Пройдите расширенный тест
                      </p>
                      <p className="text-sm text-muted">
                        Для более точного результата пройдите тест EXTENDED или PREMIUM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/details')}
                  className="btn btn-primary flex items-center justify-center gap-2 py-4"
                >
                  <Download className="w-5 h-5" />
                  Получить отчёт
                </button>
                <button
                  onClick={handleStartNew}
                  className="btn btn-ghost flex items-center justify-center gap-2 py-4"
                >
                  Пройти ещё раз
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="card p-6 bg-primary/5 border border-primary/10"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-heading mb-2">
                  Поделитесь результатом
                </h3>
                <p className="text-sm text-muted mb-4">
                  Расскажите друзьям о своём психологическом типе
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-secondary/40 rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors">
                    Поделиться
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

