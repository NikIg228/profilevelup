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

  // Обработчики взаимодействия пользователя
  const handleInteraction = useCallback(() => {
    pause();
  }, [pause]);

  // Обработка событий Swiper для паузы при взаимодействии
  useEffect(() => {
    if (!swiperRef.current) return;

    const swiper = swiperRef.current;

    const handleTouchStart = () => {
      handleInteraction();
    };

    const handleTouchMove = () => {
      handleInteraction();
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
    
    // Обработка кликов по пагинации
    const paginationEl = swiper.pagination?.el;
    if (paginationEl) {
      paginationEl.addEventListener('click', handlePaginationClick);
    }

    // Обработка drag/swipe
    swiper.on('sliderMove', handleInteraction);

    return () => {
      swiper.off('touchStart', handleTouchStart);
      swiper.off('touchMove', handleTouchMove);
      swiper.off('slideChange', handleSlideChange);
      swiper.off('sliderMove', handleInteraction);
      if (paginationEl) {
        paginationEl.removeEventListener('click', handlePaginationClick);
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

