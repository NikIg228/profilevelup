import { useState, useEffect } from 'react';
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
      <div className="grid gap-6">
        <header className="grid gap-3">
          <h1 className="text-3xl font-semibold">Отзывы</h1>
          <p className="text-muted max-w-3xl">
            В основном наши тесты проходят поступающие в университет — учащиеся 11 классов, а также
            студенты младших курсов, которые выбирают специализацию. Ниже — их впечатления: что было
            полезно, какие направления оказались ближе и как результаты помогли определиться с выбором.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{r.name}</h3>
                <span className="text-xs text-muted">{r.date}</span>
              </div>
              <p className="leading-relaxed">{r.text}</p>
            </article>
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
      </div>

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


