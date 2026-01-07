import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReviewForm from '../components/ReviewForm';
import { getReviews } from '../utils/reviewsStorage';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(getReviews());
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  useEffect(() => {
    setReviews(getReviews());
  }, [reviewFormOpen]);

  return (
    <section className="container-balanced mt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6"
      >
        <header className="grid gap-3 relative">
          {/* Верхняя золотая полоса */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-60"></div>
          
          {/* Заголовок между полосами */}
          <div className="relative flex flex-col items-center gap-2">
            <h1 className="text-3xl font-semibold relative z-10">Отзывы</h1>
            {/* Нижняя золотая полоса */}
            <div className="w-16 h-0.5 bg-primary/40"></div>
          </div>
          
          {/* Подзаголовок с декоративными элементами */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
            <p className="text-muted pl-6 relative">
              В основном наши тесты проходят поступающие в университет — учащиеся 9-11 классов, а также
              студенты младших курсов, которые выбирают специализацию. Ниже — их впечатления: что было
              полезно, какие направления оказались ближе и как результаты помогли определиться с выбором.
            </p>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((r, index) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card p-5 border border-transparent hover:border-primary/30 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Золотой акцент в углу */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors duration-300">{r.name.split(' ')[0]}</h3>
                  {(r.age || r.testType) && (
                    <div className="text-xs text-muted mt-0.5">
                      {r.age && <span>{r.age} лет</span>}
                      {r.age && r.testType && <span> • </span>}
                      {r.testType && <span>{r.testType}</span>}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted">{r.date}</span>
              </div>
              <p className="leading-relaxed relative z-10">{r.text}</p>
            </motion.article>
          ))}
        </div>

        {/* Кнопка "Оставить отзыв" */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setReviewFormOpen(true)}
            className="px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
          >
            Оставить отзыв
          </button>
        </div>
      </motion.div>

      <ReviewForm
        open={reviewFormOpen}
        onClose={() => setReviewFormOpen(false)}
        onSuccess={() => {
          setReviews(getReviews());
        }}
      />
    </section>
  );
}


