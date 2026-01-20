import { ReactNode, useEffect, useState, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLenis } from '../contexts/LenisContext';
import { isMobile } from '../utils/device';
import { scrollLockManager } from '../utils/scrollLock';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  hideScrollbar?: boolean;
};

function Modal({ open, onClose, children, hideScrollbar = false }: ModalProps) {
  const lenis = useLenis();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);
  const minSwipeDistance = 50;
  // Управление фокусом при открытии модального окна
  useEffect(() => {
    if (!open || !modalRef.current) return;

    // Находим все фокусируемые элементы внутри модального окна
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current = focusableElements[focusableElements.length - 1];
      
      // Фокусируемся на первом элементе
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }

    // Обработка Tab для trap focus
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    // Обработка Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleTabKey);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleTabKey);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      // Блокируем скролл через менеджер
      scrollLockManager.lock('modal');
      
      // Временно останавливаем Lenis, если он активен
      if (lenis) {
        lenis.stop();
      }
      
      // Предотвращаем перехват событий скролла Lenis внутри модального окна
      // Используем passive: true для лучшей производительности
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
      
      window.addEventListener('wheel', handleWheel, { passive: true, capture: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true });
      
      return () => {
        window.removeEventListener('wheel', handleWheel, { capture: true });
        window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      };
    } else {
      // Разблокируем скролл через менеджер
      scrollLockManager.unlock('modal');
      
      // Восстанавливаем Lenis
      if (lenis) {
        lenis.start();
      }
    }
    
    return () => {
      // Cleanup при размонтировании
      scrollLockManager.unlock('modal');
      if (lenis) {
        lenis.start();
      }
    };
  }, [open, lenis]);

  // Обработка swipe down для закрытия модального окна на мобильных
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile()) return;
    const touch = e.targetTouches[0];
    setTouchEnd(null);
    setTouchStart(touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile() || touchStart === null) return;
    const touch = e.targetTouches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - touchStart;
    
    // Разрешаем swipe down только если скролл вверху
    const scrollContainer = e.currentTarget.closest('.modal-scroll-container') as HTMLElement;
    if (scrollContainer && scrollContainer.scrollTop === 0 && deltaY > 0) {
      setDragY(Math.min(deltaY, 200)); // Ограничиваем максимальное смещение
    } else {
      setDragY(0);
    }
    
    setTouchEnd(currentY);
  };

  const onTouchEnd = () => {
    if (!isMobile() || touchStart === null || touchEnd === null) {
      setTouchStart(null);
      setTouchEnd(null);
      setDragY(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -minSwipeDistance;
    
    // Закрываем модальное окно при swipe down, если начали сверху
    if (isDownSwipe && touchStart < 100) {
      onClose();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setDragY(0);
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: dragY > 0 ? dragY : 0 
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: dragY > 0 ? 0 : 0.2, ease: 'easeOut' }}
            className={`card w-full max-w-lg flex flex-col max-h-[90vh] relative ${hideScrollbar ? 'scrollbar-hide' : 'modal-scrollbar'}`}
            style={{ 
              minHeight: 0,
              height: 'auto',
              touchAction: 'pan-y',
              margin: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Индикатор для swipe down на мобильных */}
            {isMobile() && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-secondary/40 rounded-full" />
            )}
            
            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-heading" />
            </button>
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-6 modal-scroll-container"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                minHeight: 0,
                touchAction: 'pan-y'
              }}
              onWheel={(e) => {
                // Предотвращаем всплытие события скролла, чтобы Lenis не перехватывал его
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

  // Рендерим модальное окно через Portal в body для корректного позиционирования
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

export default memo(Modal);


