import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ScrollToTop from '../components/ScrollToTop';
import SkipLink from '../components/SkipLink';
import StructuredData from '../components/StructuredData';
import IntroOverlay from '../components/IntroOverlay';
import { useLenisSmoothScroll } from '../hooks/useLenisSmoothScroll';
import { LenisContext } from '../contexts/LenisContext';
import { initHeaderHeightObserver } from '../utils/headerHeight';

export default function AppLayout() {
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname.startsWith('/test');
  const isHomePage = location.pathname === '/';
  
  // Проверяем, было ли интро уже показано, чтобы не рендерить IntroOverlay вообще
  const introSeen = typeof window !== 'undefined' && 
    localStorage.getItem('intro_seen_v1') === '1';

  // Подключаем Lenis для плавного скролла
  const lenis = useLenisSmoothScroll();

  // Инициализация root контейнера (логика overflow теперь в useLenisSmoothScroll)
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'visible';
    }
  }, []);

  // Инициализация observer для отслеживания высоты header
  useEffect(() => {
    initHeaderHeightObserver();
  }, []);

  const content = (
    <LenisContext.Provider value={{ lenis }}>
      <div className="min-h-screen flex flex-col" id="page-root">
        <SkipLink />
        <StructuredData />
        <ScrollToTop />
        <Header />
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
        {!isTestPage && <Footer />}
      </div>
    </LenisContext.Provider>
  );

  // IntroOverlay только для главной страницы и только если интро еще не было показано
  if (isHomePage && !introSeen) {
    return (
      <IntroOverlay storageKey="intro_seen_v1">
        {content}
      </IntroOverlay>
    );
  }

  return content;
}


