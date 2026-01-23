/**
 * Утилита для динамического обновления CSS переменной --header-h
 * Использует ResizeObserver для отслеживания изменений высоты header
 * и обновления при повороте экрана или изменении размеров
 */

import { logger } from './logger';

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
          // На desktop фиксируем высоту на 64px, так как header статичный
          if (window.innerWidth >= 1024) {
            document.documentElement.style.setProperty('--header-h', '64px');
            return;
          }
          
          // На мобильных используем реальную высоту
          const height = (header as HTMLElement).getBoundingClientRect().height;
          document.documentElement.style.setProperty('--header-h', `${height}px`);
        } catch (error) {
          // Игнорируем ошибки при обновлении (может быть связано с расширениями браузера)
          logger.warn('Error updating header height:', error);
        }
      };

      // Инициализация при загрузке
      updateHeaderHeight();

      // Используем ResizeObserver для отслеживания изменений (только на мобильных)
      let resizeObserver: ResizeObserver | null = null;
      try {
        // На desktop не нужен ResizeObserver, так как высота фиксирована
        if (window.innerWidth >= 1024) {
          updateHeaderHeight(); // Устанавливаем фиксированное значение
          return; // Не создаем observer для desktop
        }

        resizeObserver = new ResizeObserver((entries) => {
          try {
            // На desktop фиксируем высоту
            if (window.innerWidth >= 1024) {
              document.documentElement.style.setProperty('--header-h', '64px');
              return;
            }
            
            // На мобильных используем реальную высоту
            for (const entry of entries) {
              const height = entry.target.getBoundingClientRect().height;
              document.documentElement.style.setProperty('--header-h', `${height}px`);
            }
          } catch (error) {
            // Игнорируем ошибки в ResizeObserver callback
            logger.warn('Error in ResizeObserver callback:', error);
          }
        });

        resizeObserver.observe(header);
      } catch (error) {
        // Fallback если ResizeObserver не поддерживается
        logger.warn('ResizeObserver not supported, using fallback:', error);
      }

      // Также отслеживаем изменения ориентации экрана и размера окна
      let orientationTimeout: NodeJS.Timeout | null = null;
      const handleOrientationChange = () => {
        if (orientationTimeout) {
          clearTimeout(orientationTimeout);
        }
        // Небольшая задержка для корректного измерения после поворота
        orientationTimeout = setTimeout(() => {
          try {
            updateHeaderHeight();
            // Если переключились на desktop - отключаем ResizeObserver
            if (window.innerWidth >= 1024 && resizeObserver) {
              resizeObserver.disconnect();
              resizeObserver = null;
            }
            // Если переключились на mobile - создаем ResizeObserver если его нет
            else if (window.innerWidth < 1024 && !resizeObserver) {
              try {
                resizeObserver = new ResizeObserver((entries) => {
                  try {
                    if (window.innerWidth >= 1024) {
                      document.documentElement.style.setProperty('--header-h', '64px');
                      return;
                    }
                    for (const entry of entries) {
                      const height = entry.target.getBoundingClientRect().height;
                      document.documentElement.style.setProperty('--header-h', `${height}px`);
                    }
                  } catch (error) {
                    logger.warn('Error in ResizeObserver callback:', error);
                  }
                });
                resizeObserver.observe(header);
              } catch (error) {
                logger.warn('ResizeObserver not supported:', error);
              }
            }
          } catch (error) {
            logger.warn('Error in orientation change handler:', error);
          }
        }, 100);
      };

      const handleResize = () => {
        updateHeaderHeight();
        // Проверяем, нужно ли переключить ResizeObserver
        if (window.innerWidth >= 1024 && resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        } else if (window.innerWidth < 1024 && !resizeObserver) {
          try {
            resizeObserver = new ResizeObserver((entries) => {
              try {
                if (window.innerWidth >= 1024) {
                  document.documentElement.style.setProperty('--header-h', '64px');
                  return;
                }
                for (const entry of entries) {
                  const height = entry.target.getBoundingClientRect().height;
                  document.documentElement.style.setProperty('--header-h', `${height}px`);
                }
              } catch (error) {
                logger.warn('Error in ResizeObserver callback:', error);
              }
            });
            resizeObserver.observe(header);
          } catch (error) {
            logger.warn('ResizeObserver not supported:', error);
          }
        }
      };

      window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });

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
          window.removeEventListener('resize', handleResize);
        } catch (error) {
          logger.warn('Error during cleanup:', error);
        }
      };
    };

    // Запускаем поиск header
    findAndInitHeader();
  } catch (error) {
    // Обрабатываем любые неожиданные ошибки
    logger.error('Error initializing header height observer:', error);
    // Используем fallback значение
    const fallbackHeight = 64;
    document.documentElement.style.setProperty('--header-h', `${fallbackHeight}px`);
  }
}
