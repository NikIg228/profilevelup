/**
 * Утилита для динамического обновления CSS переменной --header-h
 * Использует ResizeObserver для отслеживания изменений высоты header
 * и обновления при повороте экрана или изменении размеров
 */

export function initHeaderHeightObserver() {
  if (typeof window === 'undefined') return;

  try {
    // Функция для поиска header с несколькими попытками
    const findHeader = (): HTMLElement | null => {
      // Приоритетный порядок поиска
      return document.querySelector('header[data-site-header]') as HTMLElement ||
             document.querySelector('#site-header') as HTMLElement ||
             document.querySelector('header.header-base') as HTMLElement ||
             document.querySelector('header') as HTMLElement ||
             null;
    };

    // Функция для поиска и инициализации header с несколькими попытками
    const findAndInitHeader = (attempt: number = 0) => {
      const maxAttempts = 5; // Максимум 5 попыток
      const header = findHeader();
      
      if (!header) {
        if (attempt < maxAttempts) {
          // Пробуем еще раз через requestAnimationFrame
          requestAnimationFrame(() => {
            findAndInitHeader(attempt + 1);
          });
        } else {
          // Используем fallback значение если header все еще не найден после всех попыток
          const fallbackHeight = 64; // h-16 = 64px
          document.documentElement.style.setProperty('--header-h', `${fallbackHeight}px`);
          // Не логируем ошибку - это нормально если header еще не отрендерился
        }
        return;
      }
      
      // Нашли header - инициализируем
      initObserverForHeader(header);
    };

    // Внутренняя функция для инициализации observer для найденного header
    const initObserverForHeader = (header: Element) => {
      // Функция для обновления высоты
      const updateHeaderHeight = () => {
        try {
          const height = (header as HTMLElement).offsetHeight;
          document.documentElement.style.setProperty('--header-h', `${height}px`);
        } catch (error) {
          // Игнорируем ошибки при обновлении (может быть связано с расширениями браузера)
          if (import.meta.env.DEV) {
            console.warn('Error updating header height:', error);
          }
        }
      };

      // Инициализация при загрузке
      updateHeaderHeight();

      // Используем ResizeObserver для отслеживания изменений
      let resizeObserver: ResizeObserver | null = null;
      try {
        resizeObserver = new ResizeObserver((entries) => {
          try {
            for (const entry of entries) {
              const height = entry.target.clientHeight;
              document.documentElement.style.setProperty('--header-h', `${height}px`);
            }
          } catch (error) {
            // Игнорируем ошибки в ResizeObserver callback
            if (import.meta.env.DEV) {
              console.warn('Error in ResizeObserver callback:', error);
            }
          }
        });

        resizeObserver.observe(header);
      } catch (error) {
        // Fallback если ResizeObserver не поддерживается
        if (import.meta.env.DEV) {
          console.warn('ResizeObserver not supported, using fallback:', error);
        }
      }

      // Также отслеживаем изменения ориентации экрана
      let orientationTimeout: NodeJS.Timeout | null = null;
      const handleOrientationChange = () => {
        if (orientationTimeout) {
          clearTimeout(orientationTimeout);
        }
        // Небольшая задержка для корректного измерения после поворота
        orientationTimeout = setTimeout(() => {
          try {
            updateHeaderHeight();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn('Error in orientation change handler:', error);
            }
          }
        }, 100);
      };

      window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
      window.addEventListener('resize', updateHeaderHeight, { passive: true });

      // Cleanup функция
      return () => {
        try {
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
          if (orientationTimeout) {
            clearTimeout(orientationTimeout);
          }
          window.removeEventListener('orientationchange', handleOrientationChange);
          window.removeEventListener('resize', updateHeaderHeight);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Error during cleanup:', error);
          }
        }
      };
    };

    // Запускаем поиск header
    findAndInitHeader();
  } catch (error) {
    // Обрабатываем любые неожиданные ошибки
    if (import.meta.env.DEV) {
      console.error('Error initializing header height observer:', error);
    }
    // Используем fallback значение
    const fallbackHeight = 64;
    document.documentElement.style.setProperty('--header-h', `${fallbackHeight}px`);
  }
}
