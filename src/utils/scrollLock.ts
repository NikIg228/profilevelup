/**
 * Единый менеджер блокировки скролла
 * Предотвращает конфликты между компонентами, которые блокируют скролл
 */

type ScrollLockSource = 'header' | 'modal' | 'hero' | 'other';

class ScrollLockManager {
  private locks: Set<ScrollLockSource> = new Set();
  private savedScrollY: number = 0;
  private isLocked: boolean = false;
  private lockedWithHtmlStrategy: boolean = false;

  // Сохраненные inline-стили (восстанавливаем строго их, а не сбрасываем в '')
  private prevHtmlOverflow: string = '';
  private prevHtmlOverflowY: string = '';

  private prevBodyOverflow: string = '';
  private prevBodyOverflowY: string = '';
  private prevBodyPosition: string = '';
  private prevBodyTop: string = '';
  private prevBodyWidth: string = '';
  private prevBodyPaddingRight: string = '';

  /**
   * Lenis (и некоторые настройки) делают scroll-контейнером HTML (documentElement),
   * выставляя overflowY: scroll и/или метки на html.
   */
  private isHtmlScrollMode(): boolean {
    const html = document.documentElement;
    const computedOverflowY = window.getComputedStyle(html).overflowY;

    return (
      computedOverflowY === 'scroll' ||
      html.style.overflowY === 'scroll' ||
      html.classList.contains('lenis') ||
      html.hasAttribute('data-lenis')
    );
  }

