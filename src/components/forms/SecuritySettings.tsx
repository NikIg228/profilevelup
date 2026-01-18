import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { Mail, Lock, Loader2, Check, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'email' | 'password';

export default function SecuritySettings() {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  
  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  const changeEmail = useAuthStore((state) => state.changeEmail);
  const changePassword = useAuthStore((state) => state.changePassword);
  const user = useAuthStore((state) => state.user);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setIsEmailLoading(true);

    const result = await changeEmail(newEmail, emailPassword);
    
    if (result.success) {
      setEmailSuccess(true);
      setNewEmail('');
      setEmailPassword('');
      setTimeout(() => setEmailSuccess(false), 3000);
    } else {
      setEmailError(result.error || 'Ошибка изменения email');
    }
    
    setIsEmailLoading(false);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setIsPasswordLoading(true);

    const result = await changePassword(oldPassword, newPassword);
    
    if (result.success) {
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(result.error || 'Ошибка изменения пароля');
    }
    
    setIsPasswordLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-secondary/40 shadow-sm overflow-hidden">
      {/* Header with tabs */}
      <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 border-b border-secondary/40">
        <div className="flex items-center justify-between p-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('email');
                setIsExpanded(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'email'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-heading hover:bg-secondary/20'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => {
                setActiveTab('password');
                setIsExpanded(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'password'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-heading hover:bg-secondary/20'
              }`}
            >
              <Lock className="w-4 h-4" />
              Пароль
            </button>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-secondary/20 transition-colors"
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">
          {activeTab === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label htmlFor="current-email" className="block text-xs font-medium text-muted mb-1">
                  Текущий email
                </label>
                <input
                  id="current-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-secondary/40 bg-secondary/10 text-ink opacity-70 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label htmlFor="new-email" className="block text-xs font-medium text-heading mb-1">
                  Новый email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="Ваш новый email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email-password" className="block text-xs font-medium text-heading mb-1">
                  Пароль для подтверждения
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="email-password"
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
                    aria-label={showEmailPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showEmailPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {emailError && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-600 text-xs flex items-center gap-2">
                  <Check className="w-3 h-3" />
                  Email успешно изменен
                </div>
              )}

              <button
                type="submit"
                disabled={isEmailLoading}
                className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Изменение...</span>
                  </>
                ) : (
                  'Изменить email'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label htmlFor="old-password" className="block text-xs font-medium text-heading mb-1">
                  Текущий пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="old-password"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
                    aria-label={showOldPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showOldPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-heading mb-1">
                  Новый пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="Минимум 6 символов"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
                    aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-medium text-heading mb-1">
                  Подтвердите новый пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-secondary/40 bg-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="Повторите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
                    aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-600 text-xs flex items-center gap-2">
                  <Check className="w-3 h-3" />
                  Пароль успешно изменен
                </div>
              )}

              <button
                type="submit"
                disabled={isPasswordLoading}
                className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Изменение...</span>
                  </>
                ) : (
                  'Изменить пароль'
                )}
              </button>
            </form>
          )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

