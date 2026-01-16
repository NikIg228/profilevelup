import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Answers, ExtendedAnswers, Tariff, AgeGroup, TestConfig, ResultIndex } from '../engine/types';

interface TestState {
  // Основное состояние
  testId: string | null;
  tariff: Tariff | null;
  ageGroup: AgeGroup | null;
  testConfig: TestConfig | null;
  step: number;
  answers: Answers | ExtendedAnswers;
  resultIndex: ResultIndex | null;
  done: boolean;
  
  // Метаданные
  userId?: string;
  email?: string;
  startedAt: string | null;
  lastSaved: number;
  
  // Статус синхронизации
  isSaving: boolean;
  isRestoring: boolean;
  lastSyncStatus: boolean | null;
  syncError: string | null;
  
  // Actions
  initializeTest: (tariff: Tariff, ageGroup: AgeGroup, userId?: string, email?: string) => Promise<void>;
  setTestConfig: (config: TestConfig) => void;
  setStep: (step: number) => void;
  setAnswer: (questionId: number, answer: string) => void;
  setAnswers: (answers: Answers | ExtendedAnswers) => void;
  setResultIndex: (resultIndex: ResultIndex) => void;
  setDone: (done: boolean) => void;
  resetTest: () => void;
  
  // Синхронизация
  syncWithServer: () => Promise<boolean>;
  completeTest: (resultIndex: ResultIndex) => Promise<boolean>;
}

// Debounce для синхронизации
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 3000;
const MAX_RETRIES = 3;

// API функции
async function createTestSession(
  tariff: Tariff,
  ageGroup: AgeGroup,
  userId?: string,
  email?: string
): Promise<string> {
  try {
    const response = await fetch('/api/test/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tariff, 
        ageGroup, 
        userId, 
        email, 
        timestamp: new Date().toISOString() 
      }),
    });

    if (!response.ok) {
      // Если бэкенд не готов (404, 500), используем локальное сохранение
      if (response.status === 404 || response.status >= 500) {
        return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.testId;
  } catch (error) {
    // Если это ошибка сети или бэкенд не готов - используем локальное сохранение
    // Это нормально для разработки и когда бэкенд еще не развернут
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

async function syncProgress(
  testId: string,
  step: number,
  answers: Answers | ExtendedAnswers,
  retries = 0
): Promise<boolean> {
  // Если это локальный тест (начинается с "local_"), не синхронизируем с сервером
  if (testId.startsWith('local_')) {
    return false; // Локальное сохранение уже сделано через persist middleware
  }

  try {
    const response = await fetch(`/api/test/progress/${testId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        step, 
        answers, 
        timestamp: new Date().toISOString() 
      }),
    });

    if (!response.ok) {
      // Если бэкенд не готов (404, 500), считаем это нормальным
      if (response.status === 404 || response.status >= 500) {
        return false; // Данные сохранены локально
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return true;
  } catch (error) {
    // Ошибка сети или бэкенд не готов - это нормально
    // Данные уже сохранены локально через persist middleware
    
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
      return syncProgress(testId, step, answers, retries + 1);
    }
    
    return false; // Локальное сохранение работает
  }
}

async function loadFromServer(testId: string): Promise<Partial<TestState> | null> {
  // Если это локальный тест, не пытаемся загружать с сервера
  if (testId.startsWith('local_')) {
    return null;
  }

  try {
    const response = await fetch(`/api/test/progress/${testId}`);
    
    if (!response.ok) {
      // 404 - тест не найден на сервере (нормально для новых тестов)
      // 500+ - сервер недоступен (нормально, используем локальные данные)
      if (response.status === 404 || response.status >= 500) {
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    // Проверяем, что ответ - это JSON, а не HTML страница ошибки
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null; // Сервер вернул не JSON (возможно, страницу ошибки)
    }

    const data = await response.json();
    return {
      step: data.step || 1,
      answers: data.answers || {},
      lastSaved: new Date(data.updatedAt).getTime(),
    };
  } catch (error) {
    // Ошибка сети или парсинга - это нормально, используем локальные данные
    // Не логируем ошибки, так как бэкенд может быть еще не готов
    return null;
  }
}

async function completeOnServer(testId: string, resultIndex: ResultIndex): Promise<boolean> {
  // Если это локальный тест, не отправляем на сервер
  if (testId.startsWith('local_')) {
    return false; // Локальное сохранение уже сделано
  }

  try {
    const response = await fetch(`/api/test/complete/${testId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        resultIndex, 
        completedAt: new Date().toISOString() 
      }),
    });

    // Если бэкенд не готов, это нормально - данные сохранены локально
    return response.ok;
  } catch (error) {
    // Ошибка сети - это нормально, данные сохранены локально
    return false;
  }
}

