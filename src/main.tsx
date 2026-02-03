import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/globals.css';
import PreviewGate from './components/PreviewGate';
import AppLayout from './ui/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeDefaultReviews } from './utils/reviewsStorage';
import { useAuthStore } from './stores/useAuthStore';

// Lazy loading для всех страниц
const HomePage = lazy(() => import('./pages/Home'));
const TestingFreePage = lazy(() => import('./pages/TestingFree'));
const TestingExtendedPage = lazy(() => import('./pages/TestingExtended'));
const TestingPremiumPage = lazy(() => import('./pages/TestingPremium'));
const ResultFreePage = lazy(() => import('./pages/ResultFree'));
const ResultVipPage = lazy(() => import('./pages/ResultVip'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const TermsPage = lazy(() => import('./pages/Terms'));
const ReviewsPage = lazy(() => import('./pages/Reviews'));
const AboutPage = lazy(() => import('./pages/About'));
const HelpPage = lazy(() => import('./pages/Help'));
const DetailsPage = lazy(() => import('./pages/Details'));
const AdminPage = lazy(() => import('./pages/Admin'));
const AdminReviewsPage = lazy(() => import('./pages/AdminReviews'));
const AdminPromoCodesPage = lazy(() => import('./pages/AdminPromoCodes'));
const AdminStats101Page = lazy(() => import('./pages/AdminStats101'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const PublicOfferPage = lazy(() => import('./pages/PublicOffer'));
const AccountPage = lazy(() => import('./pages/Account'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailPage = lazy(() => import('./pages/PaymentFail'));

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
        path: 'test/free', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestingFreePage />
          </Suspense>
        ) 
      },
      { 
        path: 'test/extended', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestingExtendedPage />
          </Suspense>
        ) 
      },
      { 
        path: 'test/premium', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestingPremiumPage />
          </Suspense>
        ) 
      },
      // Обратная совместимость - редирект со старого пути
      { 
        path: 'test', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestingFreePage />
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
        path: 'admin/reviews', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminReviewsPage />
          </Suspense>
        ) 
      },
      { 
        path: 'admin/promocodes', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPromoCodesPage />
          </Suspense>
        ) 
      },
      { 
        path: 'admino101', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminStats101Page />
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
        path: 'payment/success', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentSuccessPage />
          </Suspense>
        ) 
      },
      { 
        path: 'payment/fail', 
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentFailPage />
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
  },
});

// Инициализация дефолтных отзывов (lazy, не блокирует рендер)
if (typeof window !== 'undefined') {
  // Отложенная инициализация для улучшения TTI
  const initReviews = () => initializeDefaultReviews();
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initReviews, { timeout: 2000 });
  } else {
    setTimeout(initReviews, 100);
  }
}

// Инициализация сессии авторизации при старте
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkSession();
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


