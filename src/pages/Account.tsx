import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';
import ForgotPasswordForm from '../components/forms/ForgotPasswordForm';
import ChangeNameForm from '../components/forms/ChangeNameForm';
import { logger } from '../utils/logger';
import { User, LogOut, Check, FileText, Download } from 'lucide-react';
import { tariffToTestType } from '../utils/testTypeMapping';
import { checkReportJobStatus } from '../utils/reportApi';

type ViewMode = 'login' | 'register' | 'forgot-password' | 'account';

function ReportCard({ report }: { report: TestReportCard }) {
  const [downloading, setDownloading] = useState(false);
  const handleDownload = useCallback(async () => {
    if (report.status !== 'completed') return;
    setDownloading(true);
    try {
      const res = await checkReportJobStatus(report.jobId);
      if (res.childUrl) window.open(res.childUrl, '_blank');
      if (res.parentUrl) window.open(res.parentUrl, '_blank');
    } catch (e) {
      logger.error('Ошибка получения ссылки на отчёт:', e);
    } finally {
      setDownloading(false);
    }
  }, [report.jobId, report.status]);
  return (
    <div className="bg-white rounded-xl p-5 border border-secondary/40 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-heading mb-1">
            {tariffToTestType(report.tariff)}
          </h3>
          <p className="text-sm text-muted mb-2">
            Пройден: {new Date(report.completedAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {report.status && (
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                report.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : report.status === 'pending' || report.status === 'processing'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {report.status === 'completed'
                ? 'Готов'
                : report.status === 'processing'
                ? 'В обработке'
                : report.status === 'pending'
                ? 'В очереди'
                : 'Ошибка'}
            </span>
          )}
        </div>
        {report.status === 'completed' && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            {downloading ? '…' : 'Скачать'}
          </button>
        )}
      </div>
    </div>
  );
}

/** Карточка отчёта по пройденному тесту (из Supabase reports) */
export interface TestReportCard {
  id: string;
  jobId: string;
  testId: string;
  tariff: 'FREE' | 'EXTENDED' | 'PREMIUM';
  completedAt: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function AccountPage() {
  const { user, isAuthenticated, logout, checkSession } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [reports, setReports] = useState<TestReportCard[]>([]);

  // Проверяем сессию при загрузке
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Обработка подтверждения изменения email и пароля
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Проверяем URL параметры для подтверждения изменения email
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');

      // Обработка подтверждения изменения email
      // Supabase автоматически обрабатывает токен через URL hash при загрузке страницы
      if (accessToken && (type === 'email_change' || type === 'email')) {
        try {
          // Обновляем сессию, чтобы получить обновленный email
          await checkSession();
          setEmailConfirmed(true);
          // Очищаем URL
          window.history.replaceState({}, document.title, '/account');
          // Скрываем сообщение через 5 секунд
          setTimeout(() => setEmailConfirmed(false), 5000);
        } catch (error) {
          logger.error('Ошибка при подтверждении email:', error);
        }
      }

      // Обработка подтверждения смены пароля
      if (mode === 'change-password' && accessToken) {
        try {
          const pendingPassword = sessionStorage.getItem('pending_password_change');
          
          if (!pendingPassword) {
            logger.error('Новый пароль не найден в sessionStorage');
            window.history.replaceState({}, document.title, '/account');
            return;
          }

          // Обновляем пароль
          const { error } = await supabase.auth.updateUser({
            password: pendingPassword
          });

          if (error) {
            logger.error('Ошибка изменения пароля:', error);
            sessionStorage.removeItem('pending_password_change');
            window.history.replaceState({}, document.title, '/account');
            return;
          }

          // Пароль успешно изменен
          sessionStorage.removeItem('pending_password_change');
          setPasswordChanged(true);
          window.history.replaceState({}, document.title, '/account');
          
          // Обновляем сессию
          await checkSession();
          // Скрываем сообщение через 5 секунд
          setTimeout(() => setPasswordChanged(false), 5000);
        } catch (error) {
          logger.error('Ошибка при изменении пароля:', error);
          sessionStorage.removeItem('pending_password_change');
          window.history.replaceState({}, document.title, '/account');
        }
      }
    };

    handleAuthCallback();
  }, [checkSession]);

  // Обновляем viewMode при изменении авторизации
  useEffect(() => {
    if (isAuthenticated) {
      setViewMode('account');
    } else {
      setViewMode('login');
    }
  }, [isAuthenticated]);

  // Загрузка отчётов из Supabase (таблица reports, RLS по user_id)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setReports([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('id, job_id, test_id, tariff, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (error) {
          logger.error('Ошибка загрузки отчётов:', error);
          setReports([]);
          return;
        }
        const cards: TestReportCard[] = (data || []).map((row: { id: string; job_id: string; test_id: string; tariff: string; status: string; created_at: string }) => ({
          id: row.id,
          jobId: row.job_id,
          testId: row.test_id,
          tariff: row.tariff as 'FREE' | 'EXTENDED' | 'PREMIUM',
          completedAt: row.created_at,
          status: (row.status as 'pending' | 'processing' | 'completed' | 'failed') || undefined,
        }));
        setReports(cards);
      } catch (e) {
        if (!cancelled) {
          logger.error('Ошибка загрузки отчётов:', e);
          setReports([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const handleLogout = async () => {
    await logout();
    setViewMode('login');
  };

  // Если не авторизован, показываем формы входа/регистрации
  if (!isAuthenticated) {
    return (
      <div className="container-balanced py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <User className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-heading mb-2">Личный кабинет</h1>
            <p className="text-muted">Войдите или зарегистрируйтесь</p>
          </div>

          <div className="bg-secondary/20 rounded-2xl p-6 border border-secondary">
            {viewMode === 'login' ? (
              <LoginForm
                onSuccess={() => {
                  setViewMode('account');
                  setRegisteredEmail(''); // Очищаем email после успешного входа
                }}
                onSwitchToRegister={() => {
                  setViewMode('register');
                  setRegisteredEmail(''); // Очищаем email при переключении
                }}
                onForgotPassword={() => setViewMode('forgot-password')}
                initialEmail={registeredEmail}
              />
            ) : viewMode === 'register' ? (
              <RegisterForm
                onSuccess={() => setViewMode('account')}
                onSwitchToLogin={(email) => {
                  setRegisteredEmail(email || '');
                  setViewMode('login');
                }}
              />
            ) : (
              <ForgotPasswordForm
                onBack={() => setViewMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Если авторизован, показываем личный кабинет
  return (
      <div className="container-balanced py-8">
      <div className="max-w-3xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-heading mb-1">Личный кабинет</h1>
          <p className="text-sm text-muted">Управление профилем и история тестов</p>
        </div>

        {/* Уведомления об успешном подтверждении */}
        {emailConfirmed && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 flex items-start gap-3">
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Email успешно изменен!</p>
              <p className="text-sm">Ваш email был обновлен на {user?.email}</p>
            </div>
          </div>
        )}

        {passwordChanged && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 flex items-start gap-3">
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Пароль успешно изменен!</p>
              <p className="text-sm">Ваш пароль был обновлен</p>
            </div>
          </div>
        )}

        {/* Информация о пользователе */}
        <div className="bg-white rounded-xl p-4 border border-secondary/40 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <ChangeNameForm />
                <p className="text-xs text-muted mt-1">
                  {user?.email} • Зарегистрирован: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>

        {/* Отчёты по пройденным тестам */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Отчёты по пройденным тестам
          </h2>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-secondary/40 shadow-sm text-center">
              <FileText className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted mb-1">Пока нет отчётов</p>
              <p className="text-sm text-muted">
                Пройдите тест, чтобы здесь появилась карточка с отчётом.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
