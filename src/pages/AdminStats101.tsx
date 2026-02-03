import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TARIFF_BASE_PRICES, hasSupabaseSession, getPriceWithPromo } from '../utils/promoApi';
import { DollarSign, TrendingUp, FileText, AlertCircle, ArrowLeft, Tag } from 'lucide-react';
import { checkAdminAccess } from '../utils/adminCheck';

type FilterPeriod = 'day' | 'week' | 'month' | 'custom';

interface PaidTestRecord {
  id: string;
  test_id: string;
  tariff: 'EXTENDED' | 'PREMIUM';
  created_at: string;
  user_id: string;
  status: string;
  promo_code?: string | null;
  promo_discount_percent?: number | null;
  promo_discount_fixed?: number | null;
  final_price?: number | null;
  price?: number | null;
}

interface Statistics {
  totalTests: number;
  extendedTests: number;
  premiumTests: number;
  totalRevenue: number;
  extendedRevenue: number;
  premiumRevenue: number;
}

export default function AdminStats101Page() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supabaseSessionReady, setSupabaseSessionReady] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [records, setRecords] = useState<PaidTestRecord[]>([]);

  const ADMIN_STATS_PASSWORD = import.meta.env.VITE_ADMIN_STATS101_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_STATS_PASSWORD) {
      alert('Пароль не настроен. Установите VITE_ADMIN_STATS101_PASSWORD в переменных окружения.');
      return;
    }
    if (password === ADMIN_STATS_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Неверный пароль');
    }
  };

  const checkAdminRights = useCallback(async () => {
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

  const getDateRange = useCallback((): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();

    switch (filterPeriod) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          end.setTime(new Date(customEndDate).getTime());
          end.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { start, end };
  }, [filterPeriod, customStartDate, customEndDate]);

  const loadStatistics = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();

      // Загружаем только оплаченные тесты из таблицы orders
      // Пробуем загрузить с полем price
      let { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, test_id, tariff, created_at, user_id, status, price')
        .eq('status', 'paid')
        .in('tariff', ['EXTENDED', 'PREMIUM'])
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      // Если поле price не существует, пробуем загрузить без него
      if (fetchError && (fetchError.message.includes('column') || fetchError.message.includes('does not exist'))) {
        const fallbackQuery = await supabase
          .from('orders')
          .select('id, test_id, tariff, created_at, user_id, status')
          .eq('status', 'paid')
          .in('tariff', ['EXTENDED', 'PREMIUM'])
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false });
        
        if (fallbackQuery.error) {
          throw new Error(fallbackQuery.error.message);
        }

        // Ensure every record has the "price" field set to null if missing, for type safety
        if (fallbackQuery.data) {
          data = fallbackQuery.data.map((item: any) => ({
            ...item,
            price: null,
          }));
        } else {
          data = [];
        }
        fetchError = null;
      }

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Добавляем null значения для полей промокодов и цен, так как их может не быть в таблице
      const paidTests: PaidTestRecord[] = (data || []).map((r: any) => ({
        ...r,
        promo_code: null,
        promo_discount_percent: null,
        promo_discount_fixed: null,
        final_price: null,
        price: r.price ?? null,
      }));

      // Рассчитываем статистику с учетом промокодов
      const extendedTests = paidTests.filter((t) => t.tariff === 'EXTENDED');
      const premiumTests = paidTests.filter((t) => t.tariff === 'PREMIUM');

      // Рассчитываем доходы с учетом реальных цен из таблицы orders
      const extendedRevenue = extendedTests.reduce((sum, test) => {
        // Используем price из таблицы orders, если оно есть
        if (test.price != null && test.price > 0) {
          return sum + test.price;
        }
        // Если цены нет в БД, используем базовую цену
        return sum + TARIFF_BASE_PRICES.EXTENDED;
      }, 0);

      const premiumRevenue = premiumTests.reduce((sum, test) => {
        // Используем price из таблицы orders, если оно есть
        if (test.price != null && test.price > 0) {
          return sum + test.price;
        }
        // Если цены нет в БД, используем базовую цену
        return sum + TARIFF_BASE_PRICES.PREMIUM;
      }, 0);

      const totalRevenue = extendedRevenue + premiumRevenue;

      setStats({
        totalTests: paidTests.length,
        extendedTests: extendedTests.length,
        premiumTests: premiumTests.length,
        totalRevenue,
        extendedRevenue,
        premiumRevenue,
      });

      setRecords(paidTests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getDateRange]);

  useEffect(() => {
    if (isAuthenticated && supabaseSessionReady) {
      loadStatistics();
    }
  }, [isAuthenticated, supabaseSessionReady, loadStatistics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFinalPrice = (record: PaidTestRecord): number => {
    // Используем price из таблицы orders, если оно есть
    if (record.price != null && record.price > 0) {
      return record.price;
    }
    
    // Иначе используем базовую цену
    return TARIFF_BASE_PRICES[record.tariff];
  };

  const getPromoInfo = (record: PaidTestRecord): { code: string; discount: string } | null => {
    // Поля промокодов отсутствуют в таблице orders, поэтому всегда возвращаем null
    // Если в будущем добавятся поля промокодов, можно будет их использовать здесь
    return null;
  };

  const getBasePrice = (record: PaidTestRecord): number => {
    return TARIFF_BASE_PRICES[record.tariff];
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-base">
        <form
          onSubmit={handleLogin}
          className="card p-6 w-full max-w-sm"
        >
          <h1 className="text-xl font-semibold text-heading text-center mb-6">
            Статистика
          </h1>
          
          <input
            type="password"
            id="admin-stats-password"
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

  // Проверка сессии Supabase
  if (isAuthenticated && supabaseSessionReady === false) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              title="Вернуться в админ-панель"
            >
              <ArrowLeft className="w-5 h-5 text-heading" />
            </Link>
            <h1 className="text-3xl font-semibold text-heading">
              Статистика оплаченных тестов
            </h1>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
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
            Для доступа к статистике необходимо войти в аккаунт.
          </p>
          <Link
            to="/account?returnTo=/admino101"
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  if (isAuthenticated && (supabaseSessionReady === null || isAdmin === null)) {
    return (
      <div className="container-balanced mt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              title="Вернуться в админ-панель"
            >
              <ArrowLeft className="w-5 h-5 text-heading" />
            </Link>
            <h1 className="text-3xl font-semibold text-heading">
              Статистика оплаченных тестов
            </h1>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
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
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              title="Вернуться в админ-панель"
            >
              <ArrowLeft className="w-5 h-5 text-heading" />
            </Link>
            <h1 className="text-3xl font-semibold text-heading">
              Статистика оплаченных тестов
            </h1>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
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
            У вас нет прав для доступа к статистике. Обратитесь к администратору.
          </p>
          <button
            onClick={checkAdminRights}
            className="px-6 py-3 border border-secondary/40 rounded-xl font-medium hover:bg-secondary/50 transition-colors"
          >
            Проверить снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-balanced mt-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            title="Вернуться в админ-панель"
          >
            <ArrowLeft className="w-5 h-5 text-heading" />
          </Link>
          <h1 className="text-3xl font-semibold text-heading">
            Статистика оплаченных тестов
          </h1>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-4 py-2 text-sm border border-secondary/40 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          Выйти
        </button>
      </div>

      {/* Фильтры */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-heading mb-2">
              Период
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
              className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="day">Сегодня</option>
              <option value="week">Последние 7 дней</option>
              <option value="month">Последний месяц</option>
              <option value="custom">Произвольный период</option>
            </select>
          </div>

          {filterPeriod === 'custom' && (
            <>
              <div className="min-w-[180px]">
                <label className="block text-sm font-medium text-heading mb-2">
                  От
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="min-w-[180px]">
                <label className="block text-sm font-medium text-heading mb-2">
                  До
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}

          <button
            onClick={loadStatistics}
            disabled={loading || (filterPeriod === 'custom' && (!customStartDate || !customEndDate))}
            className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-6 bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Статистика */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted">Всего тестов</p>
                  <p className="text-2xl font-bold text-heading">{stats.totalTests}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted">Extended</p>
                  <p className="text-2xl font-bold text-heading">{stats.extendedTests}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted">Premium</p>
                  <p className="text-2xl font-bold text-heading">{stats.premiumTests}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted">Общий оборот</p>
                  <p className="text-2xl font-bold text-heading">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Детальная статистика по доходам */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-heading mb-4">Доходы по тарифам</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Extended ({stats.extendedTests} тестов)</span>
                  <span className="font-semibold text-heading">{formatCurrency(stats.extendedRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Premium ({stats.premiumTests} тестов)</span>
                  <span className="font-semibold text-heading">{formatCurrency(stats.premiumRevenue)}</span>
                </div>
                <div className="pt-3 border-t border-secondary/40 flex justify-between items-center">
                  <span className="font-semibold text-heading">Итого</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-heading mb-4">Средние показатели</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Средний чек</span>
                  <span className="font-semibold text-heading">
                    {stats.totalTests > 0
                      ? formatCurrency(stats.totalRevenue / stats.totalTests)
                      : formatCurrency(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Цена Extended</span>
                  <span className="font-semibold text-heading">{formatCurrency(TARIFF_BASE_PRICES.EXTENDED)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Цена Premium</span>
                  <span className="font-semibold text-heading">{formatCurrency(TARIFF_BASE_PRICES.PREMIUM)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Таблица записей */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-secondary/40 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-heading">Список оплаченных тестов</h3>
              <span className="text-sm text-muted">{records.length} записей</span>
            </div>
            {records.length === 0 ? (
              <div className="p-8 text-center text-muted">
                Нет данных за выбранный период
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-secondary/40 bg-secondary/20">
                      <th className="p-3 font-medium text-heading">Дата</th>
                      <th className="p-3 font-medium text-heading">Тариф</th>
                      <th className="p-3 font-medium text-heading">Промокод</th>
                      <th className="p-3 font-medium text-heading">Базовая цена</th>
                      <th className="p-3 font-medium text-heading">Конечная цена</th>
                      <th className="p-3 font-medium text-heading">Test ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const finalPrice = getFinalPrice(record);
                      const basePrice = getBasePrice(record);
                      const hasDiscount = finalPrice < basePrice;
                      
                      return (
                        <tr key={record.id} className="border-b border-secondary/40 hover:bg-secondary/10">
                          <td className="p-3 text-ink">{formatDate(record.created_at)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                record.tariff === 'EXTENDED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {record.tariff}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-muted text-sm">—</span>
                          </td>
                          <td className="p-3">
                            <span className={`text-sm ${hasDiscount ? 'line-through text-muted' : 'font-semibold text-heading'}`}>
                              {formatCurrency(basePrice)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`font-semibold ${hasDiscount ? 'text-green-600' : 'text-heading'}`}>
                              {formatCurrency(finalPrice)}
                            </span>
                            {hasDiscount && (
                              <div className="text-xs text-green-600 mt-1">
                                Экономия: {formatCurrency(basePrice - finalPrice)}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-sm text-muted">{record.test_id}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
