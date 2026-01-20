import { useEffect, useRef, useCallback, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';

interface UseSwiperAutoSliderOptions {
  enabled: boolean;
  intervalMs: number;
  pauseMs: number;
  visibilityThreshold?: number;
  containerRef: React.RefObject<HTMLElement>;
  swiperRef: React.RefObject<SwiperType | null>;
  slideCount: number;
}

export function useSwiperAutoSlider({
  enabled,
  intervalMs,
  pauseMs,
  visibilityThreshold = 0.65,
  containerRef,
  swiperRef,
  slideCount,
}: UseSwiperAutoSliderOptions) {
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const lastInteractionRef = useRef<number>(0);
  
  // Отслеживание вертикального скролла страницы
  const isPageScrollingRef = useRef(false);
  const pageScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const interactionDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Проверка prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        stop();
      } else if (enabled && !isPaused && isVisibleRef.current && !document.hidden) {
        start();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enabled, isPaused]);

  // IntersectionObserver для отслеживания видимости
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= visibilityThreshold;
        isVisibleRef.current = isVisible;

        if (!isVisible) {
          stop();
        } else if (enabled && !isPaused && !reducedMotionRef.current && !document.hidden) {
          start();
        }
      },
      {
        threshold: visibilityThreshold,
        rootMargin: '0px',
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, visibilityThreshold, enabled, isPaused]);

  // Обработка visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (enabled && isVisibleRef.current && !isPaused && !reducedMotionRef.current) {
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isPaused]);

  const start = useCallback(() => {
    if (!enabled || isPaused || !isVisibleRef.current || reducedMotionRef.current || document.hidden) return;
    if (!swiperRef.current?.autoplay) return;

    // Если autoplay уже запущен, не перезапускаем
    if (swiperRef.current.autoplay.running) {
      return;
    }
    
    // Запускаем autoplay
    swiperRef.current.autoplay.start();
  }, [enabled, isPaused, swiperRef]);

  const stop = useCallback(() => {
    if (!swiperRef.current?.autoplay) return;
    swiperRef.current.autoplay.stop();
  }, [swiperRef]);

  const pause = useCallback(() => {
    stop();
    setIsPaused(true);
    lastInteractionRef.current = Date.now();

    // Очищаем предыдущий таймер возобновления
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    // Возобновляем через pauseMs
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      if (enabled && isVisibleRef.current && !reducedMotionRef.current && !document.hidden) {
        start();
      }
    }, pauseMs);
  }, [stop, pauseMs, enabled, start]);

  // Отслеживание вертикального скролла страницы
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimer: NodeJS.Timeout | null = null;

    const handlePageScroll = () => {
      isPageScrollingRef.current = true;
      
      // Очищаем предыдущий таймер
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      // Определяем направление скролла
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // Если скролл значительный (больше 5px), считаем что это вертикальный скролл
      if (scrollDelta > 5) {
        isPageScrollingRef.current = true;
      }
      
      lastScrollY = currentScrollY;
      
      // Сбрасываем флаг через 300ms после остановки скролла
      scrollTimer = setTimeout(() => {
        isPageScrollingRef.current = false;
      }, 300);
    };

    window.addEventListener('scroll', handlePageScroll, { passive: true });
    window.addEventListener('touchmove', handlePageScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handlePageScroll);
      window.removeEventListener('touchmove', handlePageScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, []);

  // Обработчики взаимодействия пользователя с проверкой направления
  const handleInteraction = useCallback((event?: TouchEvent | PointerEvent) => {
    // Если страница скроллится вертикально, игнорируем взаимодействие
    if (isPageScrollingRef.current) {
      return;
    }

    // Если есть событие, проверяем направление движения
    if (event && (event instanceof TouchEvent || event instanceof PointerEvent)) {
      const touch = event instanceof TouchEvent ? event.touches[0] || event.changedTouches[0] : event;
      
      if (touchStartRef.current) {
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        const deltaTime = Date.now() - touchStartRef.current.time;
        
        // Если движение преимущественно вертикальное (вертикальное > горизонтального * 1.5)
        // и движение быстрое (меньше 200ms), это скорее всего случайное касание при скролле
        if (deltaY > deltaX * 1.5 && deltaTime < 200) {
          return; // Игнорируем вертикальные быстрые касания
        }
      }
    }

    // Очищаем предыдущий debounce таймер
    if (interactionDebounceRef.current) {
      clearTimeout(interactionDebounceRef.current);
    }

    // Добавляем небольшую задержку перед паузой (100ms) для фильтрации случайных касаний
    interactionDebounceRef.current = setTimeout(() => {
      pause();
    }, 100);
  }, [pause]);

  // Обработка событий Swiper для паузы при взаимодействии
  useEffect(() => {
    if (!swiperRef.current) return;

    const swiper = swiperRef.current;

    const handleTouchStart = (swiper: SwiperType, event: TouchEvent) => {
      // Сохраняем начальную позицию касания
      if (event.touches && event.touches[0]) {
        touchStartRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchMove = (swiper: SwiperType, event: TouchEvent) => {
      // Проверяем направление движения
      if (touchStartRef.current && event.touches && event.touches[0]) {
        const deltaX = Math.abs(event.touches[0].clientX - touchStartRef.current.x);
        const deltaY = Math.abs(event.touches[0].clientY - touchStartRef.current.y);
        
        // Если движение преимущественно вертикальное, не паузим
        if (deltaY > deltaX * 1.5) {
          return;
        }
      }
      
      handleInteraction(event);
    };

    const handleSlideChange = () => {
      // При программном изменении слайда (не пользователем) не паузим
      // Но если это было взаимодействие пользователя, пауза уже установлена
    };

    const handlePaginationClick = () => {
      handleInteraction();
    };

    // Обработчики Swiper
    swiper.on('touchStart', handleTouchStart);
    swiper.on('touchMove', handleTouchMove);
    swiper.on('slideChange', handleSlideChange);
    
    // Обработка кликов по пагинации (это всегда намеренное действие)
    const paginationEl = swiper.pagination?.el;
    if (paginationEl) {
      paginationEl.addEventListener('click', handlePaginationClick);
    }

    // Обработка drag/swipe (только горизонтальное)
    swiper.on('sliderMove', () => {
      // sliderMove срабатывает только при горизонтальном движении
      handleInteraction();
    });

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    swiper.on('touchEnd', handleTouchEnd);

    return () => {
      swiper.off('touchStart', handleTouchStart);
      swiper.off('touchMove', handleTouchMove);
      swiper.off('touchEnd', handleTouchEnd);
      swiper.off('slideChange', handleSlideChange);
      swiper.off('sliderMove', handleInteraction);
      if (paginationEl) {
        paginationEl.removeEventListener('click', handlePaginationClick);
      }
      if (interactionDebounceRef.current) {
        clearTimeout(interactionDebounceRef.current);
      }
    };
  }, [swiperRef, handleInteraction]);

  // Запуск автопрокрутки при монтировании (если включено)
  useEffect(() => {
    if (enabled && !isPaused && !reducedMotionRef.current) {
      // Небольшая задержка для инициализации Swiper
      const initTimer = setTimeout(() => {
        if (isVisibleRef.current && !document.hidden && swiperRef.current) {
          start();
        }
      }, 500);

      return () => clearTimeout(initTimer);
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, isPaused, start, stop, swiperRef]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stop();
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      if (pageScrollTimeoutRef.current) {
        clearTimeout(pageScrollTimeoutRef.current);
      }
      if (interactionDebounceRef.current) {
        clearTimeout(interactionDebounceRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [stop]);

  return {
    pause,
    resume: start,
    isPaused,
  };
}

