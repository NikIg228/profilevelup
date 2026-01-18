import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';
import ForgotPasswordForm from '../components/forms/ForgotPasswordForm';
import ChangeEmailForm from '../components/forms/ChangeEmailForm';
import ChangePasswordForm from '../components/forms/ChangePasswordForm';
import TestHistory from '../components/TestHistory';
import { User, LogOut, History, Settings } from 'lucide-react';

type ViewMode = 'login' | 'register' | 'forgot-password' | 'account';
type AccountSection = 'settings' | 'history';

export default function AccountPage() {
  const { user, isAuthenticated, logout, checkSession } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [section, setSection] = useState<AccountSection>('history');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  // Проверяем сессию при загрузке
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Обновляем viewMode при изменении авторизации
  useEffect(() => {
    if (isAuthenticated) {
      setViewMode('account');
    } else {
      setViewMode('login');
    }
  }, [isAuthenticated]);

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

        {/* Информация о пользователе */}
        <div className="bg-white rounded-xl p-4 border border-secondary/40 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-heading">
                  {user?.fullName || user?.email}
                </h2>
                <p className="text-xs text-muted">
                  {user?.email} • Зарегистрирован: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>

        {/* Навигация по разделам */}
        <div className="flex gap-2 mb-4 border-b border-secondary/40">
          <button
            onClick={() => setSection('settings')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 text-sm ${
              section === 'settings'
                ? 'bg-white text-primary border-b-2 border-primary shadow-sm'
                : 'text-muted hover:text-heading hover:bg-secondary/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
          <button
            onClick={() => setSection('history')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 text-sm ${
              section === 'history'
                ? 'bg-white text-primary border-b-2 border-primary shadow-sm'
                : 'text-muted hover:text-heading hover:bg-secondary/10'
            }`}
          >
            <History className="w-4 h-4" />
            История тестов
          </button>
        </div>

        {/* Контент */}
        {section === 'settings' ? (
          <div className="grid md:grid-cols-2 gap-4">
            <ChangeEmailForm />
            <ChangePasswordForm />
          </div>
        ) : (
          <TestHistory />
        )}
      </div>
    </div>
  );
}
