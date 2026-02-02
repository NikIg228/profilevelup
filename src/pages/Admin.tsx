import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, AlertCircle, Tag } from 'lucide-react';
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
import {
  fetchPromoCodes,
  createPromoCode,
  deletePromoCode,
  hasSupabaseSession,
  type PromoCode,
  type PromoCodeInsert,
} from '../utils/promoApi';

type AdminTab = 'pending' | 'all' | 'promo';

export default function AdminPage() {
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSessionReady, setPromoSessionReady] = useState<boolean | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'fixed',
    value: '',
    validUntil: '',
    maxUses: '',
    description: '',
  });
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  useEffect(() => {
    if (isAuthenticated) {
      loadReviews();
    }
  }, [isAuthenticated]);

  const loadPromoCodes = useCallback(async () => {
    setPromoLoading(true);
    setPromoError(null);
    try {
      const list = await fetchPromoCodes();
      setPromoCodes(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPromoError(msg || 'Ошибка загрузки промокодов');
    } finally {
      setPromoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'promo' && isAuthenticated) {
      hasSupabaseSession().then((ok) => {
        setPromoSessionReady(ok);
        if (ok) loadPromoCodes();
      });
    } else if (activeTab !== 'promo') {
      setPromoSessionReady(null);
    }
  }, [activeTab, isAuthenticated, loadPromoCodes]);

  const loadReviews = () => {
    setPendingReviews(getPendingReviews());
    setAllReviews(getAllReviews());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      alert('Пароль не настроен. Установите VITE_ADMIN_PASSWORD в переменных окружения.');
      return;
    }
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

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoForm.code.trim();
    const valueNum = promoForm.value.trim() ? parseInt(promoForm.value, 10) : NaN;
    if (!code) {
      alert('Введите код промокода');
      return;
    }
    if (!Number.isFinite(valueNum) || valueNum < 0) {
      alert('Введите корректное значение скидки');
      return;
    }
    if (promoForm.discountType === 'percent' && (valueNum < 0 || valueNum > 100)) {
      alert('Процент скидки должен быть от 0 до 100');
      return;
    }
    setPromoSubmitting(true);
    setPromoError(null);
    try {
      const row: PromoCodeInsert = {
        code,
        discount_percent: promoForm.discountType === 'percent' ? valueNum : null,
        discount_fixed: promoForm.discountType === 'fixed' ? valueNum : null,
        valid_until: promoForm.validUntil.trim() || null,
        max_uses: promoForm.maxUses.trim() ? parseInt(promoForm.maxUses, 10) : null,
        description: promoForm.description.trim() || null,
      };
      await createPromoCode(row);
      setPromoForm({ code: '', discountType: 'percent', value: '', validUntil: '', maxUses: '', description: '' });
      await loadPromoCodes();
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Ошибка создания промокода');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Удалить этот промокод?')) return;
    setPromoError(null);
    try {
      await deletePromoCode(id);
      await loadPromoCodes();
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Ошибка удаления');
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
                id="admin-password"
                name="password"
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
        <h1 className="text-3xl font-semibold text-heading">
          {activeTab === 'promo' ? 'Админ-панель: Промокоды' : 'Админ-панель: Модерация отзывов'}
        </h1>
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
        <button
          onClick={() => setActiveTab('promo')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'promo'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted hover:text-heading'
          }`}
        >
          <Tag className="w-4 h-4" />
          Промокоды ({promoCodes.length})
        </button>
      </div>

      {activeTab === 'promo' && (
        <div className="mb-8">
          {promoSessionReady === null && (
            <div className="card p-8 text-center text-muted">
              Проверка сессии…
            </div>
          )}
          {promoSessionReady === false && (
            <div className="card p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-ink mb-4">
                Для управления промокодами войдите в аккаунт.
              </p>
              <Link
                to="/account"
                className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
              >
                Войти в аккаунт
              </Link>
            </div>
          )}
          {promoSessionReady === true && (
            <>
              {promoError && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {promoError}
                </div>
              )}
              <div className="card p-6 mb-6">
                <h2 className="text-lg font-semibold text-heading mb-4">Создать промокод</h2>
                <form onSubmit={handleCreatePromo} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Код *</label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.trimStart() }))}
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="SUMMER20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Тип скидки</label>
                    <select
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm((f) => ({ ...f, discountType: e.target.value as 'percent' | 'fixed' }))}
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="percent">Процент (%)</option>
                      <option value="fixed">Фиксированная сумма (₸)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Значение *</label>
                    <input
                      type="number"
                      min={0}
                      max={promoForm.discountType === 'percent' ? 100 : undefined}
                      value={promoForm.value}
                      onChange={(e) => setPromoForm((f) => ({ ...f, value: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder={promoForm.discountType === 'percent' ? '20' : '1000'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Действует до</label>
                    <input
                      type="date"
                      value={promoForm.validUntil}
                      onChange={(e) => setPromoForm((f) => ({ ...f, validUntil: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Макс. использований</label>
                    <input
                      type="number"
                      min={1}
                      value={promoForm.maxUses}
                      onChange={(e) => setPromoForm((f) => ({ ...f, maxUses: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Без лимита"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-heading mb-1">Описание</label>
                    <input
                      type="text"
                      value={promoForm.description}
                      onChange={(e) => setPromoForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Необязательно"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      disabled={promoSubmitting}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                    >
                      {promoSubmitting ? 'Создание…' : 'Создать промокод'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="card overflow-hidden">
                <h2 className="text-lg font-semibold text-heading p-4 border-b border-secondary/40">Список промокодов</h2>
                {promoLoading ? (
                  <div className="p-8 text-center text-muted">Загрузка…</div>
                ) : promoCodes.length === 0 ? (
                  <div className="p-8 text-center text-muted">Промокодов пока нет</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-secondary/40 bg-secondary/20">
                          <th className="p-3 font-medium text-heading">Код</th>
                          <th className="p-3 font-medium text-heading">Скидка</th>
                          <th className="p-3 font-medium text-heading">Действует до</th>
                          <th className="p-3 font-medium text-heading">Использовано</th>
                          <th className="p-3 font-medium text-heading">Создан</th>
                          <th className="p-3 font-medium text-heading w-24">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promoCodes.map((p) => (
                          <tr key={p.id} className="border-b border-secondary/40 hover:bg-secondary/10">
                            <td className="p-3 font-mono text-ink">{p.code}</td>
                            <td className="p-3 text-ink">
                              {p.discount_percent != null ? `${p.discount_percent}%` : p.discount_fixed != null ? `${p.discount_fixed} ₸` : '—'}
                            </td>
                            <td className="p-3 text-muted">
                              {p.valid_until ? new Date(p.valid_until).toLocaleDateString('ru-RU') : 'Без срока'}
                            </td>
                            <td className="p-3 text-ink">
                              {(p as { used_count?: number }).used_count ?? '—'}
                              {p.max_uses != null ? ` / ${p.max_uses}` : ''}
                            </td>
                            <td className="p-3 text-muted text-sm">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString('ru-RU') : '—'}
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleDeletePromo(p.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab !== 'promo' && (
        reviewsToShow.length === 0 ? (
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
        )
      )}
    </div>
  );
}

