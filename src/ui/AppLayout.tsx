import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';

export default function AppLayout() {
  const location = useLocation();
  const isTestPage = location.pathname === '/test' || location.pathname.startsWith('/test');

  return (
    <div className="min-h-full flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pt-20">{/* отступ под фиксированный header */}
        <Outlet />
      </main>
      {!isTestPage && <Footer />}
    </div>
  );
}


