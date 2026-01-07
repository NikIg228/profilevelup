import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLenis } from '../contexts/LenisContext';

/**
 * Компонент для плавного скролла в начало страницы при смене маршрута
 * Использует Lenis для плавного скролла
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      // Используем Lenis для плавного скролла
      lenis.scrollTo(0, { immediate: false });
    } else {
      // Fallback на нативный скролл, если Lenis еще не инициализирован
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return null;
}
