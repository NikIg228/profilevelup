import { memo } from 'react';
import { motion } from 'framer-motion';
import { useMotionMode } from '../../hooks/useMotionMode';

interface TestHeaderProps {
  current: number;
  total: number;
}

function TestHeader({ current, total }: TestHeaderProps) {
  const motionConfig = useMotionMode();
  const pct = Math.round((current / total) * 100);

  // Ограничиваем количество мини-индикаторов для снижения DOM нагрузки
  const MAX_INDICATORS = 20;
  const shouldLimitIndicators = total > MAX_INDICATORS;
  
  // Если вопросов больше MAX_INDICATORS, показываем только первые MAX_INDICATORS
  const indicatorsCount = shouldLimitIndicators ? MAX_INDICATORS : total;

  // Анимация прогресс-бара
  const progressAnimation = motionConfig.enableSlide
    ? {
        initial: { width: 0 },
        animate: { width: `${pct}%` },
        transition: {
          duration: motionConfig.duration / 1000,
          ease: motionConfig.mode === 'full' ? 'easeOut' : 'linear',
        },
      }
    : {
        style: { width: `${pct}%` },
      };

  return (
    <div className="w-full">
      {/* Заголовок с номером вопроса */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted">
          Вопрос {current} из {total}
        </span>
        <span className="text-xs text-muted font-medium">{pct}%</span>
      </div>

      {/* Тонкий progress bar */}
      <div className="relative h-1.5 bg-secondary/20 rounded-full overflow-hidden">
        {motionConfig.enableSlide ? (
          <motion.div
            className="h-full bg-primary rounded-full"
            {...progressAnimation}
          />
        ) : (
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%`, transitionDuration: `${motionConfig.duration}ms` }}
          />
        )}
      </div>

      {/* Мини-индикаторы для каждого вопроса */}
      {!shouldLimitIndicators && (
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: indicatorsCount }).map((_, i) => {
            const isCompleted = i < current - 1;
            const isCurrent = i === current - 1;

            return (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  isCompleted
                    ? 'bg-primary'
                    : isCurrent
                      ? 'bg-primary/60'
                      : 'bg-secondary/20'
                }`}
                style={{
                  transitionDuration: `${motionConfig.duration}ms`,
                }}
              />
            );
          })}
        </div>
      )}
      {shouldLimitIndicators && (
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: indicatorsCount }).map((_, i) => {
            // Вычисляем относительный прогресс для ограниченного количества индикаторов
            const relativeProgress = (current / total) * indicatorsCount;
            const isCompleted = i < relativeProgress - 1;
            const isCurrent = i >= Math.floor(relativeProgress - 1) && i < relativeProgress;

            return (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  isCompleted
                    ? 'bg-primary'
                    : isCurrent
                      ? 'bg-primary/60'
                      : 'bg-secondary/20'
                }`}
                style={{
                  transitionDuration: `${motionConfig.duration}ms`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(TestHeader);

