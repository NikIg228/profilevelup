import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [open, setOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-heading hover:text-primary'
    }`;

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-base/80 backdrop-blur border-b border-secondary">
      <div className="container-balanced h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Логотип Профиль будущего"
            className="w-10 h-10 rounded-full object-cover shadow-soft border border-secondary/50"
            loading="lazy"
          />
          <span className="text-lg font-heading text-heading font-semibold">Профиль будущего</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={navLinkClass}>Главная</NavLink>
          <NavLink to="/reviews" className={navLinkClass}>Отзывы</NavLink>
          <NavLink to="/about" className={navLinkClass}>О нас</NavLink>
          <NavLink to="/help" className={navLinkClass}>Помощь</NavLink>
        </nav>

        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary/40 text-heading"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
        >
          {open ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-secondary bg-base">
          <div className="container-balanced py-2 grid gap-2">
            <NavLink to="/" onClick={() => setOpen(false)} className={navLinkClass}>Главная</NavLink>
            <NavLink to="/reviews" onClick={() => setOpen(false)} className={navLinkClass}>Отзывы</NavLink>
            <NavLink to="/about" onClick={() => setOpen(false)} className={navLinkClass}>О нас</NavLink>
            <NavLink to="/help" onClick={() => setOpen(false)} className={navLinkClass}>Помощь</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}


