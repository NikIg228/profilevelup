import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Trash2, AlertCircle, Tag, ArrowLeft } from 'lucide-react';
import {
  fetchPromoCodes,
  createPromoCode,
  deletePromoCode,
  hasSupabaseSession,
  type PromoCode,
  type PromoCodeInsert,
} from '../utils/promoApi';
import { useAdminAuthStore } from '../stores/useAdminAuthStore';
import { checkAdminAccess } from '../utils/adminCheck';
import { supabase } from '../lib/supabase';

export default function AdminPromoCodesPage() {
  const { isAuthenticated, logout } = useAdminAuthStore();

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSessionReady, setPromoSessionReady] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'fixed',
    value: '',
    validUntil: '',
    maxUses: '',
    description: '',
  });
  const [promoSubmitting, setPromoSubmitting] = useState(false);

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

  const checkAdminRights = useCallback(async () => {
    if (isAuthenticated) {
      const hasSession = await hasSupabaseSession();
      setPromoSessionReady(hasSession);
      
      // Если есть сессия, проверяем права администратора
      if (hasSession) {
        const adminAccess = await checkAdminAccess();
        setIsAdmin(adminAccess);
        if (adminAccess) {
          loadPromoCodes();
        }
      } else {
        setIsAdmin(null);
      }
    } else {
      setPromoSessionReady(null);
      setIsAdmin(null);
    }
  }, [isAuthenticated, loadPromoCodes]);

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
    return <Navigate to="/admin" replace />;
  }

  // Показываем загрузку при проверке сессии или прав администратора
  if (promoSessionReady === null || isAdmin === null) {
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
              Админ-панель: Промокоды
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
  if (promoSessionReady === false || isAdmin === false) {
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
              Админ-панель: Промокоды
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
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${promoSessionReady === false ? 'text-muted' : 'text-red-500'}`} />
          <h2 className="text-xl font-semibold text-heading mb-4">
            {promoSessionReady === false ? 'Требуется авторизация' : 'Доступ запрещен'}
          </h2>
          <p className="text-ink mb-6">
            {promoSessionReady === false
              ? 'Для управления промокодами войдите в аккаунт.'
              : 'У вас нет прав для доступа к админ-панели. Обратитесь к администратору.'}
          </p>
          {promoSessionReady === false && (
            <Link
              to="/account?returnTo=/admin/promocodes"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Войти в аккаунт
            </Link>
          )}
        </div>
      </div>
    );
  }

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
            Админ-панель: Промокоды
          </h1>
        </div>
        <button
          onClick={() => logout()}
          className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="mb-8">
        {promoError && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {promoError}
          </div>
        )}
        {promoSessionReady === true && isAdmin === true && (
          <>
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
    </div>
  );
}
