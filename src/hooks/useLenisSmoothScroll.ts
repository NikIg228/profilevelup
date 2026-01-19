import Lenis from '@studio-freight/lenis';
import { useEffect, useState, useRef } from 'react';
import { isMobile } from '../utils/device';

export function useLenisSmoothScroll() {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const initLenis = () => {
      // Проверяем, является ли устройство мобильным
      const isMobileDevice = isMobile();
      
      // Отключаем Lenis на мобильных устройствах
      if (isMobileDevice) {
        // Помечаем html как мобильный для CSS
        document.documentElement.setAttribute('data-mobile', 'true');
        // Убеждаемся, что overflow не скрыт на мобильных - используем нативный скролл
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowY = '';
        document.documentElement.classList.remove('lenis');
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.body.classList.remove('lenis');
        // Убеждаемся что #root не создает свой скролл
        const root = document.getElementById('root');
        if (root) {
          root.style.overflow = 'visible';
          root.style.overflowY = 'visible';
        }
        // Убеждаемся что #page-root не создает свой скролл
        const pageRoot = document.getElementById('page-root');
        if (pageRoot) {
          pageRoot.style.overflow = 'visible';
          pageRoot.style.overflowY = 'visible';
        }
        // Удаляем все элементы Lenis из DOM если они есть
        const lenisElements = document.querySelectorAll('.lenis, [class*="lenis"]');
        lenisElements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
        
        // Очищаем предыдущий экземпляр, если был
        if (lenisRef.current) {
          lenisRef.current.destroy();
          lenisRef.current = null;
        }
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        setLenis(null);
        return;
      }
      
      // Убираем атрибут для desktop
      document.documentElement.removeAttribute('data-mobile');

      // Уничтожаем предыдущий экземпляр, если есть
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const lenisInstance = new Lenis({
        duration: 0.3,
        easing: (t) => 1 - Math.pow(1 - t, 5),
        smoothWheel: true,
        syncTouch: false, // Нативный скролл на touch устройствах
      });

      lenisRef.current = lenisInstance;
      setLenis(lenisInstance);

      // Убеждаемся, что overflow настроен правильно для Lenis
      // НО только на desktop, на мобильных оставляем нативный скролл
      requestAnimationFrame(() => {
        if (!isMobile()) {
          // Lenis управляет скроллом через свой внутренний контейнер
          // Используем overflow-y: scroll на html, но visible на body, чтобы был только один скроллбар
          document.documentElement.style.overflowX = 'hidden';
          document.documentElement.style.overflowY = 'scroll'; // scroll на html для показа скроллбара
          document.body.style.overflowX = 'hidden';
          document.body.style.overflowY = 'visible'; // visible на body, чтобы не было второго скроллбара
          // Убеждаемся что #root не создает свой скролл
          const root = document.getElementById('root');
          if (root) {
            root.style.overflow = 'visible';
            root.style.overflowY = 'visible';
          }
        }
      });

      function raf(time: number) {
        if (lenisRef.current) {
          lenisRef.current.raf(time);
          rafIdRef.current = requestAnimationFrame(raf);
        }
      }

      rafIdRef.current = requestAnimationFrame(raf);
    };

    // Инициализация при монтировании
    initLenis();

    // Обработчик изменения размера окна
    const handleResize = () => {
      // Очищаем предыдущий экземпляр
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setLenis(null);
      
      // Переинициализируем
      initLenis();
    };

    window.addEventListener('devicechange', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('devicechange', handleResize);
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      setLenis(null);
    };
  }, []); // Пустой массив зависимостей, так как isMobile() теперь реактивный

  return lenis;
}
