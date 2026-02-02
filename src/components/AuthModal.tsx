import { useState, useCallback } from 'react';
import Modal from './Modal';
import LoginForm from './forms/LoginForm';
import RegisterForm from './forms/RegisterForm';
import ForgotPasswordForm from './forms/ForgotPasswordForm';
import { useAuthStore } from '../stores/useAuthStore';

type AuthTab = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loginInitialEmail, setLoginInitialEmail] = useState('');

  const handleLoginSuccess = useCallback(() => {
    if (useAuthStore.getState().isAuthenticated) {
      onAuthSuccess();
    }
  }, [onAuthSuccess]);

  const handleRegisterSuccess = useCallback(() => {
    if (useAuthStore.getState().isAuthenticated) {
      onAuthSuccess();
    }
  }, [onAuthSuccess]);

  const handleClose = useCallback(() => {
    setTab('login');
    onClose();
  }, [onClose]);

  return (
    <Modal open={open} onClose={handleClose} hideScrollbar>
      <div className="pt-2">
        {tab === 'forgot' ? (
          <ForgotPasswordForm onBack={() => setTab('login')} />
        ) : (
          <>
            <h2 className="text-xl font-semibold text-heading mb-1 text-center">
              {tab === 'login' ? 'Вход' : 'Регистрация'}
            </h2>
            <p className="text-sm text-muted text-center mb-6">
              {tab === 'login'
                ? 'Войдите, чтобы начать тест'
                : 'Создайте аккаунт, чтобы начать тест'}
            </p>

            {tab === 'login' ? (
              <LoginForm
                initialEmail={loginInitialEmail}
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={() => {
                  setLoginInitialEmail('');
                  setTab('register');
                }}
                onForgotPassword={() => setTab('forgot')}
              />
            ) : (
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={(email?) => {
                  setLoginInitialEmail(email || '');
                  setTab('login');
                }}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
