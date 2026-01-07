import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getScrollContainer(): HTMLElement {
  const candidates = [
    document.scrollingElement,
    document.documentElement,
    document.body,
    document.querySelector('#root'),
    document.querySelector('main'),
    document.querySelector('.app'),
    document.querySelector('.layout'),
  ].filter(Boolean) as HTMLElement[];

  return (
    candidates.find(el => el.scrollHeight > el.clientHeight) ??
    document.documentElement
  );
}

/**
 * Компонент для плавного скролла в начало страницы при смене маршрута
 * Находит реальный scroll-контейнер и скроллит его
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Используем только body для скролла
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);

  return null;
}
