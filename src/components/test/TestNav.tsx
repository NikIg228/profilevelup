import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMotionMode } from '../../hooks/useMotionMode';

interface TestNavProps {
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
  isLastQuestion: boolean;
}

function TestNav({
  onNext,
  onBack,
  canGoNext,
  canGoBack,
  isLastQuestion,
}: TestNavProps) {
  const motionConfig = useMotionMode();

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter = Далее
      if (e.key === 'Enter' && canGoNext && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNext();
      }
      // Esc = Назад (только если можно вернуться)
      if (e.key === 'Escape' && canGoBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, onBack, canGoNext, canGoBack]);

  // Анимации для кнопок
  const buttonAnimation = motionConfig.enableScale
    ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <>
      {/* Mobile layout: sticky кнопка внизу */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base border-t border-secondary/20">
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Кнопка "Назад" - текстовая, над "Далее" */}
          {canGoBack && (
            <div className="pt-3 pb-2">
              <motion.button
                {...buttonAnimation}
                type="button"
                onClick={onBack}
                className="
                  w-full text-sm text-muted hover:text-primary
                  transition-colors duration-200
                  min-h-[44px] touch-manipulation
                  flex items-center justify-center
                "
                aria-label="Предыдущий вопрос"
              >
                Назад
              </motion.button>
            </div>
          )}

          {/* Кнопка "Далее" - sticky, primary CTA */}
          <div
            className="pb-4"
            style={{
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            }}
          >
            <motion.button
              {...buttonAnimation}
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={`
                w-full bg-primary text-white font-semibold
                rounded-2xl transition-all duration-200
                min-h-[56px] touch-manipulation
                shadow-lg
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                active:scale-[0.98]
                ${canGoNext ? 'hover:shadow-xl' : ''}
              `}
              aria-label={isLastQuestion ? 'Завершить тест' : 'Следующий вопрос'}
            >
              {isLastQuestion ? 'Завершить' : 'Далее →'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Desktop layout: сохраняем текущий grid */}
      <div className="hidden md:grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
        {/* Кнопка "Назад" */}
        <motion.button
          {...buttonAnimation}
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className={`
            px-5 py-3 w-full text-sm bg-transparent border-2 border-primary text-primary
            rounded-xl font-semibold transition-all duration-200
            min-h-[48px] touch-manipulation
            hover:bg-primary/10 hover:shadow-sm
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
          aria-label="Предыдущий вопрос"
        >
          Назад
        </motion.button>

        {/* Кнопка "Далее" / "Завершить" */}
        <motion.button
          {...buttonAnimation}
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`
            btn btn-primary px-5 py-3 w-full text-sm font-semibold
            shadow-md hover:shadow-lg transition-all duration-200
            min-h-[48px] touch-manipulation
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
          aria-label={isLastQuestion ? 'Завершить тест' : 'Следующий вопрос'}
        >
          {isLastQuestion ? 'Завершить' : 'Далее'}
        </motion.button>
      </div>
    </>
  );
}

export default memo(TestNav);

