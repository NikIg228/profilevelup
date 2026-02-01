import { useEffect } from 'react';
import { useTestStore } from '../stores/useTestStore';

/**
 * Хук для подтверждения выхода и сохранения теста при закрытии страницы
 * Использует beforeunload и visibilitychange события
 */
export function useTestSaveOnUnload() {
  const syncImmediate = useTestStore(state => state.syncImmediate);
  const resetTestForce = useTestStore(state => state.resetTestForce);
  const testId = useTestStore(state => state.testId);
  const isCompleted = useTestStore(state => state.isCompleted);
  const answers = useTestStore(state => state.answers);

  useEffect(() => {
    // Проверяем, есть ли незавершенный тест
    const hasUnfinishedTest = testId && !isCompleted && answers && Object.keys(answers).length > 0;
    
    if (!hasUnfinishedTest) {
      return;
    }

    // Обработчик beforeunload - показывает подтверждение при закрытии вкладки/браузера
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Показываем предупреждение для всех незавершенных тестов
      e.preventDefault();
      // Современные браузеры игнорируют кастомный текст, но мы все равно его указываем
      e.returnValue = 'Вы уверены, что хотите выйти? Все ответы будут утеряны';
      return e.returnValue;
    };

    // Обработчик visibilitychange - сохраняет при переключении вкладок
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Страница скрыта - сохраняем немедленно
        syncImmediate();
      }
    };

    // Обработчик pagehide - сохраняет при навигации
    const handlePageHide = () => {
      syncImmediate();
    };

    // Добавляем обработчики
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [testId, isCompleted, answers, syncImmediate]);
}

