import { useState, useCallback, Suspense } from 'react';
import { useLenis } from '../../contexts/LenisContext';
import { useIsMobile } from './hooks/useIsMobile';
import { useHeroResizeFix } from './hooks/useHeroResizeFix';
import HeroSection from './sections/HeroSection';
import SocialProofSection from './sections/SocialProofSection';
import WhoForSectionLazy from './sections/WhoForSection.lazy';
import ReviewsSectionLazy from './sections/ReviewsSection.lazy';
import StartTestModalLazy from './components/StartTestModal.lazy';
import AuthModal from '../../components/AuthModal';
import ModalErrorBoundary from '../../components/ModalErrorBoundary';
import { useAuthStore } from '../../stores/useAuthStore';
import type { Plan } from './home.types';
import FormatsSectionLazy from './sections/FormatsSection.lazy';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>(null);
  const [initialTestType, setInitialTestType] = useState<string>('');
  const [premiumSlideIndex, setPremiumSlideIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan>(null);
  const [pendingTestType, setPendingTestType] = useState<string>('');

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMobile = useIsMobile();
  const lenis = useLenis();

  useHeroResizeFix(isMobile);

  const openFor = useCallback((p: Plan, testTypeValue?: string) => {
    if (isAuthenticated) {
      setPlan(p);
      setInitialTestType(testTypeValue || '');
      setModalOpen(true);
    } else {
      setPendingPlan(p);
      setPendingTestType(testTypeValue || '');
      setAuthModalOpen(true);
    }
  }, [isAuthenticated]);

  const scrollToFormats = useCallback(() => {
    const formatsSection = document.getElementById('levels');
    if (formatsSection && lenis) {
      lenis.scrollTo(formatsSection, { offset: -80, duration: 1.2 });
    } else if (formatsSection) {
      formatsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [lenis]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setPlan(null);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setAuthModalOpen(false);
    if (pendingPlan !== null) {
      setPlan(pendingPlan);
      setInitialTestType(pendingTestType);
      setModalOpen(true);
      setPendingPlan(null);
      setPendingTestType('');
    }
  }, [pendingPlan, pendingTestType]);

  const handleAuthModalClose = useCallback(() => {
    setAuthModalOpen(false);
    setPendingPlan(null);
    setPendingTestType('');
  }, []);

  const handleStartFree = useCallback(() => {
    openFor('free');
  }, [openFor]);

  const handleStartPro = useCallback((testType?: string) => {
    openFor('pro', testType);
  }, [openFor]);

  return (
    <div>
      <HeroSection 
        onStartFree={handleStartFree}
        onScrollToFormats={scrollToFormats}
      />

      <Suspense fallback={
        <section className="container-balanced mt-12 lg:mt-16">
          <div className="card p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>
      }>
        <FormatsSectionLazy
          premiumSlideIndex={premiumSlideIndex}
          setPremiumSlideIndex={setPremiumSlideIndex}
          expandedCard={expandedCard}
          setExpandedCard={setExpandedCard}
          onStartFree={handleStartFree}
          onStartPro={handleStartPro}
        />
      </Suspense>

      <SocialProofSection />

      <Suspense fallback={
        <section className="container-balanced mt-12 lg:mt-16">
          <div className="card p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>
      }>
        <ReviewsSectionLazy />
      </Suspense>

      <Suspense fallback={
        <section className="container-balanced mt-12 lg:mt-16">
          <div className="card p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </section>
      }>
        <WhoForSectionLazy />
      </Suspense>

      {authModalOpen && (
        <AuthModal
          open={authModalOpen}
          onClose={handleAuthModalClose}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {modalOpen && (
        <ModalErrorBoundary onClose={handleCloseModal}>
          <Suspense fallback={
            <div
              className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-4"
              style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                minHeight: '100dvh',
              }}
              aria-label="Загрузка формы"
            >
              <div className="card p-8 flex flex-col items-center gap-4 max-w-sm w-full rounded-t-2xl sm:rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted">Загрузка формы…</p>
              </div>
            </div>
          }>
            <StartTestModalLazy
              open={modalOpen}
              plan={plan}
              initialTestType={initialTestType || (plan === 'pro' ? 'Персональный разбор' : '')}
              onClose={handleCloseModal}
            />
          </Suspense>
        </ModalErrorBoundary>
      )}
    </div>
  );
}

