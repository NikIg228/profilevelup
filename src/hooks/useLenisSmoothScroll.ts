import Lenis from '@studio-freight/lenis';
import { useEffect, useState, useRef } from 'react';
import { isMobile } from '../utils/device';

export function useLenisSmoothScroll() {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const initLenis = () => {
      // Проверяем, является ли устройство мобильным ИЛИ находится в landscape режиме с маленькой высотой
      const isMobileDevice = isMobile();
      const isLandscapeMobile = window.innerHeight <= 430 && window.matchMedia('(orientation: landscape)').matches;
      
      // Отключаем Lenis на мобильных устройствах ИЛИ в mobile landscape режиме
      if (isMobileDevice || isLandscapeMobile) {
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

      // Убеждаемся, что overflow скрыт для html и body (Lenis управляет скроллом)
      // НО только на desktop, на мобильных оставляем нативный скролл
      requestAnimationFrame(() => {
        if (!isMobile()) {
          // Lenis управляет скроллом через свой внутренний контейнер
          // Скрываем overflow только у html и body, чтобы не было двойного скролла
          document.documentElement.style.overflow = 'hidden';
          document.documentElement.style.overflowY = 'hidden';
          document.body.style.overflow = 'hidden';
          document.body.style.overflowY = 'hidden';
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
