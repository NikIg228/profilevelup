import { useState, useCallback, Suspense } from 'react';
import { useLenis } from '../../contexts/LenisContext';
import { useIsMobile } from './hooks/useIsMobile';
import { useHeroResizeFix } from './hooks/useHeroResizeFix';
import HeroSection from './sections/HeroSection';
import SocialProofSection from './sections/SocialProofSection';
import WhoForSectionLazy from './sections/WhoForSection.lazy';
import ReviewsSectionLazy from './sections/ReviewsSection.lazy';
import StartTestModalLazy from './components/StartTestModal.lazy';
import type { Plan } from './home.types';
import FormatsSectionLazy from './sections/FormatsSection.lazy';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>(null);
  const [premiumSlideIndex, setPremiumSlideIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const lenis = useLenis();
  
  // Используем хук для безопасной обработки resize на мобильных
  useHeroResizeFix(isMobile);

  const openFor = useCallback((p: Plan, testTypeValue?: string) => {
    setPlan(p);
    setModalOpen(true);
  }, []);

  const scrollToFormats = useCallback(() => {
    const formatsSection = document.getElementById('formats');
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

      {modalOpen && (
        <Suspense fallback={null}>
          <StartTestModalLazy
            open={modalOpen}
            plan={plan}
            initialTestType={plan === 'pro' ? 'Персональный разбор' : ''}
            onClose={handleCloseModal}
          />
        </Suspense>
      )}
    </div>
  );
}

