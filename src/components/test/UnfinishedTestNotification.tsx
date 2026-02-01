import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useTestStore } from '../../stores/useTestStore';

/**
 * Компонент уведомления о незавершенном тесте
 * Показывается когда пользователь возвращается на страницу с незавершенным тестом
 */
export default function UnfinishedTestNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const testId = useTestStore(state => state.testId);
  const isCompleted = useTestStore(state => state.isCompleted);
  const step = useTestStore(state => state.step);
  const answers = useTestStore(state => state.answers);
  const tariff = useTestStore(state => state.tariff);
  const total = useTestStore(state => state.testConfig?.questions?.length ?? 0);
  const resetTest = useTestStore(state => state.resetTest);
  
  // Проверяем, есть ли незавершенный тест
  const hasUnfinishedTest = 
    testId && 
    !isCompleted && 
    answers && 
    Object.keys(answers).length > 0 &&
    step <= total;

  useEffect(() => {
    // Показываем уведомление только если есть незавершенный тест и оно не было закрыто
    if (hasUnfinishedTest && !isDismissed) {
      // Небольшая задержка для плавного появления
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [hasUnfinishedTest, isDismissed]);

  // Не показываем, если тест завершен или нет данных
  if (!hasUnfinishedTest || isCompleted) {
    return null;
  }

  const progress = total > 0 ? Math.round((step / total) * 100) : 0;
  const isPaidTest = tariff === 'EXTENDED' || tariff === 'PREMIUM';

  const handleContinue = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Пользователь уже на странице теста, просто скрываем уведомление
  };

  const handleStartNew = async () => {
    const confirmed = isPaidTest 
      ? window.confirm(
          'Вы уверены, что хотите начать новый тест?\n\n' +
          'Незавершенный тест будет потерян. Убедитесь, что вы сохранили свой прогресс.'
        )
      : true;
    
    if (confirmed) {
      await resetTest();
      setIsVisible(false);
      setIsDismissed(true);
      // Страница автоматически перезагрузится через initializeTest
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Сохраняем в sessionStorage, чтобы не показывать снова в этой сессии
    sessionStorage.setItem('unfinished-test-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-4"
        >
          <div className="card p-4 shadow-lg border-2 border-primary/30 bg-white">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-heading mb-1">
                  Незавершенный тест
                </h3>
                <p className="text-xs text-muted mb-2">
                  У вас есть незавершенный тест. Прогресс: {step} из {total} вопросов ({progress}%)
                </p>
                
                {isPaidTest && (
                  <p className="text-xs text-primary font-medium mb-2">
                    ⚠️ Ваш прогресс сохранен. Вы можете продолжить тест.
                  </p>
                )}
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleContinue}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Продолжить
                  </button>
                  <button
                    onClick={handleStartNew}
                    className="px-3 py-1.5 text-xs font-semibold border border-primary/30 text-heading rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    Начать заново
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 text-muted hover:text-heading transition-colors"
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

