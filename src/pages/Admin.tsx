import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Tag, AlertCircle } from 'lucide-react';
import { getPendingReviews, getAllReviews } from '../utils/reviewsStorage';
import { useAdminAuthStore } from '../stores/useAdminAuthStore';
import { hasSupabaseSession } from '../utils/promoApi';
import { supabase } from '../lib/supabase';
import { checkAdminAccess } from '../utils/adminCheck';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [supabaseSessionReady, setSupabaseSessionReady] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { isAuthenticated, login, logout } = useAdminAuthStore();

  const checkSupabaseSession = useCallback(async () => {
    if (isAuthenticated) {
      const hasSession = await hasSupabaseSession();
      setSupabaseSessionReady(hasSession);
      
      // Если есть сессия, проверяем права администратора
      if (hasSession) {
        const adminAccess = await checkAdminAccess();
        setIsAdmin(adminAccess);
      } else {
        setIsAdmin(null);
      }
    } else {
      setSupabaseSessionReady(null);
      setIsAdmin(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkSupabaseSession();
  }, [checkSupabaseSession]);

  // Перепроверяем сессию при возврате на страницу (например, после авторизации)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      checkSupabaseSession();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, checkSupabaseSession]);

  // Слушаем изменения авторизации Supabase для автоматического обновления
  useEffect(() => {
    if (!isAuthenticated) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Автоматически проверяем сессию при изменении состояния авторизации
        checkSupabaseSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated, checkSupabaseSession]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-base">
        <form
          onSubmit={handleLogin}
          className="card p-6 w-full max-w-sm"
        >
          <h1 className="text-xl font-semibold text-heading text-center mb-6">
            Админ-панель
          </h1>
          
          <input
            type="password"
            id="admin-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="submit"
            className="mt-4 w-full py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  // Показываем контент только если есть сессия Supabase
  if (isAuthenticated && supabaseSessionReady === false) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-heading">
            Админ-панель
          </h1>
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-heading mb-4">
            Требуется авторизация
          </h2>
          <p className="text-ink mb-6">
            Для доступа к админ-панели необходимо войти в аккаунт.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/account?returnTo=/admin"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Войти в аккаунт
            </Link>
            <button
              onClick={checkSupabaseSession}
              className="px-6 py-3 border border-secondary/40 rounded-xl font-medium hover:bg-secondary/50 transition-colors"
            >
              Проверить снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Показываем загрузку при проверке сессии или прав администратора
  if (isAuthenticated && (supabaseSessionReady === null || isAdmin === null)) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-heading">
            Админ-панель
          </h1>
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
  if (isAuthenticated && supabaseSessionReady === true && isAdmin === false) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-heading">
            Админ-панель
          </h1>
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
            Доступ запрещен
          </h2>
          <p className="text-ink mb-6">
            У вас нет прав для доступа к админ-панели. Обратитесь к администратору.
          </p>
          <button
            onClick={checkSupabaseSession}
            className="px-6 py-3 border border-secondary/40 rounded-xl font-medium hover:bg-secondary/50 transition-colors"
          >
            Проверить снова
          </button>
        </div>
      </div>
    );
  }

  const pendingReviews = getPendingReviews();
  const allReviews = getAllReviews();

  return (
    <div className="container-balanced mt-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-heading">
          Админ-панель
        </h1>
        <button
          onClick={() => logout()}
          className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/reviews"
          className="card p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-heading">Отзывы</h2>
          </div>
          <p className="text-muted text-sm mb-4">
            Модерация и управление отзывами пользователей
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">На модерации:</span>
            <span className="font-medium text-heading">{pendingReviews.length}</span>
            <span className="text-muted">•</span>
            <span className="text-muted">Всего:</span>
            <span className="font-medium text-heading">{allReviews.length}</span>
          </div>
        </Link>

        <Link
          to="/admin/promocodes"
          className="card p-6 hover:shadow-lg transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-heading">Промокоды</h2>
          </div>
          <p className="text-muted text-sm mb-4">
            Создание и управление промокодами
          </p>
        
        </Link>
      </div>
    </div>
  );
}
