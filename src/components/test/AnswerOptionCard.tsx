import { memo } from 'react';
import { Check } from 'lucide-react';
import { useMotionMode } from '../../hooks/useMotionMode';

interface AnswerOptionCardProps {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

function AnswerOptionCard({ id, label, isSelected, onClick }: AnswerOptionCardProps) {
  const motionConfig = useMotionMode();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-5 py-4 rounded-xl border-2 
        min-h-[56px] touch-manipulation relative overflow-hidden group
        transition-all duration-200 ease-out
        ${motionConfig.enableScale ? 'hover:scale-[1.01] active:scale-[0.99]' : ''}
        ${
          isSelected
            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
            : 'border-secondary/40 bg-card hover:border-primary/50 hover:bg-primary/5'
        }
      `}
      aria-pressed={isSelected}
      aria-label={label}
    >
      {/* Эффект свечения для выбранного варианта */}
      {isSelected && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 transition-opacity duration-200"
          style={{ opacity: 1 }}
        />
      )}

      <div className="flex items-center gap-4 relative z-10">
        {/* Индикатор выбора */}
        <div
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${
              isSelected
                ? 'border-primary bg-primary'
                : 'border-secondary/60 group-hover:border-primary/60'
            }
          `}
        >
          {isSelected && (
            <div
              className="transition-transform duration-200 ease-out"
              style={{ transform: 'scale(1)' }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Текст ответа */}
        <span
          className={`
            text-base leading-relaxed flex-1 transition-colors duration-200
            ${isSelected 
              ? 'text-heading font-semibold' 
              : 'text-ink font-medium'
            }
          `}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

export default memo(AnswerOptionCard);

