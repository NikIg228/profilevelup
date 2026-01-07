import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { useLenisSmoothScroll } from '../hooks/useLenisSmoothScroll';
import { LenisContext } from '../contexts/LenisContext';

export default function AppLayout() {
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname.startsWith('/test');

  // Подключаем Lenis для плавного скролла
  const lenis = useLenisSmoothScroll();

  // Защита от лишнего scroll при reload (убираем overflow со всех layout-контейнеров)
  useEffect(() => {
    const fixScroll = () => {
      requestAnimationFrame(() => {
        // Убираем overflow со всех layout-контейнеров
        const root = document.getElementById('root');
        if (root) {
          root.style.overflow = 'visible';
        }
        // Убеждаемся, что html и body имеют overflow: hidden для Lenis (только на desktop)
        const isMobile = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) {
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
        } else {
          // На мобильных оставляем нативный скролл
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
      });
    };

    // При монтировании
    fixScroll();

    // После гидрации
    if (document.readyState === 'complete') {
      fixScroll();
    } else {
      window.addEventListener('load', fixScroll);
      document.addEventListener('DOMContentLoaded', fixScroll);
    }

    return () => {
      window.removeEventListener('load', fixScroll);
      document.removeEventListener('DOMContentLoaded', fixScroll);
    };
  }, []);

  return (
    <LenisContext.Provider value={{ lenis }}>
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <Header />
        <main className="flex-1 pt-20">{/* отступ под фиксированный header */}
          <Outlet />
        </main>
        {!isTestPage && <Footer />}
      </div>
    </LenisContext.Provider>
  );
}


