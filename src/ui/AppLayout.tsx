import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import SkipLink from '../components/SkipLink';
import StructuredData from '../components/StructuredData';
import { useLenisSmoothScroll } from '../hooks/useLenisSmoothScroll';
import { LenisContext } from '../contexts/LenisContext';
import { isMobile } from '../utils/device';

export default function AppLayout() {
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname.startsWith('/test');

  // Подключаем Lenis для плавного скролла
  const lenis = useLenisSmoothScroll();

  // Инициализация root контейнера (логика overflow теперь в useLenisSmoothScroll)
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'visible';
    }
  }, []);

  return (
    <LenisContext.Provider value={{ lenis }}>
      <div className="min-h-screen flex flex-col">
        <SkipLink />
        <StructuredData />
        <ScrollToTop />
        <Header />
        <main id="main-content" className="flex-1 pt-20">{/* отступ под фиксированный header */}
          <Outlet />
        </main>
        {!isTestPage && <Footer />}
      </div>
    </LenisContext.Provider>
  );
}


