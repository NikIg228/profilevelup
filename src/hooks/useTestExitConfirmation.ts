import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTestStore } from '../stores/useTestStore';
import { useExitConfirmStore } from '../stores/useExitConfirmStore';

/**
 * Хук для подтверждения выхода со страницы теста при навигации внутри приложения
 * Показывает подтверждение и очищает состояние теста при подтверждении
 */
export function useTestExitConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const testId = useTestStore(state => state.testId);
  const isCompleted = useTestStore(state => state.isCompleted);
  const answers = useTestStore(state => state.answers);
  const resetTestForce = useTestStore(state => state.resetTestForce);
  const openDialog = useExitConfirmStore(state => state.openDialog);
  
  // Флаг для отслеживания, что мы уже обрабатываем навигацию
  const isNavigatingRef = useRef(false);
  const navigateRef = useRef(navigate);
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    // Проверяем, есть ли незавершенный тест
    const hasUnfinishedTest = testId && !isCompleted && answers && Object.keys(answers).length > 0;
    
    if (!hasUnfinishedTest) {
      return;
    }

    // Если мы уже на другой странице (не /test) - не перехватываем
    if (!location.pathname.startsWith('/test')) {
      return;
    }

    // Добавляем состояние в историю для перехвата навигации назад (только один раз)
    const currentState = window.history.state;
    if (!currentState || !currentState.preventBack) {
      window.history.pushState({ preventBack: true }, '', location.pathname);
    }

    // Перехватываем клики по ссылкам
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Игнорируем внешние ссылки и якоря
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        return;
      }
      
      // Игнорируем ссылки на страницы тестов (может быть переход между тарифами)
      if (href === '/test' || href.startsWith('/test/')) {
        return;
      }
      
      // Если это ссылка внутри приложения - показываем предупреждение
      e.preventDefault();
      e.stopPropagation();
      
      pendingHrefRef.current = href;
      
      // Показываем кастомный диалог
      openDialog(
        () => {
          // Подтверждение - выходим
          resetTestForce();
          isNavigatingRef.current = true;
          navigateRef.current(pendingHrefRef.current!);
          pendingHrefRef.current = null;
        },
        () => {
          // Отмена - остаемся на странице
          pendingHrefRef.current = null;
        }
      );
    };

    // Перехватываем навигацию назад через popstate
    const handlePopState = (e: PopStateEvent) => {
      // Если мы уже обрабатываем навигацию - пропускаем
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }
      
      // Отменяем навигацию назад - возвращаемся на текущую страницу
      window.history.pushState({ preventBack: true }, '', location.pathname);
      
      // Показываем кастомный диалог
      openDialog(
        () => {
          // Подтверждение - выходим
          resetTestForce();
          isNavigatingRef.current = true;
          window.history.back();
        },
        () => {
          // Отмена - остаемся на странице (уже предотвратили навигацию)
        }
      );
    };

    // Добавляем обработчики
    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [testId, isCompleted, answers, resetTestForce, location.pathname, openDialog]);
}

