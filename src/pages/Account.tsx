import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';
import ChangeEmailForm from '../components/forms/ChangeEmailForm';
import ChangePasswordForm from '../components/forms/ChangePasswordForm';
import ChangeNameForm from '../components/forms/ChangeNameForm';
import ForgotPasswordForm from '../components/forms/ForgotPasswordForm';
import TestHistory from '../components/TestHistory';
import { User, LogOut, Settings, History } from 'lucide-react';

type ViewMode = 'login' | 'register' | 'forgot-password' | 'account';
type AccountSection = 'settings' | 'history';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>(isAuthenticated ? 'account' : 'login');
  const [section, setSection] = useState<AccountSection>('settings');

  const handleLogout = () => {
    logout();
    setViewMode('login');
  };

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
                onSuccess={() => setViewMode('account')}
                onSwitchToRegister={() => setViewMode('register')}
                onForgotPassword={() => setViewMode('forgot-password')}
              />
            ) : viewMode === 'register' ? (
              <RegisterForm
                onSuccess={() => setViewMode('account')}
                onSwitchToLogin={() => setViewMode('login')}
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

  return (
    <div className="container-balanced py-8">
      <div className="max-w-3xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-heading mb-1">Личный кабинет</h1>
          <p className="text-sm text-muted">Управление профилем и история тестов</p>
        </div>

        {/* Информация о пользователе */}
        <div className="bg-secondary/20 rounded-xl p-4 border border-secondary mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
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
              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>

        {/* Навигация по разделам */}
        <div className="flex gap-2 mb-4 border-b border-secondary">
          <button
            onClick={() => setSection('settings')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 text-sm ${
              section === 'settings'
                ? 'bg-secondary/20 text-primary border-b-2 border-primary'
                : 'text-muted hover:text-heading'
            }`}
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
          <button
            onClick={() => setSection('history')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 text-sm ${
              section === 'history'
                ? 'bg-secondary/20 text-primary border-b-2 border-primary'
                : 'text-muted hover:text-heading'
            }`}
          >
            <History className="w-4 h-4" />
            История тестов
          </button>
        </div>

        {/* Контент */}
        {section === 'settings' ? (
          <div className="grid md:grid-cols-2 gap-4">
            <ChangeNameForm />
            <ChangeEmailForm />
            <div className="md:col-span-2">
              <ChangePasswordForm />
            </div>
          </div>
        ) : (
          <TestHistory />
        )}
      </div>
    </div>
  );
}