  private isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const iPhoneiPad = /iPad|iPhone|iPod/.test(ua);
    const maxTouch = (navigator as { maxTouchPoints?: number }).maxTouchPoints ?? 0;
    const iPadOS = navigator.platform === 'MacIntel' && maxTouch > 1;
    return iPhoneiPad || iPadOS;
  }

  private getScrollbarWidth(): number {
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  }

  /**
   * Определяет элемент, который является источником скролла
   * Проверяет возможные контейнеры (#root, #page-root, main) или использует window
   */
  private getScrollElement(): HTMLElement | Window {
    // Проверяем возможные контейнеры скролла
    const root = document.getElementById('root');
    const pageRoot = document.getElementById('page-root');
    const main = document.getElementById('main-content') || document.querySelector('main');
    
    // Если контейнер имеет overflow и скроллится - используем его
    // Иначе используем window (стандартный случай)
    const candidates = [root, pageRoot, main].filter(Boolean) as HTMLElement[];
    
    for (const element of candidates) {
      const style = window.getComputedStyle(element);
      if (style.overflow === 'auto' || style.overflow === 'scroll' || 
          style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return element;
      }
    }
    
    // По умолчанию скролл происходит на window
    return window;
  }

  /**
   * Получает текущую позицию скролла
   * Использует несколько источников для максимальной надежности
   */
  private getScrollTop(): number {
    const scrollElement = this.getScrollElement();
    
    if (scrollElement === window) {
      // Для window используем несколько источников для надежности
      // Проверяем в порядке приоритета
      const scrollY = window.scrollY || 
                      window.pageYOffset || 
                      document.documentElement.scrollTop || 
                      document.body.scrollTop || 
                      0;
      
      // Дополнительная проверка: если получили 0, но страница может быть прокручена
      // Проверяем визуальную позицию через getBoundingClientRect
      if (scrollY === 0) {
        const bodyRect = document.body.getBoundingClientRect();
        const htmlRect = document.documentElement.getBoundingClientRect();
        
        // Если body или html имеют отрицательный top, значит страница прокручена
        if (bodyRect.top < 0) {
          return Math.abs(bodyRect.top);
        }
        if (htmlRect.top < 0) {
          return Math.abs(htmlRect.top);
        }
      }
      
      return scrollY;
    } else {
      // Для элемента используем scrollTop
      return (scrollElement as HTMLElement).scrollTop || 0;
    }
  }

  /**
   * Устанавливает позицию скролла
   */
  private setScrollTop(value: number): void {
    const scrollElement = this.getScrollElement();
    
    if (scrollElement === window) {
      window.scrollTo(0, value);
    } else {
      (scrollElement as HTMLElement).scrollTop = value;
    }
  }

  /**
   * Блокирует скролл с указанием источника
   */
  lock(source: ScrollLockSource): void {
    this.locks.add(source);
    
    // Блокируем скролл ТОЛЬКО один раз, даже если несколько источников lock
    if (!this.isLocked) {
      const useHtmlStrategy = this.isHtmlScrollMode() || this.isIOS();
      this.lockedWithHtmlStrategy = useHtmlStrategy;

      // КРИТИЧЕСКИ ВАЖНО: Сохраняем текущую позицию скролла ДО любых изменений DOM
      // (в html-mode берём documentElement.scrollTop, иначе используем текущую логику)
      this.savedScrollY = useHtmlStrategy ? (document.documentElement.scrollTop || 0) : this.getScrollTop();
      
      // Дополнительная валидация: убеждаемся, что значение не отрицательное
      this.savedScrollY = Math.max(0, this.savedScrollY);
      
      this.isLocked = true;
      
      // Сохраняем позицию в атрибут ДО применения стилей
      // Это гарантирует, что мы сможем восстановить позицию даже если savedScrollY будет перезаписан
      document.body.setAttribute('data-scroll-y', this.savedScrollY.toString());

      // Сохраняем предыдущие inline-стили (строго то, что было выставлено в style="...")
      this.prevBodyOverflow = document.body.style.overflow;
      this.prevBodyOverflowY = document.body.style.overflowY;
      this.prevBodyPosition = document.body.style.position;
      this.prevBodyTop = document.body.style.top;
      this.prevBodyWidth = document.body.style.width;
      this.prevBodyPaddingRight = document.body.style.paddingRight;

      this.prevHtmlOverflow = document.documentElement.style.overflow;
      this.prevHtmlOverflowY = document.documentElement.style.overflowY;

      if (useHtmlStrategy) {
        // Strategy A (Lenis/html-scroll или iOS): блокируем через overflow без body:fixed
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.overflowY = 'hidden';

        // Компенсация ширины scrollbar (опционально, чтобы не было сдвига контента)
        const sbw = this.getScrollbarWidth();
        if (sbw > 0) {
          const current = parseFloat(window.getComputedStyle(document.body).paddingRight || '0') || 0;
          document.body.style.paddingRight = `${current + sbw}px`;
        }
      } else {
        // Strategy B (обычный window/body-scroll): текущий механизм body: fixed
        // ВАЖНО: Применяем стили синхронно, чтобы избежать визуального скачка
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${this.savedScrollY}px`;
        document.body.style.overflow = 'hidden';
        document.body.style.overflowY = 'hidden';

        // НЕ вызываем window.scrollTo() в lock() - это предотвращает jump-to-top
        // Визуальная позиция сохраняется через position: fixed + top: -scrollY
      }
    }
  }

  /**
   * Разблокирует скролл для указанного источника
   */
  unlock(source: ScrollLockSource): void {
    this.locks.delete(source);
    
    // Разблокируем только если нет других блокировок
    if (this.locks.size > 0) return;
    
    if (this.isLocked) {
      const useHtmlStrategy = this.lockedWithHtmlStrategy;

      // Получаем сохраненную позицию скролла
      const scrollY = document.body.getAttribute('data-scroll-y');
      const savedScrollY = scrollY ? parseInt(scrollY, 10) : this.savedScrollY;
      
      this.isLocked = false;
      
      // ОБЯЗАТЕЛЬНО: Восстанавливаем строго сохраненные значения inline-стилей
      document.body.style.position = this.prevBodyPosition;
      document.body.style.width = this.prevBodyWidth;
      document.body.style.top = this.prevBodyTop;
      document.body.style.overflow = this.prevBodyOverflow;
      document.body.style.overflowY = this.prevBodyOverflowY;
      document.body.style.paddingRight = this.prevBodyPaddingRight;
      
      // Удаляем все data-атрибуты
      document.body.removeAttribute('data-scroll-y');
      
      // В html-mode восстанавливаем overflow/overflowY html к тем значениям, что были ДО lock
      // (не сбрасываем в '', чтобы не ломать Lenis, который часто ставит overflowY='scroll')
      if (useHtmlStrategy) {
        document.documentElement.style.overflow = this.prevHtmlOverflow;
        document.documentElement.style.overflowY = this.prevHtmlOverflowY;
      }

      this.lockedWithHtmlStrategy = false;
      
      // ОБЯЗАТЕЛЬНО: Восстанавливаем позицию скролла ТОЛЬКО на последнем unlock
      // Используем requestAnimationFrame для гарантии, что стили применены
      requestAnimationFrame(() => {
        this.setScrollTop(savedScrollY);
      });
    }
  }

  /**
   * Проверяет, заблокирован ли скролл
   */
  isScrollLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Получает список активных блокировок
   */
  getActiveLocks(): ScrollLockSource[] {
    return Array.from(this.locks);
  }

  /**
   * Принудительно разблокирует все блокировки (для cleanup)
   */
  forceUnlock(): void {
    const savedScrollY = this.savedScrollY;
    this.locks.clear();
    
    if (this.isLocked) {
      const useHtmlStrategy = this.lockedWithHtmlStrategy;
      this.isLocked = false;
      
      // Восстанавливаем строго сохраненные значения inline-стилей
      document.body.style.position = this.prevBodyPosition;
      document.body.style.width = this.prevBodyWidth;
      document.body.style.top = this.prevBodyTop;
      document.body.style.overflow = this.prevBodyOverflow;
      document.body.style.overflowY = this.prevBodyOverflowY;
      document.body.style.paddingRight = this.prevBodyPaddingRight;
      
      document.body.removeAttribute('data-scroll-y');
      
      // В html-mode восстанавливаем overflow/overflowY html к тем значениям, что были ДО lock
      if (useHtmlStrategy) {
        document.documentElement.style.overflow = this.prevHtmlOverflow;
        document.documentElement.style.overflowY = this.prevHtmlOverflowY;
      }

      this.lockedWithHtmlStrategy = false;
      
      // Восстанавливаем позицию скролла
      requestAnimationFrame(() => {
        this.setScrollTop(savedScrollY);
      });
    }
  }
}

// Singleton экземпляр
export const scrollLockManager = new ScrollLockManager();

