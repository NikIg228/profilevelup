import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export default function Header() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/reviews', label: 'Отзывы' },
    { to: '/about', label: 'О нас' },
    { to: '/help', label: 'Поддержка' },
  ];

  // Ссылки для мобильного меню (с главной страницей первой)
  const mobileNavLinks = [
    { to: '/', label: 'Главная' },
    ...navLinks,
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Закрываем меню при изменении маршрута
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Блокируем скролл body когда меню открыто
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = (to: string) => {
    navigate(to);
    setIsMenuOpen(false);
  };

  const headerContent = (
    <>
      {/* Мобильная версия header - логотип слева, бургер справа */}
      <header
        data-site-header
        className="header-base flex lg:hidden fixed top-0 left-0 right-0 w-full"
      >
        <div className="header-container flex items-center justify-between h-14">
          {/* Логотип и название - слева */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            aria-label="Перейти на главную страницу"
          >
            <img
              src="/headerlogo.png"
              alt="ProfiLevelUp"
              className="h-8 w-auto"
              loading="eager"
            />
            <span className="font-heading text-heading text-base font-semibold">
              PROFILEVELUP
            </span>
          </Link>

          {/* Кнопка бургер-меню - справа */}
          <button
            onClick={toggleMenu}
            className="flex flex-col justify-center items-center w-10 h-10 gap-1.5 p-2 rounded-lg hover:bg-[#F3EEE2] transition-colors"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            <span
              className={`w-6 h-0.5 bg-heading transition-all duration-300 origin-center ${
                isMenuOpen ? 'rotate-45 translate-y-2.5' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-heading transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-heading transition-all duration-300 origin-center ${
                isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Мобильное меню (drawer) */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={toggleMenu}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            role="dialog"
            aria-label="Меню навигации"
            aria-modal="true"
            className={`mobile-drawer bg-base z-50 transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="drawer-container p-6">
              {/* Заголовок drawer с кнопкой закрытия */}
              <div className="drawer-header flex items-center justify-between mb-8">
                <h2 className="font-heading text-heading text-xl font-semibold">
                  Меню
                </h2>
                <button
                  onClick={toggleMenu}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F3EEE2] transition-colors"
                  aria-label="Закрыть меню"
                >
                  <svg
                    className="w-6 h-6 text-heading"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Навигационные ссылки */}
              <nav className="drawer-nav">
                <div className="drawer-nav-links">
                  {mobileNavLinks.map((link) => {
                    const active = isActive(link.to);
                    return (
                      <button
                        key={link.to}
                        onClick={() => handleLinkClick(link.to)}
                        className={`w-full text-left ${
                          active
                            ? 'text-primary font-semibold bg-[#F3EEE2]'
                            : 'text-ink hover:bg-[#F3EEE2]'
                        }`}
                      >
                        {link.label}
                      </button>
                    );
                  })}
                </div>

                {/* Кнопка входа/личного кабинета */}
                <div className="drawer-auth">
                  <button
                    onClick={() => handleLinkClick('/account')}
                    className="drawer-login-button w-full"
                  >
                    {isAuthenticated ? 'Личный кабинет' : 'Войти'}
                  </button>
                </div>
              </nav>
            </div>
          </aside>
        </>
      )}

      {/* Десктопная версия header */}
      <header
        data-site-header
        className="header-base hidden lg:flex fixed top-0 left-0 right-0 w-full"
      >
        <div className="header-container flex items-center justify-between h-16">
          {/* Логотип и название */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Перейти на главную страницу"
          >
            <img
              src="/headerlogo.png"
              alt="ProfiLevelUp"
              className="h-10 w-auto"
              loading="eager"
            />
            <span className="font-heading text-heading text-xl font-semibold">
              PROFILEVELUP
            </span>
          </Link>

          {/* Навигационные ссылки */}
          <div className="flex items-center gap-6">
            {/* Основные ссылки - ближе к центру */}
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-sm font-medium transition-all duration-200 relative px-4 py-2 rounded-lg ${
                      active
                        ? 'text-primary font-semibold bg-[#F3EEE2]'
                        : 'text-ink hover:bg-[#F3EEE2]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Кнопка "Войти" - справа с золотым фоном */}
            <Link
              to="/account"
              className="text-sm font-medium text-white bg-primary hover:bg-[#9E7F3A] px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isAuthenticated ? 'Личный кабинет' : 'Войти'}
            </Link>
          </div>
        </div>
      </header>
    </>
  );

  // Рендерим через портал в body, чтобы избежать проблем с transform от Lenis
  if (typeof document !== 'undefined') {
    return createPortal(headerContent, document.body);
  }

  // SSR fallback
  return headerContent;
}

