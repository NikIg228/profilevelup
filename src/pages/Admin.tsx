import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  Review,
} from '../utils/reviewsStorage';

export default function AdminPage() {
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '10203';

  useEffect(() => {
    if (isAuthenticated) {
      loadReviews();
    }
  }, [isAuthenticated]);

  const loadReviews = () => {
    setPendingReviews(getPendingReviews());
    setAllReviews(getAllReviews());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Неверный пароль');
    }
  };

  const handleApprove = (id: string) => {
    if (confirm('Одобрить этот отзыв?')) {
      approveReview(id);
      loadReviews();
    }
  };

  const handleReject = (id: string) => {
    if (confirm('Отклонить этот отзыв?')) {
      rejectReview(id);
      loadReviews();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить этот отзыв навсегда?')) {
      deleteReview(id);
      loadReviews();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-balanced mt-10 max-w-md mx-auto">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-heading mb-6">Админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-heading mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-secondary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Введите пароль"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold transition-all duration-300 hover:bg-primary-hover"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  const reviewsToShow = activeTab === 'pending' ? pendingReviews : allReviews;

  return (
    <div className="container-balanced mt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-heading">Админ-панель: Модерация отзывов</h1>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-secondary/40">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted hover:text-heading'
          }`}
        >
          На модерации ({pendingReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted hover:text-heading'
          }`}
        >
          Все отзывы ({allReviews.length})
        </button>
      </div>

      {reviewsToShow.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">
            {activeTab === 'pending' ? 'Нет отзывов на модерации' : 'Нет отзывов'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviewsToShow.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-heading">{review.name}</h3>
                    <span className="text-xs text-muted">{review.date}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        review.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : review.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {review.status === 'approved'
                        ? 'Одобрен'
                        : review.status === 'rejected'
                        ? 'Отклонён'
                        : 'На модерации'}
                    </span>
                  </div>
                  {review.result && (
                    <p className="text-sm text-muted mb-2">
                      Результат: <span className="font-medium">{review.result}</span>
                    </p>
                  )}
                  <p className="text-ink leading-relaxed">{review.text}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-secondary/40">
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Отклонить
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