export const useTestStore = create<TestState>()(
  persist(
    (set, get) => ({
      // Initial state
      testId: null,
      tariff: null,
      ageGroup: null,
      testConfig: null,
      step: 1,
      answers: {},
      resultIndex: null,
      done: false,
      userId: undefined,
      email: undefined,
      startedAt: null,
      lastSaved: Date.now(),
      isSaving: false,
      isRestoring: false,
      lastSyncStatus: null,
      syncError: null,

      // Инициализация теста
      initializeTest: async (tariff, ageGroup, userId, email) => {
        const state = get();
        
        // Если уже есть активный незавершенный тест с теми же параметрами - не перезаписываем
        if (
          state.testId &&
          state.tariff === tariff &&
          state.ageGroup === ageGroup &&
          !state.done
        ) {
          // Только пытаемся загрузить с сервера, если это не локальный тест
          if (!state.testId.startsWith('local_')) {
            set({ isRestoring: true });
            const serverState = await loadFromServer(state.testId);
            
            if (serverState) {
              set({
                ...serverState,
                isRestoring: false,
                lastSyncStatus: true,
              });
              return;
            }
          }
          
          // Если локальный тест или сервер недоступен - используем восстановленное состояние
          set({ isRestoring: false });
          return;
        }

        // Создаем новую сессию только если:
        // 1. Нет активного теста
        // 2. Тест завершен
        // 3. Параметры изменились
        set({ isRestoring: true });
        
        const testId = await createTestSession(tariff, ageGroup, userId, email);
        
        set({
          testId,
          tariff,
          ageGroup,
          step: 1,
          answers: {},
          resultIndex: null,
          done: false,
          userId,
          email,
          startedAt: new Date().toISOString(),
          lastSaved: Date.now(),
          isRestoring: false,
          lastSyncStatus: null,
          syncError: null,
        });
      },

      // Установка конфигурации теста
      setTestConfig: (config) => {
        set({ testConfig: config });
      },

      // Обновление шага с автосохранением
      setStep: (step) => {
        set({ step, lastSaved: Date.now(), lastSyncStatus: null });
        
        // Debounced синхронизация
        if (syncTimeout) clearTimeout(syncTimeout);
        
        syncTimeout = setTimeout(async () => {
          const state = get();
          if (!state.testId) return;
          
          set({ isSaving: true });
          const success = await syncProgress(state.testId, step, state.answers);
          set({
            isSaving: false,
            lastSyncStatus: success,
            syncError: success ? null : 'Ошибка синхронизации',
          });
        }, SYNC_DEBOUNCE_MS);
      },

      // Обновление одного ответа
      setAnswer: (questionId, answer) => {
        const state = get();
        const newAnswers = {
          ...state.answers,
          [questionId]: answer,
        } as Answers | ExtendedAnswers;
        
        get().setAnswers(newAnswers);
      },

      // Обновление всех ответов с автосохранением
      setAnswers: (answers) => {
        set({ answers, lastSaved: Date.now(), lastSyncStatus: null });
        
        // Debounced синхронизация
        if (syncTimeout) clearTimeout(syncTimeout);
        
        syncTimeout = setTimeout(async () => {
          const state = get();
          if (!state.testId) return;
          
          set({ isSaving: true });
          const success = await syncProgress(state.testId, state.step, answers);
          set({
            isSaving: false,
            lastSyncStatus: success,
            syncError: success ? null : 'Ошибка синхронизации',
          });
        }, SYNC_DEBOUNCE_MS);
      },

      // Установка результата
      setResultIndex: (resultIndex) => {
        set({ resultIndex });
      },

      // Завершение теста
      setDone: (done) => {
        set({ done });
      },

      // Ручная синхронизация
      syncWithServer: async () => {
        const state = get();
        if (!state.testId) return false;
        
        set({ isSaving: true });
        const success = await syncProgress(state.testId, state.step, state.answers);
        set({
          isSaving: false,
          lastSyncStatus: success,
          syncError: success ? null : 'Ошибка синхронизации',
        });
        
        return success;
      },

      // Завершение теста на сервере
      completeTest: async (resultIndex) => {
        const state = get();
        if (!state.testId || !state.tariff || !state.ageGroup) return false;
        
        set({ isSaving: true });
        const success = await completeOnServer(state.testId, resultIndex);
        
        // Сохраняем в историю тестов
        try {
          const testRecord = {
            testId: state.testId,
            tariff: state.tariff,
            ageGroup: state.ageGroup,
            resultIndex,
            completedAt: new Date().toISOString(),
            startedAt: state.startedAt || new Date().toISOString(),
          };
          
          const stored = localStorage.getItem('profi-test-history');
          const history = stored ? JSON.parse(stored) : [];
          
          // Проверяем, нет ли уже такого теста
          if (!history.find((t: typeof testRecord) => t.testId === testRecord.testId)) {
            history.push(testRecord);
            localStorage.setItem('profi-test-history', JSON.stringify(history));
          }
        } catch (error) {
          console.error('Ошибка сохранения в историю:', error);
        }
        
        if (success) {
          set({
            done: true,
            resultIndex,
            isSaving: false,
            lastSyncStatus: true,
          });
        } else {
          set({
            done: true,
            resultIndex,
            isSaving: false,
            lastSyncStatus: false,
            syncError: 'Ошибка завершения теста',
          });
        }
        
        return success;
      },

      // Сброс состояния
      resetTest: () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        set({
          testId: null,
          tariff: null,
          ageGroup: null,
          testConfig: null,
          step: 1,
          answers: {},
          resultIndex: null,
          done: false,
          userId: undefined,
          email: undefined,
          startedAt: null,
          lastSaved: Date.now(),
          isSaving: false,
          isRestoring: false,
          lastSyncStatus: null,
          syncError: null,
        });
      },
    }),
    {
      name: 'profi-test-state', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только нужные поля
      partialize: (state) => ({
        testId: state.testId,
        tariff: state.tariff,
        ageGroup: state.ageGroup,
        step: state.step,
        answers: state.answers,
        resultIndex: state.resultIndex,
        done: state.done,
        userId: state.userId,
        email: state.email,
        startedAt: state.startedAt,
        lastSaved: state.lastSaved,
      }),
      // Восстановление с проверкой устаревания (24 часа)
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hoursSinceSave = (Date.now() - state.lastSaved) / (1000 * 60 * 60);
          if (hoursSinceSave > 24) {
            state.resetTest();
          } else {
            // Восстанавливаем состояние, но не сбрасываем isRestoring сразу
            // Это позволит компоненту понять, что данные восстановлены
            state.isRestoring = false;
          }
        }
      },
    }
  )
);

