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

// Обработчики событий и таймеры
let resizeTimeout: NodeJS.Timeout | null = null;
let orientationTimeout: NodeJS.Timeout | null = null;
let resizeHandler: (() => void) | null = null;
let orientationHandler: (() => void) | null = null;

// Функция инициализации обработчиков
const initDeviceListeners = () => {
  if (typeof window === 'undefined') return;
  
  // Очистка предыдущих обработчиков, если есть
  cleanupDeviceListeners();
  
  updateDeviceCache();
  
  // Обработчик resize с debounce
  resizeHandler = () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      updateDeviceCache();
      window.dispatchEvent(new CustomEvent('devicechange'));
    }, 150);
  };
  
  // Обработчик изменения ориентации
  orientationHandler = () => {
    if (orientationTimeout) {
      clearTimeout(orientationTimeout);
    }
    orientationTimeout = setTimeout(() => {
      updateDeviceCache();
      window.dispatchEvent(new CustomEvent('devicechange'));
    }, 100);
  };
  
  window.addEventListener('resize', resizeHandler);
  window.addEventListener('orientationchange', orientationHandler);
};

// Функция очистки обработчиков
const cleanupDeviceListeners = () => {
  if (typeof window === 'undefined') return;
  
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
  
  if (orientationTimeout) {
    clearTimeout(orientationTimeout);
    orientationTimeout = null;
  }
  
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  
  if (orientationHandler) {
    window.removeEventListener('orientationchange', orientationHandler);
    orientationHandler = null;
  }
};

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  initDeviceListeners();
  
  // Очистка при выгрузке страницы
  window.addEventListener('beforeunload', cleanupDeviceListeners);
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

