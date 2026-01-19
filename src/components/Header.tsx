import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollLockManager } from '../utils/scrollLock';
import { useAuthStore } from '../stores/useAuthStore';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const menuId = 'mobile-menu-drawer';

  // Блокируем скролл body при открытом меню на мобильных через менеджер
  useEffect(() => {
    if (open) {
      scrollLockManager.lock('header');
      // Блокируем скролл body
      document.body.style.overflow = 'hidden';
    } else {
      scrollLockManager.unlock('header');
      document.body.style.overflow = '';
    }
    
    return () => {
      scrollLockManager.unlock('header');
      document.body.style.overflow = '';
    };
  }, [open]);

  // Обработка ESC для закрытия меню
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  // Отслеживание скролла для изменения стиля header
  useEffect(() => {
    const handleScroll = () => {
      try {
        setIsScrolled(window.scrollY > 8);
      } catch (error) {
        // Игнорируем ошибки скролла (могут быть связаны с расширениями браузера)
        if (import.meta.env.DEV) {
          console.warn('Error in scroll handler:', error);
        }
      }
    };

    try {
      window.addEventListener('scroll', handleScroll, { passive: true });
      // Проверяем начальное состояние
      handleScroll();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Error setting up scroll listener:', error);
      }
    }

    return () => {
      try {
        window.removeEventListener('scroll', handleScroll);
      } catch (error) {
        // Игнорируем ошибки при cleanup
        if (import.meta.env.DEV) {
          console.warn('Error removing scroll listener:', error);
        }
      }
    };
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center ${
      isActive ? 'text-primary bg-primary/10' : 'text-heading hover:text-primary hover:bg-secondary/40'
    }`;

  // Специальный класс для кнопки "Войти" на desktop - выделенная и отодвинутая
  const accountLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-5 py-2.5 rounded-lg text-base font-semibold transition-all min-h-[44px] flex items-center ml-6 ${
      isActive 
        ? 'text-white bg-primary shadow-soft' 
        : 'text-white bg-primary hover:bg-primary-hover shadow-soft hover:shadow-hover'
    }`;

  return (
    <header 
      id="site-header"
      data-site-header="true"
      className={`fixed top-0 inset-x-0 z-50 header-base ${isScrolled ? 'is-scrolled' : ''}`}
    >
      <div className="container-balanced h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/headerlogo.png"
            alt="Логотип Профиль будущего"
            className="w-10 h-10 rounded-full object-cover shadow-soft border border-secondary/50"
            loading="lazy"
          />
          <span className="hidden sm:block text-lg font-sans text-heading font-normal uppercase tracking-wide">PROFILEVELUP</span>
        </Link>

        <div className="hidden lg:flex items-center">
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>Главная</NavLink>
            <NavLink to="/reviews" className={navLinkClass}>Отзывы</NavLink>
            <NavLink to="/about" className={navLinkClass}>О нас</NavLink>
            <NavLink to="/help" className={navLinkClass}>Поддержка</NavLink>
          </nav>
          <NavLink to="/account" className={accountLinkClass}>
            {isAuthenticated ? 'Личный кабинет' : 'Войти'}
          </NavLink>
        </div>

        <button
          className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-secondary/40 active:bg-secondary/60 text-heading font-medium min-h-[44px] min-w-[44px] touch-manipulation transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          aria-controls={menuId}
        >
          {open ? (
            <>
              <X className="w-5 h-5" />
              <span className="lg:hidden">Закрыть</span>
            </>
          ) : (
            <>
              <Menu className="w-5 h-5" />
              <span className="lg:hidden">Меню</span>
            </>
          )}
        </button>
      </div>

      {/* Мобильное меню через Portal - вынесено из header */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop - затемнение фона (покрывает весь экран) */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100vh',
                }}
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>

          {/* Боковое меню справа (30-40% ширины экрана) */}
          <AnimatePresence>
            {open && (
              <motion.aside
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="lg:hidden fixed top-0 right-0 bg-base shadow-2xl z-[9999] overflow-y-auto mobile-drawer"
                style={{
                  width: 'clamp(280px, 38vw, 360px)',
                  maxWidth: '360px',
                  height: '100vh',
                }}
                id={menuId}
                role="dialog"
                aria-modal="true"
                aria-label="Меню навигации"
              >
                <div className="flex flex-col h-full w-full drawer-container">
                  {/* Заголовок меню с кнопкой закрытия */}
                  <div className="flex items-center justify-between p-4 border-b border-secondary flex-shrink-0 drawer-header">
                    <span className="text-lg font-semibold text-heading">Меню</span>
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-lg hover:bg-secondary/40 active:bg-secondary/60 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Закрыть меню"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Навигационные ссылки - центрированы по вертикали */}
                  <nav className="flex-1 flex flex-col justify-center px-4 py-4 overflow-y-auto drawer-nav">
                    <div className="flex flex-col gap-4 drawer-nav-links">
                      <NavLink 
                        to="/" 
                        onClick={() => setOpen(false)} 
                        className={({ isActive }) => navLinkClass({ isActive })}
                      >
                        Главная
                      </NavLink>
                      <NavLink 
                        to="/reviews" 
                        onClick={() => setOpen(false)} 
                        className={({ isActive }) => navLinkClass({ isActive })}
                      >
                        Отзывы
                      </NavLink>
                      <NavLink 
                        to="/about" 
                        onClick={() => setOpen(false)} 
                        className={({ isActive }) => navLinkClass({ isActive })}
                      >
                        О нас
                      </NavLink>
                      <NavLink 
                        to="/help" 
                        onClick={() => setOpen(false)} 
                        className={({ isActive }) => navLinkClass({ isActive })}
                      >
                        Поддержка
                      </NavLink>
                    </div>

                    {/* Отдельный блок для кнопки авторизации */}
                    <div className="drawer-auth mt-10">
                      <NavLink 
                        to="/account" 
                        onClick={() => setOpen(false)} 
                        className={({ isActive }) => `drawer-login-button ${isActive ? 'drawer-login-button-active' : ''}`}
                      >
                        {isAuthenticated ? 'Личный кабинет' : 'Войти'}
                      </NavLink>
                    </div>
                  </nav>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </header>
  );
}


