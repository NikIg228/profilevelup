import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from '../contexts/LenisContext';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  hideScrollbar?: boolean;
};

export default function Modal({ open, onClose, children, hideScrollbar = false }: ModalProps) {
  const lenis = useLenis();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      // Блокируем скролл body при открытии модального окна
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflowY = 'hidden';
      // Сохраняем позицию скролла
      document.body.setAttribute('data-scroll-y', scrollY.toString());
      
      // Временно останавливаем Lenis, если он активен
      if (lenis) {
        lenis.stop();
      }
      
      // Предотвращаем перехват событий скролла Lenis внутри модального окна
      const handleWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.modal-scroll-container')) {
          e.stopPropagation();
        }
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.modal-scroll-container')) {
          e.stopPropagation();
        }
      };
      
      window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      
      return () => {
        window.removeEventListener('wheel', handleWheel, { capture: true });
        window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      };
    } else {
      // Убираем блокировку скролла
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Восстанавливаем позицию скролла БЕЗ анимации (чтобы не было автоскролла)
      // Используем requestAnimationFrame для синхронизации с рендером
      requestAnimationFrame(() => {
        if (scrollY) {
          const scrollPosition = parseInt(scrollY || '0');
          // Используем scrollTo с behavior: 'auto' для мгновенного восстановления БЕЗ анимации
          if (lenis) {
            lenis.start();
            // Не используем lenis.scrollTo, чтобы избежать автоскролла
            // Вместо этого используем нативный scrollTo
            window.scrollTo({ top: scrollPosition, behavior: 'auto' });
          } else {
            window.scrollTo({ top: scrollPosition, behavior: 'auto' });
          }
        } else if (lenis) {
          lenis.start();
        }
      });
    }
    return () => {
      // Cleanup при размонтировании
      if (!open) {
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflowY = '';
        document.body.removeAttribute('data-scroll-y');
        if (lenis) {
          lenis.start();
        }
      }
    };
  }, [open, lenis]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`card w-full max-w-lg flex flex-col max-h-[90vh] my-auto ${hideScrollbar ? 'scrollbar-hide' : 'modal-scrollbar'}`}
            style={{ 
              minHeight: 0,
              height: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-6 modal-scroll-container"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                minHeight: 0
              }}
              onWheel={(e) => {
                // Предотвращаем всплытие события скролла, чтобы Lenis не перехватывал его
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                // Предотвращаем всплытие touch-событий
                e.stopPropagation();
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


