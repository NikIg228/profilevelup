import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function Header() {
  const { isAuthenticated } = useAuthStore();

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
        <nav className="flex items-center gap-8">
          <Link
            to="/reviews"
            className="text-sm text-ink hover:text-primary transition-colors font-medium"
          >
            Отзывы
          </Link>
          <Link
            to="/about"
            className="text-sm text-ink hover:text-primary transition-colors font-medium"
          >
            О нас
          </Link>
          <Link
            to="/help"
            className="text-sm text-ink hover:text-primary transition-colors font-medium"
          >
            Поддержка
          </Link>
          <Link
            to="/account"
            className="text-sm text-ink hover:text-primary transition-colors font-medium"
          >
            {isAuthenticated ? 'Личный кабинет' : 'Войти'}
          </Link>
        </nav>
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

