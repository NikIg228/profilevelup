import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/globals.css';
import PreviewGate from './components/PreviewGate';
import AppLayout from './ui/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeDefaultReviews } from './utils/reviewsStorage';
import { initHeaderHeightObserver } from './utils/headerHeight';

// Lazy loading для всех страниц
const HomePage = lazy(() => import('./pages/Home'));
const TestingPage = lazy(() => import('./pages/Testing'));
const ResultFreePage = lazy(() => import('./pages/ResultFree'));
const ResultVipPage = lazy(() => import('./pages/ResultVip'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const TermsPage = lazy(() => import('./pages/Terms'));
const ReviewsPage = lazy(() => import('./pages/Reviews'));
const AboutPage = lazy(() => import('./pages/About'));
const HelpPage = lazy(() => import('./pages/Help'));
const DetailsPage = lazy(() => import('./pages/Details'));
const AdminPage = lazy(() => import('./pages/Admin'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const PublicOfferPage = lazy(() => import('./pages/PublicOffer'));
const AccountPage = lazy(() => import('./pages/Account'));

// Компонент загрузки
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-base">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted">Загрузка...</p>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { 
        index: true, 
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ) 
      },
      { 
        path: 'test', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestingPage />
          </Suspense>
        ) 
      },
      { 
        path: 'result/free', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResultFreePage />
          </Suspense>
        ) 
      },
      { 
        path: 'result/vip', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResultVipPage />
          </Suspense>
        ) 
      },
      { 
        path: 'reviews', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReviewsPage />
          </Suspense>
        ) 
      },
      { 
        path: 'about', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        ) 
      },
      { 
        path: 'privacy', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPage />
          </Suspense>
        ) 
      },
      { 
        path: 'terms', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <TermsPage />
          </Suspense>
        ) 
      },
      { 
        path: 'public-offer', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <PublicOfferPage />
          </Suspense>
        ) 
      },
      { 
        path: 'help', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <HelpPage />
          </Suspense>
        ) 
      },
      { 
        path: 'details', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <DetailsPage />
          </Suspense>
        ) 
      },
      { 
        path: 'admin', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        ) 
      },
      { 
        path: 'account', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <AccountPage />
          </Suspense>
        ) 
      },
      { 
        path: '*', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ) 
      },
    ],
  },
], {
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_relativeSplatPath: true,
    v7_skipActionErrorRevalidation: true,
    v7_startTransition: true,
  },
});

// Инициализация дефолтных отзывов
initializeDefaultReviews();

// Инициализация сессии авторизации
import { useAuthStore } from './stores/useAuthStore';
useAuthStore.getState().checkSession();

// Инициализация динамического обновления высоты header после загрузки DOM
// Используем requestAnimationFrame для гарантии, что React отрендерил header
if (typeof window !== 'undefined') {
  try {
    const initObserver = () => {
      try {
        // Используем requestAnimationFrame для ожидания рендера React
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Двойной RAF гарантирует что React компоненты отрендерились
            initHeaderHeightObserver();
          });
        });
      } catch (error) {
        // Игнорируем ошибки инициализации (могут быть связаны с расширениями браузера)
        if (import.meta.env.DEV) {
          console.warn('Error initializing header height observer:', error);
        }
      }
    };

    // Используем DOMContentLoaded для гарантии, что DOM готов
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObserver, { once: true });
    } else {
      // DOM уже загружен - используем RAF для ожидания React рендера
      initObserver();
    }
  } catch (error) {
    // Игнорируем ошибки инициализации
    if (import.meta.env.DEV) {
      console.warn('Error setting up header height observer:', error);
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PreviewGate>
        <RouterProvider router={router} />
      </PreviewGate>
    </ErrorBoundary>
  </React.StrictMode>
);


