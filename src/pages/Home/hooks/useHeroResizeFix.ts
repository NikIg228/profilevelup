import { useEffect } from 'react';

/**
 * Хук для безопасной обработки resize событий на мобильных устройствах
 * Используется только когда действительно необходимо для корректного пересчёта layout
 * 
 * WHY: На некоторых мобильных устройствах (особенно iOS) после загрузки или изменения
 * ориентации компоненты могут иметь неправильные размеры. Этот хук триггерит
 * пересчёт размеров безопасным способом без рекурсивных вызовов.
 */
export function useHeroResizeFix(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Флаг для предотвращения рекурсии
    let isResizing = false;
    const timers: NodeJS.Timeout[] = [];

    // Безопасный триггер resize - максимум 1-2 раза
    const triggerResize = () => {
      if (isResizing) return;
      isResizing = true;
      
      // Используем requestAnimationFrame для синхронизации с браузером
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        const timer = setTimeout(() => {
          isResizing = false;
        }, 100);
        timers.push(timer);
      });
    };

    // Выполняем после полной загрузки страницы (максимум 2 раза)
    if (document.readyState === 'complete') {
      timers.push(setTimeout(triggerResize, 100));
      timers.push(setTimeout(triggerResize, 300));
    } else {
      const loadHandler = () => {
        timers.push(setTimeout(triggerResize, 100));
        timers.push(setTimeout(triggerResize, 300));
      };
      window.addEventListener('load', loadHandler, { once: true });
    }

    // Обработка изменения ориентации (максимум 2 раза)
    const handleOrientationChange = () => {
      timers.push(setTimeout(triggerResize, 200));
      timers.push(setTimeout(triggerResize, 400));
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      // Очищаем все таймеры
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [enabled]);
}

