import { useEffect, useState } from 'react';

/**
 * Хук для отслеживания изменения ориентации экрана
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
      
      // Триггерим resize для пересчёта размеров компонентов
      window.dispatchEvent(new Event('resize'));
    };

    // Обработка изменения ориентации
    const handleOrientationChange = () => {
      // Небольшая задержка для корректного определения размеров после поворота
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Также слушаем изменения через matchMedia для более точного определения
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(orientation: portrait)');
      const handleMediaChange = (e: MediaQueryListEvent) => {
        setOrientation(e.matches ? 'portrait' : 'landscape');
        setTimeout(handleResize, 100);
      };
      
      mediaQuery.addEventListener('change', handleMediaChange);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
        mediaQuery.removeEventListener('change', handleMediaChange);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

