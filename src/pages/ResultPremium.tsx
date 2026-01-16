import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  ArrowRight, 
  Download, 
  Share2, 
  TrendingUp, 
  BookOpen, 
  Target,
  Award,
  Users,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { useTestStore } from '../stores/useTestStore';

export default function ResultPremium() {
  const navigate = useNavigate();
  const { resultIndex, tariff, ageGroup, resetTest } = useTestStore();

  useEffect(() => {
    if (!resultIndex || tariff !== 'PREMIUM') {
      navigate('/');
      return;
    }
  }, [resultIndex, tariff, navigate]);

  if (!resultIndex || tariff !== 'PREMIUM') {
    return null;
  }

  const handleStartNew = () => {
    resetTest();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base via-section-bg to-base">
      {/* Декоративный фон */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container-balanced py-12 md:py-20 relative z-10">
        {/* Заголовок с премиум акцентом */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-primary to-primary-hover rounded-full mb-6 relative shadow-2xl"
          >
            <Award className="w-16 h-16 text-white" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-4 border-primary/20 rounded-full"
            />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-heading mb-4 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Поздравляем!
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto">
            Вы прошли премиум тест. Теперь у вас есть полное понимание вашего психологического профиля 
            с детальными рекомендациями и персональным планом развития.
          </p>
        </motion.div>

        {/* Основной блок результата */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          <div className="card p-8 md:p-16 mb-8 relative overflow-hidden border-2 border-primary/20 shadow-2xl">
            {/* Премиум декоративные элементы */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Премиум функции */}
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-heading">Сильные стороны</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    Детальный анализ ваших уникальных качеств, талантов и способностей, которые помогают вам достигать успеха.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-heading">Персональный план</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    Индивидуальные рекомендации по развитию, выбору профессии и достижению ваших целей.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-heading">Совместимость</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    Анализ совместимости с другими типами личности в работе, отношениях и команде.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-heading">Карьерный анализ</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    Подробный список профессий, которые идеально подходят вашему типу личности.
                  </p>
                </motion.div>
              </div>

              {/* Что включает премиум отчёт */}
              <div className="mb-10">
                <h3 className="text-2xl font-semibold text-heading mb-6 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                  Что включает ваш премиум отчёт
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Детальное описание типа личности',
                    'Анализ сильных и слабых сторон',
                    'Персональные рекомендации',
                    'Подходящие профессии (50+)',
                    'Карьерные пути развития',
                    'Совместимость с типами',
                    'Примеры известных людей',
                    'Стратегии развития',
                    'Рабочие стили и предпочтения',
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + index * 0.05 }}
                      className="flex items-start gap-3 p-4 bg-secondary/20 rounded-xl border border-secondary/40"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-ink leading-relaxed">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/details')}
                  className="btn btn-primary flex items-center justify-center gap-2 py-5 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Download className="w-6 h-6" />
                  Скачать полный отчёт PDF
                </button>
                <button
                  onClick={handleStartNew}
                  className="btn btn-ghost flex items-center justify-center gap-2 py-5 text-lg"
                >
                  Пройти ещё раз
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Дополнительные премиум блоки */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="card p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-heading mb-2">Персональная консультация</h3>
              <p className="text-sm text-muted mb-4">
                Запишитесь на индивидуальную консультацию с психологом для детального разбора результатов
              </p>
              <button className="text-sm text-primary font-medium hover:underline">
                Записаться →
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="card p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-heading mb-2">Поделиться результатом</h3>
              <p className="text-sm text-muted mb-4">
                Поделитесь своим профилем с друзьями или сохраните для себя
              </p>
              <button className="text-sm text-primary font-medium hover:underline">
                Поделиться →
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 }}
              className="card p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-heading mb-2">Сертификат</h3>
              <p className="text-sm text-muted mb-4">
                Получите именной сертификат о прохождении премиум теста
              </p>
              <button className="text-sm text-primary font-medium hover:underline">
                Получить →
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

