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
  
  // Отслеживание вертикального скролла страницы
  const isPageScrollingRef = useRef(false);
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
  const handleInteraction = useCallback((event?: TouchEvent | PointerEvent | MouseEvent) => {
    // Если страница скроллится вертикально, игнорируем взаимодействие
    if (isPageScrollingRef.current) {
      return;
    }

    // Если есть событие, проверяем направление движения
    if (event && (event instanceof TouchEvent || event instanceof PointerEvent)) {
      const touch = event instanceof TouchEvent ? (event.touches[0] || event.changedTouches[0]) : event;
      
      if (touchStartRef.current && touch) {
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        const deltaTime = Date.now() - touchStartRef.current.time;
        
        // Если движение преимущественно вертикальное (вертикальное > горизонтальное * 1.5)
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
      // Не паузим при старте, только при движении
    };

    const handleScroll = (e?: TouchEvent | PointerEvent | MouseEvent | Event) => {
      if (isScrollingRef.current) {
        // Проверяем направление скролла контейнера
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        
        // Если скролл преимущественно горизонтальный, паузим
        // Если вертикальный - игнорируем (это случайное касание при скролле страницы)
        if (Math.abs(scrollLeft) > Math.abs(scrollTop) * 1.5 || scrollTop === 0) {
          handleInteraction(e as TouchEvent | PointerEvent | MouseEvent | undefined);
        }
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

    const handleTouchStart = (e: TouchEvent) => {
      // Сохраняем начальную позицию касания
      if (e.touches && e.touches[0]) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      }
      handleScrollStart();
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Проверяем направление движения перед паузой
      if (touchStartRef.current && e.touches && e.touches[0]) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
        
        // Если движение преимущественно вертикальное, не паузим
        if (deltaY > deltaX * 1.5) {
          return;
        }
      }
      handleScroll(e);
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    // Touch события
    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Pointer события
    const handlePointerStart = (e: PointerEvent) => {
      touchStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
      handleScrollStart();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (touchStartRef.current) {
        const deltaX = Math.abs(e.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(e.clientY - touchStartRef.current.y);
        
        if (deltaY > deltaX * 1.5) {
          return;
        }
      }
      handleScroll(e);
    };

    scrollContainer.addEventListener('pointerdown', handlePointerStart, { passive: true });
    scrollContainer.addEventListener('pointermove', handlePointerMove, { passive: true });
    scrollContainer.addEventListener('pointerup', handleTouchEnd, { passive: true });

    // Mouse события (для тестирования)
    scrollContainer.addEventListener('mousedown', handleScrollStart);
    scrollContainer.addEventListener('mousemove', handleScroll);
    scrollContainer.addEventListener('mouseup', handleScroll);

    // Scroll событие
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
      scrollContainer.removeEventListener('pointerdown', handlePointerStart);
      scrollContainer.removeEventListener('pointermove', handlePointerMove);
      scrollContainer.removeEventListener('pointerup', handleTouchEnd);
      scrollContainer.removeEventListener('mousedown', handleScrollStart);
      scrollContainer.removeEventListener('mousemove', handleScroll);
      scrollContainer.removeEventListener('mouseup', handleScroll);
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
      }
      if (interactionDebounceRef.current) {
        clearTimeout(interactionDebounceRef.current);
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

      return () => {
        clearTimeout(initTimer);
        stop(); // Останавливаем при cleanup
      };
    } else {
      stop();
      return undefined; // Явно возвращаем undefined для else ветки
    }
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

