type Props = { current: number; total: number };

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted">Вопрос {current} из {total}</span>
        <span className="text-sm font-semibold text-primary">{pct}%</span>
      </div>
      <div className="relative h-3 bg-secondary/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      {/* Мини-индикаторы для каждого вопроса */}
      <div className="flex gap-1 mt-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < current ? 'bg-primary' : i === current - 1 ? 'bg-primary/50' : 'bg-secondary/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}


