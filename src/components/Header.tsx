import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function Header() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const navLinks = [
    { to: '/reviews', label: 'Отзывы' },
    { to: '/about', label: 'О нас' },
    { to: '/help', label: 'Поддержка' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const headerContent = (
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
  );

  // Рендерим через портал в body, чтобы избежать проблем с transform от Lenis
  if (typeof document !== 'undefined') {
    return createPortal(headerContent, document.body);
  }

  // SSR fallback
  return headerContent;
}

