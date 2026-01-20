import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewForm from '../../../components/ReviewForm';
import { getReviews } from '../../../utils/reviewsStorage';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState(getReviews());
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    setReviews(getReviews());
  }, [reviewFormOpen]);

  useEffect(() => {
    if (isPaused || reviews.length === 0) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, reviews.length]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  useEffect(() => {
    if (reviews.length === 0) return;
    
    const cardElement = cardRef.current;
    if (!cardElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current !== null && touchStartY.current !== null) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = Math.abs(touchEndY - touchStartY.current);
      const absDeltaX = Math.abs(deltaX);

      if (absDeltaX > deltaY && absDeltaX > SWIPE_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
        
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 4000);
        
        if (deltaX > 0) {
          setDirection(-1);
          setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
        } else {
          setDirection(1);
          setCurrentIndex((prev) => (prev + 1) % reviews.length);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    cardElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    cardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    cardElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      cardElement.removeEventListener('touchstart', handleTouchStart);
      cardElement.removeEventListener('touchmove', handleTouchMove);
      cardElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <section className="container-balanced mt-12 lg:mt-16">
        <h2 className="text-2xl font-semibold mb-6">Отзывы</h2>
        <div className="card p-8 text-center">
          <p className="text-muted mb-6">Пока нет отзывов</p>
          <button
            onClick={() => setReviewFormOpen(true)}
            className="px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
          >
            Оставить отзыв
          </button>
        </div>
        <ReviewForm
          open={reviewFormOpen}
          onClose={() => setReviewFormOpen(false)}
          onSuccess={() => {
            setReviews(getReviews());
            setCurrentIndex(0);
          }}
        />
      </section>
    );
  }

  return (
    <section className="container-balanced mt-12 lg:mt-16">
      <div className="relative mb-4 sm:mb-6">
        <div className="absolute -top-3 sm:-top-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-20 sm:w-24 h-0.5 sm:h-1 bg-primary rounded-full opacity-60"></div>
        <div className="relative flex flex-col items-center lg:items-start gap-1.5 sm:gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold relative z-10">Отзывы</h2>
          <div className="w-12 sm:w-16 h-0.5 bg-primary/40"></div>
        </div>
      </div>
      
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative sm:px-12 md:px-16">
          <button
            onClick={goToPrev}
            className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 z-10 bg-card rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:bg-primary hover:text-white text-heading border border-secondary"
            aria-label="Предыдущий отзыв"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="overflow-hidden">
            {reviews.length > 0 && reviews[currentIndex] && (
              <motion.div
                key={currentIndex}
                ref={cardRef}
                initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-white rounded-xl shadow-soft p-4 sm:p-6 md:p-8 min-h-[200px] sm:min-h-0 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'pan-x pinch-zoom', color: '#2B2B2B' }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-heading">{reviews[currentIndex].name.split(' ')[0]}</h3>
                    {(reviews[currentIndex].age || reviews[currentIndex].testType) && (
                      <div className="text-xs text-muted mt-0.5">
                        {reviews[currentIndex].age && <span>{reviews[currentIndex].age} лет</span>}
                        {reviews[currentIndex].age && reviews[currentIndex].testType && <span> • </span>}
                        {reviews[currentIndex].testType && <span>{reviews[currentIndex].testType}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-none" style={{ color: '#2B2B2B' }}>{reviews[currentIndex].text}</p>
              </motion.div>
            )}
          </div>

          <button
            onClick={goToNext}
            className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 z-10 bg-card rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:bg-primary hover:text-white text-heading border border-secondary"
            aria-label="Следующий отзыв"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-secondary hover:bg-primary/50'
              }`}
              aria-label={`Перейти к отзыву ${index + 1}`}
            />
          ))}
        </div>

        <div className="flex justify-center mt-6 sm:mt-8">
          <button
            onClick={() => setReviewFormOpen(true)}
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] sm:min-h-0 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
          >
            Оставить отзыв
          </button>
        </div>
      </div>

      <ReviewForm
        open={reviewFormOpen}
        onClose={() => setReviewFormOpen(false)}
        onSuccess={() => {
          setReviews(getReviews());
          setCurrentIndex(0);
        }}
      />
    </section>
  );
}

