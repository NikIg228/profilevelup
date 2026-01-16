/**
 * Утилиты для определения типа устройства
 * Улучшенная версия с обработчиком resize
 */

let cachedIsMobile: boolean | null = null;
let cachedIsTablet: boolean | null = null;
let cachedIsDesktop: boolean | null = null;

const updateDeviceCache = () => {
  if (typeof window === 'undefined') return;
  
  const width = window.innerWidth;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Мобильные: ширина < 768px ИЛИ (touch устройство И ширина < 1024px)
  cachedIsMobile = width < 768 || (hasTouch && width < 1024);
  
  // Планшеты: ширина 768-1023px И touch устройство
  cachedIsTablet = width >= 768 && width < 1024 && hasTouch;
  
  // Desktop: ширина >= 1024px ИЛИ (не touch И ширина >= 768px)
  cachedIsDesktop = width >= 1024 || (!hasTouch && width >= 768);
};

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  updateDeviceCache();
  
  // Обработчик resize с debounce
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateDeviceCache();
      // Уведомляем о изменении размера (для компонентов, которые подписаны)
      window.dispatchEvent(new CustomEvent('devicechange'));
    }, 150);
  });
  
  // Обработчик изменения ориентации
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      updateDeviceCache();
      window.dispatchEvent(new CustomEvent('devicechange'));
    }, 100);
  });
}

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (cachedIsMobile === null) updateDeviceCache();
  return cachedIsMobile ?? false;
};

export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (cachedIsTablet === null) updateDeviceCache();
  return cachedIsTablet ?? false;
};

export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (cachedIsDesktop === null) updateDeviceCache();
  return cachedIsDesktop ?? false;
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

