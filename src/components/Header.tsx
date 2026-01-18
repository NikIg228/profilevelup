import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollLockManager } from '../utils/scrollLock';
import { useAuthStore } from '../stores/useAuthStore';

export default function Header() {
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Блокируем скролл body при открытом меню на мобильных через менеджер
  useEffect(() => {
    if (open) {
      scrollLockManager.lock('header');
    } else {
      scrollLockManager.unlock('header');
    }
    
    return () => {
      scrollLockManager.unlock('header');
    };
  }, [open]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center ${
      isActive ? 'text-primary bg-primary/10' : 'text-heading hover:text-primary hover:bg-secondary/40'
    }`;

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-base/80 backdrop-blur border-b border-secondary">
      <div className="container-balanced h-16 flex items-center justify-between">
        <Link to="/" className="hidden md:flex items-center gap-2">
          <img
            src="/headerlogo.png"
            alt="Логотип Профиль будущего"
            className="w-10 h-10 rounded-full object-cover shadow-soft border border-secondary/50"
            loading="lazy"
          />
          <span className="text-lg font-sans text-heading font-normal uppercase tracking-wide">PROFILEVELUP</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={navLinkClass}>Главная</NavLink>
          <NavLink to="/reviews" className={navLinkClass}>Отзывы</NavLink>
          <NavLink to="/about" className={navLinkClass}>О нас</NavLink>
          <NavLink to="/help" className={navLinkClass}>Поддержка</NavLink>
          <NavLink to="/account" className={navLinkClass}>
            {isAuthenticated ? 'Личный кабинет' : 'Войти'}
          </NavLink>
        </nav>

        <button
          className="md:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-secondary/40 active:bg-secondary/60 text-heading font-medium min-h-[44px] min-w-[44px] touch-manipulation transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
        >
          {open ? (
            <>
              <X className="w-5 h-5" />
              <span className="md:hidden">Закрыть</span>
            </>
          ) : (
            <>
              <Menu className="w-5 h-5" />
              <span className="md:hidden">Меню</span>
            </>
          )}
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] top-16"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Мобильное меню с анимацией */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden border-t border-secondary bg-base z-[100] relative"
          >
            <div className="container-balanced py-4 grid gap-1">
              <NavLink 
                to="/" 
                onClick={() => setOpen(false)} 
                className={navLinkClass}
              >
                Главная
              </NavLink>
              <NavLink 
                to="/reviews" 
                onClick={() => setOpen(false)} 
                className={navLinkClass}
              >
                Отзывы
              </NavLink>
              <NavLink 
                to="/about" 
                onClick={() => setOpen(false)} 
                className={navLinkClass}
              >
                О нас
              </NavLink>
              <NavLink 
                to="/help" 
                onClick={() => setOpen(false)} 
                className={navLinkClass}
              >
                Поддержка
              </NavLink>
              <NavLink 
                to="/account" 
                onClick={() => setOpen(false)} 
                className={navLinkClass}
              >
                {isAuthenticated ? 'Личный кабинет' : 'Войти'}
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


