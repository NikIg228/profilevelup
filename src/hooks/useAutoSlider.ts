import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSliderOptions {
  enabled: boolean;
  intervalMs: number;
  pauseMs: number;
  visibilityThreshold?: number;
  containerRef: React.RefObject<HTMLElement>;
  slideCount: number;
  onSlideChange?: (index: number) => void;
}

export function useAutoSlider({
  enabled,
  intervalMs,
  pauseMs,
  visibilityThreshold = 0.65,
  containerRef,
  slideCount,
  onSlideChange,
}: UseAutoSliderOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(true);
  const reducedMotionRef = useRef(false);

  // Проверка prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;

    const handleChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        stop();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
        } else if (enabled && !isPaused && !reducedMotionRef.current) {
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

  const scrollToSlide = useCallback(
    (index: number, smooth = true) => {
      if (!containerRef.current) return;

      const scrollContainer = containerRef.current.querySelector('.levels-mobile-scroll') as HTMLElement;
      if (!scrollContainer) return;

      const slides = scrollContainer.querySelectorAll('.level-card-snap');
      if (slides.length === 0) return;

      const targetIndex = index % slideCount;
      const targetSlide = slides[targetIndex] as HTMLElement;
      if (!targetSlide) return;

      const scrollLeft = targetSlide.offsetLeft - scrollContainer.offsetLeft;
      
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: smooth ? 'smooth' : 'auto',
      });

      setCurrentIndex(targetIndex);
      onSlideChange?.(targetIndex);
    },
    [containerRef, slideCount, onSlideChange]
  );

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = (prev + 1) % slideCount;
      scrollToSlide(next);
      return next;
    });
  }, [slideCount, scrollToSlide]);

  const start = useCallback(() => {
    if (!enabled || isPaused || !isVisibleRef.current || reducedMotionRef.current) return;
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (!isVisibleRef.current || document.hidden) {
        stop();
        return;
      }
      nextSlide();
    }, intervalMs);
  }, [enabled, isPaused, intervalMs, nextSlide]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
      if (enabled && isVisibleRef.current && !reducedMotionRef.current) {
        start();
      }
    }, pauseMs);
  }, [stop, pauseMs, enabled, start]);

  // Обработчики взаимодействия пользователя
  const handleInteraction = useCallback(() => {
    pause();
  }, [pause]);

  // Обработка скролла (для определения когда пользователь скроллит вручную)
  useEffect(() => {
    if (!containerRef.current) return;

    const scrollContainer = containerRef.current.querySelector('.levels-mobile-scroll') as HTMLElement;
    if (!scrollContainer) return;

    let scrollStartTime = 0;
    let scrollEndTimer: NodeJS.Timeout | null = null;

    const handleScrollStart = () => {
      isScrollingRef.current = true;
      scrollStartTime = Date.now();
      handleInteraction();
    };

    const handleScroll = () => {
      if (isScrollingRef.current) {
        handleInteraction();
      }

      // Очищаем предыдущий таймер
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
      }

      // Определяем конец скролла
      scrollEndTimer = setTimeout(() => {
        isScrollingRef.current = false;
        
        // Обновляем currentIndex на основе текущей позиции скролла
        const slides = scrollContainer.querySelectorAll('.level-card-snap');
        if (slides.length === 0) return;

        const scrollLeft = scrollContainer.scrollLeft;
        const containerWidth = scrollContainer.offsetWidth;
        
        let closestIndex = 0;
        let minDistance = Infinity;

        slides.forEach((slide, index) => {
          const slideElement = slide as HTMLElement;
          const slideLeft = slideElement.offsetLeft - scrollContainer.offsetLeft;
          const slideCenter = slideLeft + slideElement.offsetWidth / 2;
          const distance = Math.abs(scrollLeft + containerWidth / 2 - slideCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        setCurrentIndex(closestIndex);
      }, 150);
    };

    // Touch события
    scrollContainer.addEventListener('touchstart', handleScrollStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleScroll, { passive: true });
    scrollContainer.addEventListener('touchend', handleScroll, { passive: true });

    // Pointer события
    scrollContainer.addEventListener('pointerdown', handleScrollStart, { passive: true });
    scrollContainer.addEventListener('pointermove', handleScroll, { passive: true });
    scrollContainer.addEventListener('pointerup', handleScroll, { passive: true });

    // Mouse события (для тестирования)
    scrollContainer.addEventListener('mousedown', handleScrollStart);
    scrollContainer.addEventListener('mousemove', handleScroll);
    scrollContainer.addEventListener('mouseup', handleScroll);

    // Scroll событие
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleScrollStart);
      scrollContainer.removeEventListener('touchmove', handleScroll);
      scrollContainer.removeEventListener('touchend', handleScroll);
      scrollContainer.removeEventListener('pointerdown', handleScrollStart);
      scrollContainer.removeEventListener('pointermove', handleScroll);
      scrollContainer.removeEventListener('pointerup', handleScroll);
      scrollContainer.removeEventListener('mousedown', handleScrollStart);
      scrollContainer.removeEventListener('mousemove', handleScroll);
      scrollContainer.removeEventListener('mouseup', handleScroll);
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
      }
    };
  }, [containerRef, handleInteraction]);

  // Запуск автопрокрутки при монтировании (если включено)
  useEffect(() => {
    if (enabled && !isPaused && !reducedMotionRef.current) {
      // Небольшая задержка для инициализации
      const initTimer = setTimeout(() => {
        if (isVisibleRef.current && !document.hidden) {
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
  }, [enabled, isPaused, start, stop]);

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
    currentIndex,
    goToSlide: scrollToSlide,
    pause,
    resume: start,
    isPaused,
    setCurrentIndex,
  };
}

