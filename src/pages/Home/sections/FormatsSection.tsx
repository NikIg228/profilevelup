import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, ChevronRight } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useAutoSlider } from '../../../hooks/useAutoSlider';
import { useIsMobile } from '../hooks/useIsMobile';
import { SLIDE_COUNT, AUTO_SLIDER_INTERVAL_MS, AUTO_SLIDER_PAUSE_MS, AUTO_SLIDER_VISIBILITY_THRESHOLD } from '../home.constants';

interface FormatsSectionProps {
  premiumSlideIndex: number;
  setPremiumSlideIndex: (index: number) => void;
  expandedCard: string | null;
  setExpandedCard: (card: string | null) => void;
  onStartFree: (testType?: string) => void;
  onStartPro: (testType?: string) => void;
}

export default function FormatsSection({
  premiumSlideIndex,
  setPremiumSlideIndex,
  expandedCard,
  setExpandedCard,
  onStartFree,
  onStartPro,
}: FormatsSectionProps) {
  const levelsMobileRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { currentIndex, goToSlide, pause, isPaused } = useAutoSlider({
    enabled: isMobile,
    intervalMs: AUTO_SLIDER_INTERVAL_MS,
    pauseMs: AUTO_SLIDER_PAUSE_MS,
    visibilityThreshold: AUTO_SLIDER_VISIBILITY_THRESHOLD,
    containerRef: levelsMobileRef,
    slideCount: SLIDE_COUNT,
  });

  const handleMobileExtraToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget.closest('.card');
    if (card) {
      card.classList.toggle('is-open');
    }
  };

  return (
    <section id="formats" className="container-balanced pt-2 pb-8 md:pt-6 lg:pt-4 lg:pb-12">
      <div className="relative mb-4 sm:mb-5 lg:mb-6">
        <div className="relative flex flex-col items-center lg:items-start">
          <h2 className="text-2xl sm:text-3xl font-semibold text-heading relative z-10">Уровни навигации</h2>
          <p className="hidden lg:block text-sm sm:text-base text-muted mt-2">От первого понимания — к глубокой работе с собой и отношениями</p>
        </div>
      </div>
      
      {/* Декоративные метки над карточками - Desktop */}
      <div className="hidden lg:grid grid-cols-3 gap-6 mb-3">
        <div className="flex flex-col items-center">
          <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
          <div className="text-sm font-semibold text-primary">Старт</div>
          <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
          <div className="text-sm font-semibold text-primary">Глубина</div>
          <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
          <div className="text-sm font-semibold text-primary">Семья</div>
          <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
        </div>
      </div>
      
      {/* Desktop версия - grid */}
      <div className="levels-desktop hidden lg:grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {/* Первичное понимание */}
        <div 
          id="test-card-free"
          data-tariff="FREE"
          className={`card flex flex-col shadow-md bg-white order-1 transition-all duration-300
          ${expandedCard === 'basic' ? 'shadow-lg bg-base/30' : ''}
          lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:cursor-pointer`}
          onClick={() => onStartFree('Первичное понимание')}
        >
          <div className="hidden lg:flex flex-col h-full justify-between group">
            <div>
              <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/komu/basic.png"
                  alt="Иконка тарифа Basic"
                  className="h-[156px] opacity-90 object-contain"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 relative">
                  <h3 className="text-xl font-semibold text-heading mb-1">Первичное понимание</h3>
                </div>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                  Бесплатно
                </span>
              </div>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Точка входа в систему навигации.<br/>
                Помогает увидеть свой базовый стиль мышления и решений — без ярлыков и оценок.
              </p>
              <div className="mb-4">
                <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                  <li>Понимание, как ты обычно думаешь и принимаешь решения</li>
                  <li>Где твои сильные стороны сейчас</li>
                  <li>В каких форматах тебе легче действовать и развиваться</li>
                  <li>Подходит ли тебе этот формат глубокой навигации</li>
                </ul>
              </div>
              <p className="text-sm text-muted italic mb-8">
                Это не мотивация и не психология.<br/>
                Это первая карта: где ты сейчас и как ты устроен.
              </p>
            </div>
            <div className="mt-auto">
              <button
                className="w-full px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFree('Первичное понимание');
                }}
              >
                 Получить первичное понимание
              </button>
            </div>
          </div>
        </div>

        {/* Персональный разбор */}
        <div 
          id="test-card-extended"
          data-tariff="EXTENDED"
          className={`card flex flex-col border-2 border-primary/20 rounded-2xl shadow-md bg-gradient-to-b from-primary/5 to-white order-2 transition-all duration-300 relative
          ${expandedCard === 'extended' ? 'shadow-lg bg-base/30' : ''}
          lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:hover:border-primary/40 lg:cursor-pointer`}
          onClick={() => onStartPro('Персональный разбор')}
        >
          <div className="hidden lg:flex flex-col h-full justify-between group">
            <div>
              <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/komu/vip.png"
                  alt="Иконка тарифа VIP"
                  className="h-[156px] opacity-90 object-contain"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 relative">
                  <h3 className="text-xl font-semibold text-heading mb-1">Персональный разбор</h3>
                </div>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                  14 990 ₸
                </span>
              </div>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Персональная инструкция к твоему характеру, мышлению и стилю жизни.
              </p>
              <div className="mb-4">
                <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                  <li>Как ты думаешь, выбираешь и реагируешь</li>
                  <li>Где твоя настоящая сила и где ты теряешь энергию</li>
                  <li>Почему одни среды тебя усиливают, а другие выжигают</li>
                  <li>В каких форматах тебе легче добиваться результата</li>
                  <li>Как выстраивать решения, обучение, работу и отношения под свой стиль</li>
                </ul>
              </div>
              <p className="text-sm text-muted italic mb-8">
                Это не типология и не приговор.<br/>
                Это навигационная система под твою реальную жизнь.
              </p>
            </div>
            <button
              className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                onStartPro('Персональный разбор');
              }}
            >
               Получить персональный разбор
            </button>
          </div>
        </div>

        {/* Семейная навигация */}
        <div 
          id="test-card-premium"
          data-tariff="PREMIUM"
          className={`card flex flex-col rounded-2xl shadow-xl bg-card-recommend order-3 transition-all duration-300 relative
          ${expandedCard === 'premium' ? 'shadow-lg' : ''}
          lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-2xl lg:hover:-translate-y-1 lg:cursor-pointer lg:border-2 lg:border-primary lg:hover:border-primary-hover`}
          onClick={() => onStartPro('Семейная навигация')}
        >
          <div className="lg:hidden absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1.5 rounded-lg shadow-md z-10">
            <p className="text-xs font-semibold whitespace-nowrap">Для родителей</p>
          </div>
          
          <div className="hidden lg:flex flex-col h-full justify-between group">
            <div>
              <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/komu/PREMIUM .png"
                  alt="Иконка тарифа Premium"
                  className="h-[156px] opacity-90 object-contain"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 relative">
                  <h3 className="text-xl font-semibold text-heading mb-1">Семейная навигация</h3>
                </div>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                  34 990 ₸
                </span>
              </div>
              
              <p className="text-sm text-muted mb-4 leading-relaxed italic">
                Чтобы подросток понял себя, а родитель — понял своего ребёнка
              </p>

              <div className="mt-4">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPremiumSlideIndex(0);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      premiumSlideIndex === 0
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-primary/10 text-heading hover:bg-primary/20'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Подросток
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPremiumSlideIndex(1);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      premiumSlideIndex === 1
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-primary/10 text-heading hover:bg-primary/20'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Родитель
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-lg">
                  <motion.div
                    className="flex"
                    animate={{ x: `-${premiumSlideIndex * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="min-w-full bg-primary/5 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Что получает подросток
                      </h4>
                      <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                        <li>Понимание своего характера, сильных сторон и особенностей</li>
                        <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                        <li>Как он думает, принимает решения и реагирует на давление</li>
                        <li>Навигационный компас вместо оценок и ярлыков</li>
                      </ul>
                    </div>

                    <div className="min-w-full bg-primary/5 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary" />
                        Что получает родитель
                      </h4>
                      <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                        <li>Персональную карту психологии ребёнка</li>
                        <li>Как ребёнок думает, чувствует и воспринимает мир</li>
                        <li>Как с ним лучше общаться без конфликтов</li>
                        <li>Какие слова поддерживают, а какие вызывают сопротивление</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              <p className="text-sm text-muted mt-4 italic mb-8">
                Это не про «воспитание».<br/>
                Это про язык понимания.
              </p>
            </div>
            <button
              className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                onStartPro('Семейная навигация');
              }}
            >
               Начать семейную навигацию
            </button>
          </div>
        </div>
      </div>

      {/* Mobile версия - CSS Scroll Snap */}
      <div ref={levelsMobileRef} className="levels-mobile lg:hidden w-full">
        <div className="levels-mobile-scroll">
          {/* Карточка 1: Первичное понимание */}
          <div className="level-card-snap">
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
              <div className="text-sm font-semibold text-primary">Старт</div>
              <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
            </div>
            <div 
              id="test-card-free-mobile"
              data-tariff="FREE"
              className="level-card-mobile bg-white rounded-2xl shadow-md p-6 flex flex-col h-full w-full cursor-pointer"
              onClick={() => onStartFree('Первичное понимание')}
            >
              <div className="flex justify-center mb-4">
                <img
                  src="/komu/basic.png"
                  alt="Иконка тарифа Basic"
                  className="h-32 opacity-90 object-contain"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-xl font-semibold text-heading flex-1">Первичное понимание</h3>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                  Бесплатно
                </span>
              </div>
              
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Точка входа в систему навигации.<br/>
                Помогает увидеть свой базовый стиль мышления и решений — без ярлыков и оценок.
              </p>
              
              <div className="mb-4 flex-1">
                <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                  <li>Понимание, как ты обычно думаешь и принимаешь решения</li>
                  <li>Где твои сильные стороны сейчас</li>
                  <li>В каких форматах тебе легче действовать и развиваться</li>
                  <li>Подходит ли тебе этот формат глубокой навигации</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted italic mb-4">
                Это не мотивация и не психология.<br/>
                Это первая карта: где ты сейчас и как ты устроен.
              </p>
              
              <button
                className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFree('Первичное понимание');
                }}
              >
                 Получить первичное понимание
              </button>
            </div>
          </div>

          {/* Карточка 2: Персональный разбор */}
          <div className="level-card-snap">
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
              <div className="text-sm font-semibold text-primary">Глубина</div>
              <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
            </div>
            <div 
              id="test-card-extended-mobile"
              data-tariff="EXTENDED"
              className="level-card-mobile bg-white rounded-2xl shadow-md border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-white p-6 flex flex-col h-full w-full cursor-pointer"
              onClick={() => onStartPro('Персональный разбор')}
            >
              <div className="flex justify-center mb-4">
                <img
                  src="/komu/vip.png"
                  alt="Иконка тарифа VIP"
                  className="h-32 opacity-90 object-contain"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-xl font-semibold text-heading flex-1">Персональный разбор</h3>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                  14 990 ₸
                </span>
              </div>
              
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Персональная инструкция к твоему характеру, мышлению и стилю жизни.
              </p>
              
              <div className="mb-4 flex-1">
                <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                  <li>Как ты думаешь, выбираешь и реагируешь</li>
                  <li>Где твоя настоящая сила и где ты теряешь энергию</li>
                  <li>Почему одни среды тебя усиливают, а другие выжигают</li>
                  <li>В каких форматах тебе легче добиваться результата</li>
                  <li>Как выстраивать решения, обучение, работу и отношения под свой стиль</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted italic mb-4">
                Это не типология и не приговор.<br/>
                Это навигационная система под твою реальную жизнь.
              </p>
              
              <button
                className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartPro('Персональный разбор');
                }}
              >
                 Получить персональный разбор
              </button>
            </div>
          </div>

          {/* Карточка 3: Семейная навигация */}
          <div className="level-card-snap">
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
              <div className="text-sm font-semibold text-primary">Семья</div>
              <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
            </div>
            <div 
              id="test-card-premium-mobile"
              data-tariff="PREMIUM"
              className="level-card-mobile bg-white rounded-2xl shadow-xl bg-card-recommend p-6 flex flex-col h-full relative border-2 border-primary w-full cursor-pointer"
              onClick={() => onStartPro('Семейная навигация')}
            >
              <div className="flex justify-center mb-4">
                <img
                  src="/komu/PREMIUM .png"
                  alt="Иконка тарифа Premium"
                  className="h-32 opacity-90 object-contain"
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-xl font-semibold text-heading flex-1">Семейная навигация</h3>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                  34 990 ₸
                </span>
              </div>
              
              <p className="text-sm text-muted mb-4 leading-relaxed italic">
                Чтобы подросток понял себя, а родитель — понял своего ребёнка
              </p>
              
              <div className="mb-6 flex-1">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPremiumSlideIndex(0);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      premiumSlideIndex === 0
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-primary/10 text-heading hover:bg-primary/20'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Подросток
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPremiumSlideIndex(1);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      premiumSlideIndex === 1
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-primary/10 text-heading hover:bg-primary/20'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Родитель
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-lg">
                  <motion.div
                    className="flex"
                    animate={{ x: `-${premiumSlideIndex * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="min-w-full bg-primary/5 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Что получает подросток
                      </h4>
                      <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                        <li>Понимание своего характера, сильных сторон и особенностей</li>
                        <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                        <li>Как он думает, принимает решения и реагирует на давление</li>
                        <li>Навигационный компас вместо оценок и ярлыков</li>
                      </ul>
                    </div>

                    <div className="min-w-full bg-primary/5 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary" />
                        Что получает родитель
                      </h4>
                      <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                        <li>Персональную карту психологии ребёнка</li>
                        <li>Как ребёнок думает, чувствует и воспринимает мир</li>
                        <li>Как с ним лучше общаться без конфликтов</li>
                        <li>Какие слова поддерживают, а какие вызывают сопротивление</li>
                        <li>Как быть опорой, а не источником давления</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              <p className="text-sm text-muted italic mb-4">
                Это не про «воспитание».<br/>
                Это про язык понимания.
              </p>
              
              <button
                className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartPro('Семейная навигация');
                }}
              >
                 Начать семейную навигацию
              </button>
            </div>
          </div>
        </div>
        
        {/* Пагинация для мобильной версии */}
        <div className="levels-pagination">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index);
                pause();
              }}
              className={`levels-pagination-bullet ${
                currentIndex === index ? 'levels-pagination-bullet-active' : ''
              } ${isPaused && currentIndex === index ? 'paused' : ''}`}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

