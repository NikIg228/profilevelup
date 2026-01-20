import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
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
  const isFirstRenderRef = useRef(true);
  const previousPathRef = useRef<string | null>(null);
  const isPageReloadRef = useRef<boolean | null>(null);
  
  // Подключаем Lenis для плавного скролла
  const lenis = useLenisSmoothScroll();

  // Определяем, была ли это перезагрузка страницы или навигация через роутер
  // Вычисляем только один раз при первом рендере, чтобы избежать изменения значения при повторных рендерах
  if (isPageReloadRef.current === null) {
    if (!isHomePage) {
      isPageReloadRef.current = false;
    } else if (isFirstRenderRef.current) {
      // При первом рендере проверяем тип навигации через Performance API
      try {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const navType = navEntries[0].type;
          // 'reload' - перезагрузка страницы, всегда показываем интро
          if (navType === 'reload') {
            isPageReloadRef.current = true;
          } else if (navType === 'navigate') {
            // 'navigate' - первая загрузка страницы или навигация
            // Проверяем, был ли уже переход на главную через роутер в этой сессии
            const hasNavigatedToHome = sessionStorage.getItem('navigated_to_home');
            // Если не было навигации - это первая загрузка на главной
            isPageReloadRef.current = !hasNavigatedToHome;
          } else {
            isPageReloadRef.current = false;
          }
        } else {
          // Fallback: если Performance API недоступен, проверяем sessionStorage
          const hasNavigatedToHome = sessionStorage.getItem('navigated_to_home');
          isPageReloadRef.current = !hasNavigatedToHome;
        }
      } catch {
        // Fallback: если Performance API недоступен, проверяем sessionStorage
        const hasNavigatedToHome = sessionStorage.getItem('navigated_to_home');
        isPageReloadRef.current = !hasNavigatedToHome;
      }
    } else {
      // Если это не первый рендер - это навигация через роутер
      isPageReloadRef.current = false;
    }
  }

  const isPageReload = isPageReloadRef.current;

  // Отслеживаем навигацию на главную через роутер
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousPathRef.current = location.pathname;
    } else {
      // Если путь изменился и мы на главной - это навигация через роутер
      if (previousPathRef.current !== location.pathname && isHomePage) {
        previousPathRef.current = location.pathname;
        // Помечаем, что был переход на главную через роутер
        try {
          sessionStorage.setItem('navigated_to_home', 'true');
        } catch {}
      } else if (previousPathRef.current !== location.pathname) {
        previousPathRef.current = location.pathname;
      }
    }
  }, [location.pathname, isHomePage]);

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

  // IntroOverlay показывается только при перезагрузке страницы (не при навигации)
  if (isHomePage && isPageReload) {
    return (
      <IntroOverlay oncePerDevice={false} storageKey="intro_seen_v1">
        {content}
      </IntroOverlay>
    );
  }

  return content;
}


