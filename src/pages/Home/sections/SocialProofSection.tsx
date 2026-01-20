import { memo } from 'react';
import { Check } from 'lucide-react';
import CountUp from '../../../components/CountUp';

function SocialProofSection() {
  return (
    <section className="container-balanced mt-12 lg:mt-16">
      {/* Desktop: 3 колонки */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4">
        <div className="card p-5 md:p-6 border border-secondary/40 flex items-start gap-3">
          <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
          <div className="text-lg md:text-xl font-semibold text-heading">
            <CountUp
              from={0}
              to={8200}
              separator=" "
              direction="up"
              duration={2}
              className="inline text-ink"
            />+ человек прошли тест
          </div>
        </div>
        <div className="card p-5 md:p-6 border border-secondary/40 flex items-start gap-3">
          <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
          <div className="text-lg md:text-xl font-semibold text-heading">
            <CountUp
              from={0}
              to={92}
              separator=""
              direction="up"
              duration={2}
              className="inline text-ink"
            /><span className="text-ink">%</span> говорят: "Я понял(а) себя лучше"
          </div>
        </div>
        <div className="card p-5 md:p-6 border border-secondary/40 flex items-start gap-3">
          <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
          <div className="text-lg md:text-xl font-semibold text-heading">
            <CountUp
              from={0}
              to={78}
              separator=""
              direction="up"
              duration={2}
              className="inline text-ink"
            /><span className="text-ink">%</span> родителей отмечают, что ребёнок стал увереннее
          </div>
        </div>
      </div>

      {/* Mobile: вертикальный список trust-cards */}
      <div className="sm:hidden space-y-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
          <div className="text-base font-semibold text-heading">
            <CountUp
              from={0}
              to={8200}
              separator=" "
              direction="up"
              duration={2}
              className="inline text-ink"
            />+ человек
            <div className="text-sm font-normal text-muted mt-0.5">прошли тест</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
          <div className="text-base font-semibold text-heading">
            <CountUp
              from={0}
              to={92}
              separator=""
              direction="up"
              duration={2}
              className="inline text-ink"
            /><span className="text-ink">%</span>
            <div className="text-sm font-normal text-muted mt-0.5">говорят: «Я понял(а) себя лучше»</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
          <div className="text-base font-semibold text-heading">
            <CountUp
              from={0}
              to={78}
              separator=""
              direction="up"
              duration={2}
              className="inline text-ink"
            /><span className="text-ink">%</span> родителей
            <div className="text-sm font-normal text-muted mt-0.5">отмечают рост уверенности</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(SocialProofSection);

