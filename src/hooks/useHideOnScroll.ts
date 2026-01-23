import { useState, useEffect, useRef } from 'react';
import { useLenis } from '../contexts/LenisContext';
import { scrollLockManager } from '../utils/scrollLock';
import { isMobile } from '../utils/device';

interface UseHideOnScrollOptions {
  hideThreshold?: number; // Порог для скрытия (px)
  showThreshold?: number; // Порог для показа (px)
  revealTopOffset?: number; // Минимальная позиция для скрытия (px)
  topLock?: number; // Зона вверху, где header всегда видим (px)
}

interface UseHideOnScrollReturn {
  isHidden: boolean;
  isScrolled: boolean;
}

/**
 * Хук для скрытия/показа header при скролле
 * Работает с Lenis на desktop и нативным скроллом на mobile
 */
export function useHideOnScroll({
  hideThreshold = 16,
  showThreshold = 8,
  revealTopOffset = 64,
  topLock = 8,
}: UseHideOnScrollOptions = {}): UseHideOnScrollReturn {
  const lenis = useLenis();
  
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const lastScrollYRef = useRef(0);
  const scrollDeltaRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);

  // Определяем, используем ли мы Lenis или нативный скролл
  // Выносим за пределы useEffect для правильных зависимостей
  const isMobileDevice = isMobile();
  const useNativeScroll = isMobileDevice || !lenis;

  useEffect(() => {
    // Проверяем, есть ли вообще скролл на странице
    const checkHasScroll = () => {
      return document.documentElement.scrollHeight > window.innerHeight + 10;
    };

    if (!checkHasScroll()) {
      // Если страница короткая и скролла нет, header всегда видим
      setIsHidden(false);
      setIsScrolled(false);
      return;
    }

    // Инициализация начальной позиции скролла
    // Используем единый подход для обоих случаев (Lenis и нативный скролл)
    const getScrollY = (): number => {
      if (useNativeScroll) {
        // Для нативного скролла используем window.scrollY
        const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        // Нормализация для iOS bounce (может быть отрицательным)
        return Math.max(0, y);
      } else if (lenis) {
        // Для Lenis используем его scroll
        return lenis.scroll;
      }
      return 0;
    };

    const initialScrollY = getScrollY();
    lastScrollYRef.current = initialScrollY;
    setIsScrolled(initialScrollY > 16);

    const updateHeaderState = () => {
      // Проверяем блокировку скролла (модалки, меню)
      if (scrollLockManager.isScrollLocked() || document.body.style.overflow === 'hidden') {
        return; // Не обновляем состояние если скролл заблокирован
      }

      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollYRef.current;
      
      // Обновляем накопленную дельту для определения направления
      scrollDeltaRef.current += delta;
      
      // Если изменение слишком маленькое, игнорируем (jitter protection)
      if (Math.abs(delta) < 1) {
        lastScrollYRef.current = currentScrollY;
        return;
      }

      // Обновляем состояние "scrolled" для стиля с фоном
      setIsScrolled(currentScrollY > 16);

      // Если мы в зоне topLock, header всегда видим
      if (currentScrollY <= topLock) {
        setIsHidden(false);
        scrollDeltaRef.current = 0; // Сбрасываем дельту
        lastScrollYRef.current = currentScrollY;
        return;
      }

      // Если позиция меньше revealTopOffset, header всегда видим
      if (currentScrollY < revealTopOffset) {
        setIsHidden(false);
        scrollDeltaRef.current = 0;
        lastScrollYRef.current = currentScrollY;
        return;
      }

      // Определяем направление скролла по накопленной дельте
      if (scrollDeltaRef.current > hideThreshold) {
        // Скролл вниз - скрываем
        setIsHidden(true);
        scrollDeltaRef.current = 0; // Сбрасываем после действия
      } else if (scrollDeltaRef.current < -showThreshold) {
        // Скролл вверх - показываем
        setIsHidden(false);
        scrollDeltaRef.current = 0; // Сбрасываем после действия
      }

      lastScrollYRef.current = currentScrollY;
    };

    const handleScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
      }

      // Отменяем предыдущий rAF если есть
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Используем requestAnimationFrame для оптимизации
      rafIdRef.current = requestAnimationFrame(() => {
        updateHeaderState();
        isScrollingRef.current = false;
        rafIdRef.current = null;
      });
    };

    // Подписка на события скролла
    // Для Lenis используем событие 'scroll', для нативного скролла - window 'scroll'
    let scrollHandler: (() => void) | null = null;
    
    if (useNativeScroll) {
      // Нативный скролл на mobile - используем window scroll event
      // Добавляем также touchmove для лучшей поддержки на мобильных
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('touchmove', handleScroll, { passive: true });
    } else if (lenis) {
      // Lenis на desktop - подписываемся на событие scroll через Lenis API
      scrollHandler = () => {
        handleScroll();
      };
      
      lenis.on('scroll', scrollHandler);
    }
    
    return () => {
      if (useNativeScroll) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchmove', handleScroll);
      } else if (lenis && scrollHandler) {
        lenis.off('scroll', scrollHandler);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [lenis, useNativeScroll, hideThreshold, showThreshold, revealTopOffset, topLock]);

  return {
    isHidden,
    isScrolled,
  };
}

