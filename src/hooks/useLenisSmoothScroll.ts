import Lenis from '@studio-freight/lenis';
import { useEffect, useState } from 'react';

export function useLenisSmoothScroll() {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 5),
      smoothWheel: true,
      syncTouch: false, // Нативный скролл на touch устройствах
    });

    setLenis(lenisInstance);

    // Убеждаемся, что overflow скрыт для html и body (Lenis управляет скроллом)
    requestAnimationFrame(() => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    });

    // Обработчик событий скролла для отладки
    lenisInstance.on('scroll', (e: any) => {
      // Lenis работает
    });

    let rafId: number;

    function raf(time: number) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []);

  return lenis;
}

