/**
 * Единый менеджер блокировки скролла
 * Предотвращает конфликты между компонентами, которые блокируют скролл
 */

type ScrollLockSource = 'header' | 'modal' | 'hero' | 'other';

class ScrollLockManager {
  private locks: Set<ScrollLockSource> = new Set();
  private savedScrollY: number = 0;
  private isLocked: boolean = false;

  /**
   * Блокирует скролл с указанием источника
   */
  lock(source: ScrollLockSource): void {
    this.locks.add(source);
    
    if (!this.isLocked) {
      this.savedScrollY = window.scrollY || document.documentElement.scrollTop;
      this.isLocked = true;
      
      // Блокируем скролл
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${this.savedScrollY}px`;
      document.body.style.overflowY = 'hidden';
      
      // Сохраняем позицию для восстановления
      document.body.setAttribute('data-scroll-y', this.savedScrollY.toString());
    }
  }

  /**
   * Разблокирует скролл для указанного источника
   */
  unlock(source: ScrollLockSource): void {
    this.locks.delete(source);
    
    // Разблокируем только если нет других блокировок
    if (this.locks.size === 0 && this.isLocked) {
      this.isLocked = false;
      
      // Восстанавливаем скролл
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Восстанавливаем позицию скролла
      requestAnimationFrame(() => {
        if (scrollY) {
          const scrollPosition = parseInt(scrollY || '0');
          window.scrollTo({ top: scrollPosition, behavior: 'auto' });
        }
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
    this.locks.clear();
    if (this.isLocked) {
      this.isLocked = false;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      document.body.removeAttribute('data-scroll-y');
    }
  }
}

// Singleton экземпляр
export const scrollLockManager = new ScrollLockManager();

