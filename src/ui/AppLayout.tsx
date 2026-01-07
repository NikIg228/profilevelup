import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

export default function AppLayout() {
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname.startsWith('/test');

  // Защита от лишнего scroll при reload
  useEffect(() => {
    const fixScroll = () => {
      requestAnimationFrame(() => {
        document.documentElement.style.overflowY = 'auto';
        document.body.style.overflowY = 'auto';
        // Убираем overflow со всех layout-контейнеров
        const root = document.getElementById('root');
        if (root) {
          root.style.overflow = 'visible';
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

  // Сброс overflow при изменении маршрута
  useEffect(() => {
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pt-20">{/* отступ под фиксированный header */}
        <Outlet />
      </main>
      {!isTestPage && <Footer />}
    </div>
  );
}


