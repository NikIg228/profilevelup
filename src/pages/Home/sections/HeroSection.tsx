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
        className="hero-section relative md:h-auto md:min-h-0 lg:min-h-[80vh] flex flex-col items-center justify-start lg:pt-8 bg-transparent"
      >
        {/* Мобильная версия - Full Viewport Hero */}
        <div className="lg:hidden w-full md:h-auto md:min-h-0 flex flex-col relative z-10">
          {/* Action-Oriented Hero */}
          <div className="flex flex-col items-center px-4 relative hero-mobile-content">
            {/* Фон с логотипом для мобильной версии */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10 hero-mobile-logo"
              style={{
                backgroundImage: 'url(/logomain.png)',
                backgroundSize: 'contain',
                backgroundPosition: 'center top',
                backgroundRepeat: 'no-repeat',
              }}
            />
            
            {/* Абстрактный эмоциональный фон - мягкое пятно с градиентом */}
            <div 
              className="absolute inset-0 pointer-events-none"
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
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: '260px 260px'
              }}
            />

            {/* Контент - вертикально центрирован с ограничением ширины */}
            <div className="relative z-10 w-full max-w-[680px] mx-auto flex flex-col items-center px-4">
              {/* Заголовок - такой же как на desktop */}
              <motion.h1
                className="text-3xl sm:text-4xl font-semibold text-heading text-center leading-tight mb-4"
                style={{ textWrap: 'balance' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              >
                <span className="block">Характер — это система.</span>
                <span className="block">Когда понимаешь систему, начинаешь управлять.</span>
              </motion.h1>

              {/* Описание - такое же как на desktop */}
              <motion.p
                className="text-base sm:text-lg text-muted text-center leading-relaxed mb-8 max-w-[560px]"
                style={{ textWrap: 'balance' }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              >
                Навигационная система для понимания мышления, решений и поведения в реальной жизни.
              </motion.p>

              {/* Primary CTA - две кнопки */}
              <motion.div
                className="w-full flex flex-col gap-4 hero-cta-container"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              >
                <div className="flex flex-col w-full hero-primary-buttons">
                  <div className="flex gap-2 w-full hero-buttons-row">
                    <button 
                      className="btn btn-primary w-full px-4 py-3 text-center text-sm font-semibold rounded-lg transition-all duration-300 min-h-[44px] shadow-md hover:shadow-lg hero-primary-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartFree();
                      }}
                    >
                      Начать с первичного понимания
                    </button>
                  </div>
                  <span className="text-xs text-muted mt-1.5 text-center hero-free-label">Бесплатно</span>
                </div>
                
                <div className="flex flex-col w-full hero-secondary-buttons">
                  <button 
                    className="btn btn-ghost px-4 py-3 text-center text-sm font-semibold rounded-lg transition-all duration-300 w-full min-h-[44px] hero-ghost-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onScrollToFormats();
                    }}
                  >
                   Уровни навигации
                  </button>
                  <span className="text-xs text-muted mt-1.5 text-center hero-format-label">Выбери формат, который подходит под твою задачу</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Desktop версия */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start w-full container-balanced relative z-10 pt-4 lg:pt-6">
          {/* Решение */}
          <div className="w-full">
            <div className="relative w-full">
              <div className="grid lg:grid-cols-2 items-center gap-8 w-full">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4">
                    <span className="block">Характер — это система.</span>
                    <span className="block">Когда понимаешь систему, начинаешь управлять.</span>
                  </h1>
                  <p className="mt-4 text-muted text-lg mb-6">
                    Навигационная система для понимания мышления, решений и поведения в реальной жизни.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col">
                      <button 
                        className="btn btn-primary px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" 
                        onClick={onStartFree}
                      >
                        Начать с первичного понимания
                      </button>
                      <span className="text-sm text-muted mt-1 text-center">Бесплатно</span>
                    </div>
                    <div className="flex flex-col">
                      <button 
                        className="btn btn-ghost px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" 
                        onClick={onScrollToFormats}
                      >
                        Уровни навигации
                      </button>
                      <span className="text-sm text-muted mt-1 text-center">Выбери формат, который подходит под твою задачу</span>
                    </div>
                  </div>
                </motion.div>
                <div className="flex items-center justify-center relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <div className="rounded-2xl overflow-visible flex items-center justify-center">
                      <img 
                        src="/LOGO W TEXT AND BG HERO.png" 
                        alt="Логотип PROFILEVELUP" 
                        className="w-[91%] h-[91%] max-w-[520px] max-h-[520px] object-contain" 
                        loading="lazy" 
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
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

