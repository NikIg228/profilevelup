import { memo } from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onStartFree: () => void;
  onScrollToFormats: () => void;
}

function HeroSection({ onStartFree, onScrollToFormats }: HeroSectionProps) {
  return (
    <>
      {/* Hero */}
      <section 
        id="hero"
        data-section="hero"
        className="hero-section relative md:h-auto md:min-h-0 lg:min-h-[80vh] bg-transparent"
      >
        {/* Фоновые элементы */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Фон с логотипом - только на desktop */}
          <div 
            className="hidden lg:block absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url(/logomain.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
            }}
          />
          
          {/* Абстрактный эмоциональный фон - мягкое пятно с градиентом */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(
                  156% 78% at 50% 20%,
                  rgba(201, 162, 77, 0.12),
                  transparent 60%
                )
              `
            }}
          />
          
          {/* Лёгкий шум/текстура для глубины */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '260px 260px'
            }}
          />
        </div>

        {/* Основной контент - единая Grid структура */}
        <div className="relative z-10 w-full container-balanced px-4 lg:px-0 pt-8 lg:pt-6">
          <div className="grid grid-cols-[1fr_192px] sm:grid-cols-[1fr_240px] lg:grid-cols-2 items-center gap-y-4 gap-x-3 lg:gap-8 w-full">
            {/* Колонка 1: Текст (слева) */}
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 20, x: -30 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-[clamp(22px,6vw,34px)] lg:text-4xl xl:text-5xl font-semibold tracking-[-0.02em] leading-[1.05] mb-4 text-heading text-left">
  <span className="block">Характер —{"\u00A0"}</span>
  <span className="block">это система.</span>

  {/* смысловой разрыв */}
  
  <span className="block mt-5">Понимая{"\u00A0"}её,</span>

  <span className="block">начинаешь управлять.</span>
</h1>


              <p className="hidden lg:block mt-4 text-[14px] sm:text-[16px] lg:text-lg text-muted leading-[1.45] mb-6 text-left max-w-[34ch] lg:max-w-none">
                Навигационная система для понимания мышления, решений и поведения в реальной жизни.
              </p>
              
              {/* Кнопки на desktop - под текстом в той же колонке */}
              <div className="hidden lg:flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col">
                  <button 
                    className="btn btn-primary px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" 
                    onClick={() => {
                      document.getElementById("levels")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    Уровни навигации
                  </button>
                </div>
                <div className="flex flex-col">
                  <button 
                    className="btn btn-ghost px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" 
                    onClick={() => {}}
                  >
                    Подробнее
                  </button>
                  </div>
              </div>
            </motion.div>

            {/* Колонка 2: Логотип (справа) */}
            <motion.div
              className="flex items-start justify-end lg:justify-center relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="rounded-2xl overflow-visible flex items-start justify-end lg:justify-center w-full relative">
                <img 
                  src="/logomain.png" 
                  alt="Логотип PROFILEVELUP" 
                  className="w-[165px] sm:w-[216px] lg:w-full lg:max-w-[520px] h-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.08)]" 
                  loading="lazy" 
                />
              </div>
            </motion.div>

            {/* Кнопки на mobile - col-span-2, снизу на всю ширину */}
            <motion.div
              className="col-span-2 lg:hidden mt-5 w-full px-4 box-border"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            >
              <div className="grid grid-cols-2 gap-3 max-[340px]:grid-cols-1 w-full max-w-[520px] mx-auto">
                <button 
                  className="btn btn-primary w-full min-w-0 box-border h-12 rounded-xl flex items-center justify-center px-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 shadow-md hover:shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("levels")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Уровни навигации
                </button>
                
                <button 
                  className="btn btn-ghost w-full min-w-0 box-border h-12 rounded-xl flex items-center justify-center px-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 border border-black/15"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Подробнее
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Визуальное разделение между Hero и следующей секцией - только на мобильных */}
      <div className="lg:hidden relative">
        {/* Мягкий градиентный переход для четкого окончания hero */}
        <div className="h-12 bg-gradient-to-b from-base via-base/97 to-base" />
        {/* Тонкая декоративная линия */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>
    </>
  );
}

export default memo(HeroSection);

