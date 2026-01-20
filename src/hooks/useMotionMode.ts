import { useState, useEffect, useMemo } from 'react';

export type MotionMode = 'full' | 'lite' | 'reduced';

interface MotionConfig {
  mode: MotionMode;
  duration: number;
  enableSpring: boolean;
  enableScale: boolean;
  enableSlide: boolean;
}

/**
 * Определяет режим анимаций на основе возможностей устройства и настроек пользователя
 * 
 * Режимы:
 * - 'reduced': prefers-reduced-motion: reduce
 * - 'lite': слабые устройства (hardwareConcurrency ≤ 4, deviceMemory ≤ 4)
 * - 'full': нормальные устройства с полными анимациями
 */
export function useMotionMode(): MotionConfig {
  const [mode, setMode] = useState<MotionMode>(() => {
    // Проверяем prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return 'reduced';
      }
    }
    return 'full';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Проверяем prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setMode('reduced');
      } else {
        // Проверяем производительность устройства
        checkDevicePerformance();
      }
    };

    // Проверяем производительность устройства
    const checkDevicePerformance = () => {
      const nav = navigator as any;
      
      // Проверяем hardwareConcurrency
      const cores = nav.hardwareConcurrency || 4;
      
      // Проверяем deviceMemory (если доступно)
      const memory = nav.deviceMemory || 4;
      
      // Если устройство слабое, используем lite режим
      if (cores <= 4 || memory <= 4) {
        setMode('lite');
      } else {
        setMode('full');
      }
    };

    // Инициализируем проверку
    if (!reducedMotionQuery.matches) {
      checkDevicePerformance();
    }

    // Подписываемся на изменения prefers-reduced-motion
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
      return () => {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      };
    } else {
      // Fallback для старых браузеров
      reducedMotionQuery.addListener(handleReducedMotionChange);
      return () => {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
      };
    }
  }, []);

  return useMemo(() => {
    switch (mode) {
      case 'reduced':
        return {
          mode: 'reduced',
          duration: 120,
          enableSpring: false,
          enableScale: false,
          enableSlide: false,
        };
      case 'lite':
        return {
          mode: 'lite',
          duration: 160,
          enableSpring: false,
          enableScale: false,
          enableSlide: true, // Разрешаем легкий slide
        };
      case 'full':
      default:
        return {
          mode: 'full',
          duration: 260,
          enableSpring: true,
          enableScale: true,
          enableSlide: true,
        };
    }
  }, [mode]);
}

