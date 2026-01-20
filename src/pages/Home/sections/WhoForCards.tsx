import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useSwiperAutoSlider } from '../../../hooks/useSwiperAutoSlider';
import { logger } from '../../../utils/logger';
import { useIsMobile } from '../hooks/useIsMobile';
import { WHO_FOR_SLIDE_COUNT, AUTO_SLIDER_INTERVAL_MS, AUTO_SLIDER_PAUSE_MS, AUTO_SLIDER_VISIBILITY_THRESHOLD } from '../home.constants';

export default function WhoForCards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const swiperRef = useRef<SwiperType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Динамический импорт Swiper CSS только на mobile или когда компонент видим
  useEffect(() => {
    if (isMobile && isInView) {
      import('swiper/css');
      import('swiper/css/pagination');
    }
  }, [isMobile, isInView]);
  
  // Используем хук автопрокрутки для мобильной версии
  const { isPaused } = useSwiperAutoSlider({
    enabled: isMobile,
    intervalMs: AUTO_SLIDER_INTERVAL_MS,
    pauseMs: AUTO_SLIDER_PAUSE_MS,
    visibilityThreshold: AUTO_SLIDER_VISIBILITY_THRESHOLD,
    containerRef,
    swiperRef,
    slideCount: WHO_FOR_SLIDE_COUNT,
  });

  // Обновление класса пагинации при паузе и смене слайда
  useEffect(() => {
    if (!swiperRef.current?.pagination?.el) return;

    const updatePagination = () => {
      const paginationEl = swiperRef.current?.pagination?.el;
      if (!paginationEl) return;

      const bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');
      bullets.forEach((bullet) => {
        (bullet as HTMLElement).classList.remove('paused');
      });

      const activeBullet = paginationEl.querySelector('.swiper-pagination-bullet-active') as HTMLElement;
      if (activeBullet) {
        if (isPaused) {
          activeBullet.classList.add('paused');
        } else {
          activeBullet.style.animation = 'none';
          setTimeout(() => {
            activeBullet.style.animation = '';
          }, 10);
        }
      }
    };

    updatePagination();

    const swiper = swiperRef.current;
    if (swiper) {
      swiper.on('slideChangeTransitionEnd', updatePagination);
      return () => {
        swiper.off('slideChangeTransitionEnd', updatePagination);
      };
    }
  }, [isPaused]);

  // Принудительный пересчёт layout при монтировании компонента
  useEffect(() => {
    const updateSwiper = () => {
      if (swiperRef.current) {
        try {
          if (swiperRef.current.el && swiperRef.current.wrapperEl) {
            const elRect = swiperRef.current.el.getBoundingClientRect();
            if (elRect.width > 0) {
              swiperRef.current.update();
              if (swiperRef.current.slides && swiperRef.current.slides.length > 0) {
                swiperRef.current.updateSlides();
                swiperRef.current.updateSlidesClasses();
              }
            }
          }
        } catch (error) {
          logger.warn('Swiper update error:', error);
        }
      }
    };

    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(updateSwiper, 500));
    timers.push(setTimeout(updateSwiper, 1000));

    const handleOrientationChange = () => {
      const timer = setTimeout(updateSwiper, 300);
      timers.push(timer);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return (
    <>
      {/* Desktop версия - grid */}
      <div ref={ref} className="hidden md:grid mt-6 grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Ученикам старших классов */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
        >
          <div className="flex items-start justify-center h-[180px] mb-3 sm:mb-4 relative">
            <img
              src="/komu/okushylar.png"
              alt="Иллюстрация для учеников старших классов"
              className="h-[180px] w-auto object-contain object-top"
              loading="lazy"
            />
            <Sparkles className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-blue-400/60" />
            <Sparkles className="absolute top-2 left-1 sm:top-4 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-blue-300/50" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Ученикам старших классов</h3>
          
          <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
            Ты стоишь на этапе, где закладывается твоя будущая траектория.
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            Ошибки здесь стоят дорого, а правильные решения дают преимущество на годы вперёд.
          </p>
          
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает:</p>
            <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
              <li>понять, как ты думаешь и принимаешь решения</li>
              <li>увидеть свои реальные сильные стороны, а не оценки в дневнике</li>
              <li>выбрать направление, где ты будешь расти быстрее других</li>
              <li>не идти «куда все», а строить собственную стратегию</li>
            </ul>
          </div>
          
          <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
            Это не про выбор профессии.<br/>
            Это про выбор правильной траектории.
          </p>
          
          <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
            <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
              <p className="text-xs sm:text-sm text-primary font-medium italic">"Будущее начинается с понимания того, как ты устроен."</p>
            </div>
          </div>
        </motion.div>

        {/* 2. Студентам */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
        >
          <div className="flex items-start justify-center h-[140px] sm:h-[180px] mb-3 sm:mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-emerald-200/30 blur-xl rounded-full w-20 h-20 sm:w-32 sm:h-32 transform translate-x-1 translate-y-1 sm:translate-x-2 sm:translate-y-2"></div>
            </div>
            <img
              src="/komu/students.png"
              alt="Иллюстрация для студентов"
              className="h-[140px] sm:h-[180px] w-auto object-contain object-top relative z-10"
              loading="lazy"
            />
            <Sparkles className="hidden sm:block absolute bottom-2 right-2 w-4 h-4 text-emerald-400/50 z-10" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Студентам</h3>
          
          <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
            Университет — это не путь.
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            Это среда. И каждый в ней раскрывается по-разному.
          </p>
          
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает:</p>
            <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
              <li>понять, в каком формате ты раскрываешься сильнее всего</li>
              <li>выстроить свой карьерный трек, а не плыть по программе</li>
              <li>увидеть, где твои реальные точки роста</li>
              <li>перестать тратить годы на «не своё»</li>
            </ul>
          </div>
          
          <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
            Это не про диплом.<br/>
            Это про капитал мышления и решений.
          </p>
          
          <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
            <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
              <p className="text-xs sm:text-sm text-primary font-medium italic">"Карьера строится не из предметов. Она строится из мышления."</p>
            </div>
          </div>
        </motion.div>

        {/* 3. Родителям подростков */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
        >
          <div className="flex items-start justify-center h-[140px] sm:h-[180px] mb-3 sm:mb-4 relative">
            <img
              src="/komu/parents.png"
              alt="Иллюстрация для родителей"
              className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
              loading="lazy"
            />
            <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-amber-400/50" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Родителям подростков</h3>
          
          <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
            Подростковый возраст — это не кризис.
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            Это этап формирования характера, мышления и будущей траектории.
          </p>
          
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает родителям:</p>
            <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
              <li>понять, как ребёнок думает и принимает решения</li>
              <li>увидеть его реальные сильные стороны</li>
              <li>выстроить язык общения без конфликтов</li>
              <li>создать среду, в которой ребёнок раскрывается, а не ломается</li>
            </ul>
          </div>
          
          <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
            Это не про контроль.<br/>
            Это про настройку системы развития.
          </p>
          
          <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
            <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
              <p className="text-xs sm:text-sm text-primary font-medium italic">"Сильный характер формируется в правильно настроенной среде."</p>
            </div>
          </div>
        </motion.div>

        {/* 4. Взрослым */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
        >
          <div className="flex items-start justify-center h-[140px] sm:h-[180px] mb-3 sm:mb-4 relative">
            <img
              src="/komu/vzroslym.png"
              alt="Иллюстрация для взрослых"
              className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
              loading="lazy"
            />
            <Sparkles className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-primary/40" />
            <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-primary/30" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Взрослым</h3>
          
          <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
            Взрослая жизнь — это не про «найти себя».
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            Это про управление своей траекторией.
          </p>
          
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает:</p>
            <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
              <li>понять, где твоя энергия естественна</li>
              <li>увидеть, почему ты упираешься в потолок</li>
              <li>перестроить карьеру без хаоса и резких шагов</li>
              <li>вернуть ощущение контроля над своей жизнью</li>
            </ul>
          </div>
          
          <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
            Это не про мотивацию.<br/>
            Это про стратегию.
          </p>
          
          <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
            <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
              <p className="text-xs sm:text-sm text-primary font-medium italic">"Когда понимаешь, как устроена твоя система — начинаешь управлять."</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile версия - Swiper с авто-свайпом */}
      <div className="md:hidden mt-6" ref={containerRef}>
        <Swiper
          className="whofor-swiper !pb-12"
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet !bg-primary/30 !w-2 !h-2 !rounded-full',
            bulletActiveClass: 'swiper-pagination-bullet-active !bg-primary !w-6',
          }}
          touchEventsTarget="container"
          allowTouchMove={true}
          simulateTouch={true}
          touchRatio={1}
          touchAngle={15}
          threshold={10}
          longSwipesRatio={0.5}
          longSwipesMs={300}
          resistance={true}
          resistanceRatio={0.85}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onInit={(swiper) => {
            setTimeout(() => {
              try {
                if (swiper && swiper.el && swiper.wrapperEl) {
                  const elRect = swiper.el.getBoundingClientRect();
                  if (elRect.width > 0) {
                    swiper.update();
                    if (swiper.slides && swiper.slides.length > 0) {
                      swiper.updateSlides();
                      swiper.updateSlidesClasses();
                    }
                  }
                }
              } catch (error) {
                logger.warn('Swiper init update error:', error);
              }
            }, 300);
          }}
          style={{ touchAction: 'pan-y pan-x' }}
          direction="horizontal"
        >
          {/* Карточка 1: Ученикам старших классов */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              <div className="flex items-start justify-center h-[180px] mb-3 relative">
                <img
                  src="/komu/okushylar.png"
                  alt="Иллюстрация для учеников старших классов"
                  className="h-[180px] w-auto object-contain object-top"
                  loading="lazy"
                />
                <Sparkles className="absolute top-1 right-1 w-4 h-4 text-blue-400/60" />
                <Sparkles className="absolute top-2 left-1 w-3 h-3 text-blue-300/50" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Ученикам старших классов</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Ты стоишь на этапе, где закладывается твоя будущая траектория.
                <br />
                <br />
                Ошибки здесь стоят дорого, а правильные решения дают преимущество на годы вперёд.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, как ты думаешь и принимаешь решения</li>
                  <li>увидеть свои реальные сильные стороны, а не оценки в дневнике</li>
                  <li>выбрать направление, где ты будешь расти быстрее других</li>
                  <li>не идти «куда все», а строить собственную стратегию</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про выбор профессии.<br/>
                Это про выбор правильной траектории.
              </p>
              
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Будущее начинается с понимания того, как ты устроен."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>

          {/* Карточка 2: Студентам */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              <div className="flex items-start justify-center h-[140px] mb-3 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-emerald-200/30 blur-xl rounded-full w-20 h-20 transform translate-x-1 translate-y-1"></div>
                </div>
                <img
                  src="/komu/students.png"
                  alt="Иллюстрация для студентов"
                  className="h-[140px] w-auto object-contain object-top relative z-10"
                  loading="lazy"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Студентам</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Университет — это не путь.
                <br />
                <br />
                Это среда. И каждый в ней раскрывается по-разному.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, в каком формате ты раскрываешься сильнее всего</li>
                  <li>выстроить свой карьерный трек, а не плыть по программе</li>
                  <li>увидеть, где твои реальные точки роста</li>
                  <li>перестать тратить годы на «не своё»</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про диплом.<br/>
                Это про капитал мышления и решений.
              </p>
              
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Карьера строится не из предметов. Она строится из мышления."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>

          {/* Карточка 3: Родителям подростков */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              <div className="flex items-start justify-center h-[140px] mb-3 relative">
                <img
                  src="/komu/parents.png"
                  alt="Иллюстрация для родителей"
                  className="h-[140px] w-auto object-contain object-top"
                  loading="lazy"
                />
                <Sparkles className="absolute top-1 left-1 w-3 h-3 text-amber-400/50" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Родителям подростков</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Подростковый возраст — это не кризис.
                <br />
                <br />
                Это этап формирования характера, мышления и будущей траектории.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает родителям:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, как ребёнок думает и принимает решения</li>
                  <li>увидеть его реальные сильные стороны</li>
                  <li>выстроить язык общения без конфликтов</li>
                  <li>создать среду, в которой ребёнок раскрывается, а не ломается</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про контроль.<br/>
                Это про настройку системы развития.
              </p>
              
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Сильный характер формируется в правильно настроенной среде."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>

          {/* Карточка 4: Взрослым */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              <div className="flex items-start justify-center h-[140px] mb-3 relative">
                <img
                  src="/komu/vzroslym.png"
                  alt="Иллюстрация для взрослых"
                  className="h-[140px] w-auto object-contain object-top"
                  loading="lazy"
                />
                <Sparkles className="absolute bottom-1 right-1 w-4 h-4 text-primary/40" />
                <Sparkles className="absolute top-1 left-1 w-3 h-3 text-primary/30" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Взрослым</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Взрослая жизнь — это не про «найти себя».
                <br />
                <br />
                Это про управление своей траекторией.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, где твоя энергия естественна</li>
                  <li>увидеть, почему ты упираешься в потолок</li>
                  <li>перестроить карьеру без хаоса и резких шагов</li>
                  <li>вернуть ощущение контроля над своей жизнью</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про мотивацию.<br/>
                Это про стратегию.
              </p>
              
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Когда понимаешь, как устроена твоя система — начинаешь управлять."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        </Swiper>
      </div>
    </>
  );
}

