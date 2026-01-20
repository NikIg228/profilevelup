import { useState, useEffect, useRef } from 'react';

/**
 * Хук для определения мобильного устройства с throttling
 * Предотвращает лишние ререндеры на каждом пикселе изменения размера окна
 */
export function useIsMobile(breakpoint: number = 1023): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      
      // Пропускаем изменения меньше 50px для уменьшения ререндеров
      if (Math.abs(currentWidth - lastWidth) < 50) return;
      
      lastWidth = currentWidth;

      // Отменяем предыдущий запланированный обновление
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      // Используем requestAnimationFrame + setTimeout для throttling
      rafRef.current = requestAnimationFrame(() => {
        timeoutRef.current = setTimeout(() => {
          setIsMobile(currentWidth <= breakpoint);
        }, 100);
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [breakpoint]);

  return isMobile;
}

