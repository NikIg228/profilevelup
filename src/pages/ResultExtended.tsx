import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Download, Share2, TrendingUp, BookOpen, Target } from 'lucide-react';
import { useTestStore } from '../stores/useTestStore';

export default function ResultExtended() {
  const navigate = useNavigate();
  const { resultIndex, tariff, ageGroup, resetTest } = useTestStore();

  useEffect(() => {
    if (!resultIndex || tariff !== 'EXTENDED') {
      navigate('/');
      return;
    }
  }, [resultIndex, tariff, navigate]);

  if (!resultIndex || tariff !== 'EXTENDED') {
    return null;
  }

  const handleStartNew = () => {
    resetTest();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base via-section-bg to-base">
      <div className="container-balanced py-12 md:py-20">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6 relative">
            <CheckCircle className="w-14 h-14 text-primary" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute inset-0 border-4 border-primary/20 rounded-full"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-heading mb-4">
            Поздравляем!
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto">
            Вы прошли расширенный тест. Теперь у вас есть детальное понимание вашего психологического профиля.
          </p>
        </motion.div>

        {/* Основной блок */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Результат с визуализацией */}
          <div className="card p-8 md:p-12 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              {/* Характеристики */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold text-heading">Сильные стороны</h3>
                  </div>
                  <p className="text-sm text-muted">
                    Ваш тип личности обладает уникальными качествами, которые помогают вам достигать успеха в определённых сферах деятельности.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold text-heading">Рекомендации</h3>
                  </div>
                  <p className="text-sm text-muted">
                    Получите персональные рекомендации по развитию и выбору профессии на основе вашего типа.
                  </p>
                </motion.div>
              </div>

              {/* Детальная информация */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-heading mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Что включает ваш отчёт
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Детальное описание вашего типа',
                    'Анализ сильных и слабых сторон',
                    'Подходящие профессии и карьера',
                    'Рекомендации по развитию',
                    'Совместимость с другими типами',
                    'Примеры известных людей вашего типа',
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm text-ink">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/details')}
                  className="btn btn-primary flex items-center justify-center gap-2 py-4 col-span-2"
                >
                  <Download className="w-5 h-5" />
                  Получить полный отчёт
                </button>
                <button
                  onClick={handleStartNew}
                  className="btn btn-ghost flex items-center justify-center gap-2 py-4"
                >
                  Ещё раз
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Дополнительные блоки */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="card p-6 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10"
            >
              <h3 className="font-semibold text-heading mb-3">
                Премиум версия
              </h3>
              <p className="text-sm text-muted mb-4">
                Получите ещё более детальный анализ с персональными рекомендациями и консультацией
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-primary font-medium hover:underline"
              >
                Узнать больше →
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="card p-6 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10"
            >
              <h3 className="font-semibold text-heading mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Поделиться
              </h3>
              <p className="text-sm text-muted mb-4">
                Расскажите друзьям о своём психологическом типе
              </p>
              <button className="text-sm text-primary font-medium hover:underline">
                Поделиться результатом →
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

