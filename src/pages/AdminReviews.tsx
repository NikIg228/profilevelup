import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  Review,
} from '../utils/reviewsStorage';
import { sanitizeText } from '../utils/sanitize';
import { useAdminAuthStore } from '../stores/useAdminAuthStore';
import { hasSupabaseSession } from '../utils/promoApi';
import { checkAdminAccess } from '../utils/adminCheck';
import { supabase } from '../lib/supabase';

type ReviewsTab = 'pending' | 'all';

export default function AdminReviewsPage() {
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<ReviewsTab>('pending');
  const [supabaseSessionReady, setSupabaseSessionReady] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { isAuthenticated, logout } = useAdminAuthStore();

  const loadReviews = () => {
    setPendingReviews(getPendingReviews());
    setAllReviews(getAllReviews());
  };

  const checkAdminRights = useCallback(async () => {
    if (isAuthenticated) {
      const hasSession = await hasSupabaseSession();
      setSupabaseSessionReady(hasSession);
      
      // Если есть сессия, проверяем права администратора
      if (hasSession) {
        const adminAccess = await checkAdminAccess();
        setIsAdmin(adminAccess);
        if (adminAccess) {
          loadReviews();
        }
      } else {
        setIsAdmin(null);
      }
    } else {
      setSupabaseSessionReady(null);
      setIsAdmin(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkAdminRights();
  }, [checkAdminRights]);

  // Слушаем изменения авторизации Supabase для автоматического обновления
  useEffect(() => {
    if (!isAuthenticated) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Автоматически проверяем права при изменении состояния авторизации
        await checkAdminRights();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated, checkAdminRights]);

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
    return <Navigate to="/admin" replace />;
  }

  // Показываем загрузку при проверке сессии или прав администратора
  if (supabaseSessionReady === null || isAdmin === null) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              title="Вернуться в админ-панель"
            >
              <ArrowLeft className="w-5 h-5 text-heading" />
            </Link>
            <h1 className="text-3xl font-semibold text-heading">
              Админ-панель: Отзывы
            </h1>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="card p-8 text-center text-muted">
          Проверка доступа…
        </div>
      </div>
    );
  }

  // Проверка прав администратора
  if (supabaseSessionReady === false || isAdmin === false) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              title="Вернуться в админ-панель"
            >
              <ArrowLeft className="w-5 h-5 text-heading" />
            </Link>
            <h1 className="text-3xl font-semibold text-heading">
              Админ-панель: Отзывы
            </h1>
          </div>
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-heading mb-4">
            {supabaseSessionReady === false ? 'Требуется авторизация' : 'Доступ запрещен'}
          </h2>
          <p className="text-ink mb-6">
            {supabaseSessionReady === false
              ? 'Для доступа к админ-панели необходимо войти в аккаунт.'
              : 'У вас нет прав для доступа к админ-панели. Обратитесь к администратору.'}
          </p>
          {supabaseSessionReady === false && (
            <Link
              to="/account?returnTo=/admin/reviews"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Войти в аккаунт
            </Link>
          )}
        </div>
      </div>
    );
  }

  const reviewsToShow = activeTab === 'pending' ? pendingReviews : allReviews;

  return (
    <div className="container-balanced mt-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            title="Вернуться в админ-панель"
          >
            <ArrowLeft className="w-5 h-5 text-heading" />
          </Link>
          <h1 className="text-3xl font-semibold text-heading">
            Админ-панель: Отзывы
          </h1>
        </div>
        <button
          onClick={() => logout()}
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
                    <h3 className="font-semibold text-heading">{sanitizeText(review.name)}</h3>
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
                  {(review.age || review.testType) && (
                    <p className="text-sm text-muted mb-2">
                      {review.age && <span>Возраст: {review.age} лет</span>}
                      {review.age && review.testType && <span> • </span>}
                      {review.testType && <span>Опрос: {review.testType}</span>}
                    </p>
                  )}
                  <p className="text-ink leading-relaxed">{sanitizeText(review.text)}</p>
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
