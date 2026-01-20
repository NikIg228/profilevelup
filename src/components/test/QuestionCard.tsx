import { memo } from 'react';
import { motion } from 'framer-motion';
import AnswerOptionCard from './AnswerOptionCard';
import { useMotionMode } from '../../hooks/useMotionMode';

type Option = { value: string; label: string };

interface QuestionCardProps {
  questionId?: string | number;
  question: string;
  options: Option[];
  selectedValue?: string;
  onChange: (val: string) => void;
  current?: number;
  total?: number;
}

function QuestionCard({ questionId, question, options, selectedValue, onChange, current, total }: QuestionCardProps) {
  const motionConfig = useMotionMode();

  // Анимация появления карточки (только при смене вопроса)
  // AnimatePresence управляется в родительском компоненте через key={questionId}
  const cardAnimation = motionConfig.enableSlide
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
        transition: {
          duration: motionConfig.duration / 1000,
          ease: motionConfig.mode === 'full' ? 'easeOut' : 'linear',
        },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: {
          duration: motionConfig.duration / 1000,
        },
      };

  return (
    <motion.div
      {...cardAnimation}
      className="card p-6 sm:p-8 shadow-lg test-question-scroll"
      style={{
        // Ограничение высоты для landscape режима на мобилках
        maxHeight: 'calc(100vh - 280px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', // Плавный скролл на iOS
      }}
    >
      {/* Заголовок вопроса */}
      <h3 className="text-lg sm:text-xl font-semibold mb-6 text-heading leading-relaxed">
        {question}
      </h3>

      {/* Варианты ответов */}
      <div className="grid gap-3 sm:gap-4">
        {options.map((option, index) => (
          <AnswerOptionCard
            key={option.value}
            id={option.value}
            label={option.label}
            isSelected={selectedValue === option.value}
            onClick={() => onChange(option.value)}
            index={index}
          />
        ))}
      </div>

      {/* Текстовый индикатор прогресса (только на мобильных) */}
      {current && total && (
        <div className="md:hidden mt-4 pt-4 border-t border-secondary/30">
          <p className="text-sm text-muted opacity-50 text-center">
            Вопрос {current} из {total}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default memo(QuestionCard);

