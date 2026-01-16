import { motion } from 'framer-motion';

type Option = { value: string; label: string };
type Props = {
  question: string;
  options: Option[];
  value?: string;
  onChange: (val: string) => void;
};

export default function QuestionCard({ question, options, value, onChange }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-6"
    >
      <h3 className="text-lg font-semibold mb-4">{question}</h3>
      <div className="grid gap-3">
        {options.map((o, index) => (
          <motion.button
            key={o.value}
            type="button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.2 }}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 shadow-soft hover:shadow-hover hover:scale-[1.02] min-h-[44px] touch-manipulation ${
              value === o.value 
                ? 'border-primary bg-primary/10 scale-[1.02] shadow-md' 
                : 'border-secondary/60 bg-card hover:border-primary/40'
            }`}
            onClick={() => onChange(o.value)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                value === o.value 
                  ? 'border-primary bg-primary' 
                  : 'border-secondary'
              }`}>
                {value === o.value && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                )}
              </div>
              <span>{o.label}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}


