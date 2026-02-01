import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Answers, ExtendedAnswers, AgeGroup, TestConfig } from '../engine/types';
import type { Tariff } from '../utils/testTypeMapping';
import { submitReportJob } from '../utils/reportApi';
import { TEST_API } from '../config/api';
import { logger } from '../utils/logger';

interface TestState {
  // Основное состояние
  testId: string | null;
  tariff: Tariff | null;
  ageGroup: AgeGroup | null;
  testConfig: TestConfig | null;
  step: number;
  answers: Answers | ExtendedAnswers;
  
  // Метаданные
  userId?: string;
  email?: string;
  startedAt: string | null;
  lastSaved: number;
  isCompleted: boolean; // Флаг завершения теста
  
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
  markTestCompleted: () => Promise<void>; // Отметить тест как завершенный
  resetTest: () => Promise<void>; // Теперь асинхронный для подтверждения
  resetTestForce: () => void; // Принудительный сброс без подтверждения
  
  // Синхронизация
  syncWithServer: () => Promise<boolean>;
  syncImmediate: () => Promise<boolean>; // Немедленная синхронизация без debounce
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
    const response = await fetch(TEST_API.START, {
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
    const response = await fetch(TEST_API.PROGRESS(testId), {
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
    const response = await fetch(TEST_API.PROGRESS(testId));
    
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
      userId: undefined,
      email: undefined,
      startedAt: null,
      lastSaved: Date.now(),
      isCompleted: false,
      isSaving: false,
      isRestoring: false,
      lastSyncStatus: null,
      syncError: null,

      // Инициализация теста
      initializeTest: async (tariff, ageGroup, userId, email) => {
        const state = get();
        
        // ⚠️ ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ: Сохраняем текущий незавершенный тест перед созданием нового
        if (state.testId && !state.isCompleted && Object.keys(state.answers).length > 0) {
          await state.syncImmediate();
        }
        
        // Если уже есть активный НЕЗАВЕРШЕННЫЙ тест с теми же параметрами - не перезаписываем
        if (
          state.testId &&
          !state.isCompleted &&
          state.tariff === tariff &&
          state.ageGroup === ageGroup
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
        
        // ⚠️ КРИТИЧНО: Устанавливаем тариф СИНХРОННО в начале, чтобы он был доступен сразу
        // Это предотвращает ошибки при загрузке конфигурации, которая может сработать параллельно
        set({ 
          isRestoring: true,
          tariff, // Устанавливаем тариф сразу
          ageGroup, // Устанавливаем возрастную группу сразу
          testConfig: null, // Очищаем конфигурацию сразу
          answers: {}, // Очищаем ответы сразу
        });
        
        const testId = await createTestSession(tariff, ageGroup, userId, email);
        
        // ⚠️ ВАЖНО: При смене тарифа полностью очищаем все состояние, включая testConfig и answers
        // Это гарантирует, что старые данные из другого тарифа не будут использоваться
        set({
          testId,
          tariff, // Тариф уже установлен выше, но устанавливаем еще раз для полноты
          ageGroup, // Возрастная группа уже установлена выше
          testConfig: null, // Явно очищаем конфигурацию теста
          step: 1,
          answers: {}, // Явно очищаем ответы
          userId,
          email,
          startedAt: new Date().toISOString(),
          lastSaved: Date.now(),
          isCompleted: false,
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

      // Ручная синхронизация (с debounce отменой)
      syncWithServer: async () => {
        const state = get();
        if (!state.testId) return false;
        
        // Отменяем debounced синхронизацию
        if (syncTimeout) {
          clearTimeout(syncTimeout);
          syncTimeout = null;
        }
        
        set({ isSaving: true });
        const success = await syncProgress(state.testId, state.step, state.answers);
        set({
          isSaving: false,
          lastSyncStatus: success,
          syncError: success ? null : 'Ошибка синхронизации',
        });
        
        return success;
      },

      // Немедленная синхронизация (без debounce, для beforeunload)
      syncImmediate: async () => {
        const state = get();
        if (!state.testId || state.isCompleted) return false;
        
        // Отменяем debounced синхронизацию
        if (syncTimeout) {
          clearTimeout(syncTimeout);
          syncTimeout = null;
        }
        
        // Используем navigator.sendBeacon для надежного сохранения при закрытии
        // sendBeacon работает только с POST и не поддерживает заголовки, поэтому используем fetch с keepalive
        let beaconSent = false;
        if (typeof navigator !== 'undefined' && !state.testId.startsWith('local_')) {
          try {
            // Используем fetch с keepalive для надежного сохранения при закрытии
            fetch(`/api/test/progress/${state.testId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                step: state.step, 
                answers: state.answers, 
                timestamp: new Date().toISOString() 
              }),
              keepalive: true, // Критично для beforeunload
            }).catch(() => {
              // Игнорируем ошибки, так как это асинхронный запрос при закрытии
            });
            beaconSent = true;
          } catch (error) {
            // Fallback к обычной синхронизации
          }
        }
        
        // Обычная синхронизация (если keepalive не использовался или для локальных тестов)
        // Для beforeunload используем только keepalive, не ждем ответа
        const success = beaconSent ? true : await syncProgress(state.testId, state.step, state.answers);
        set({
          lastSaved: Date.now(),
          lastSyncStatus: success,
          syncError: success ? null : 'Ошибка синхронизации',
        });
        
        return success;
      },

      // Отметить тест как завершенный
      markTestCompleted: async () => {
        const state = get();
        if (!state.testId) return;
        // Уже отмечен — не отправляем отчёт повторно (страница результатов тоже вызывает markTestCompleted)
        if (state.isCompleted) return;

        // Принудительно синхронизируем перед завершением
        await state.syncImmediate();
        
        set({ 
          isCompleted: true,
          lastSaved: Date.now(),
        });
        
        // Сохраняем статус завершения на сервере
        if (!state.testId.startsWith('local_')) {
          try {
            await fetch(TEST_API.COMPLETE(state.testId), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                completedAt: new Date().toISOString(),
                timestamp: new Date().toISOString() 
              }),
            });
          } catch (error) {
            // Игнорируем ошибки, локальное сохранение уже сделано
          }
        }
        
        // Отправляем запрос на генерацию PDF отчета согласно схеме test-result-schema.json
        if (state.tariff && state.testConfig && state.answers) {
          try {
            const completedAt = new Date().toISOString();
            const reportResponse = await submitReportJob(
              state.testId,
              state.tariff,
              state.answers,
              state.testConfig,
              completedAt
            );
            
            logger.log('Запрос на генерацию отчета отправлен:', {
              jobId: reportResponse.jobId,
              status: reportResponse.status,
              tariff: state.tariff,
            });
            
            // Сохраняем jobId в store для последующей проверки статуса (опционально)
            // Можно добавить поле reportJobId в TestState если нужно
          } catch (error) {
            // Не блокируем завершение теста, если отправка отчета не удалась
            logger.error('Ошибка отправки запроса на генерацию отчета:', error);
          }
        } else {
          logger.warn('Недостаточно данных для отправки запроса на генерацию отчета:', {
            hasTariff: !!state.tariff,
            hasConfig: !!state.testConfig,
            hasAnswers: !!state.answers,
          });
        }
      },

      // Сброс состояния с подтверждением для платных тестов
      resetTest: async () => {
        const state = get();
        
        // Для платных тестов - подтверждение
        if (state.tariff === 'EXTENDED' || state.tariff === 'PREMIUM') {
          const confirmed = window.confirm(
            'Вы уверены, что хотите начать новый тест?\n\n' +
            'Незавершенный тест будет потерян. Убедитесь, что вы сохранили свой прогресс.'
          );
          
          if (!confirmed) {
            return;
          }
        }
        
        // Принудительно синхронизируем перед сбросом
        if (state.testId && !state.isCompleted && Object.keys(state.answers).length > 0) {
          await state.syncImmediate();
        }
        
        // Вызываем принудительный сброс
        get().resetTestForce();
      },

      // Принудительный сброс без подтверждения (для внутреннего использования)
      resetTestForce: () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        set({
          testId: null,
          tariff: null,
          ageGroup: null,
          testConfig: null,
          step: 1,
          answers: {},
          userId: undefined,
          email: undefined,
          startedAt: null,
          lastSaved: Date.now(),
          isCompleted: false,
          isSaving: false,
          isRestoring: false,
          lastSyncStatus: null,
          syncError: null,
        });
      },
    }),
    {
      name: 'profi-test-state', // localStorage key (будет переопределен для каждого тарифа)
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только нужные поля
      partialize: (state) => ({
        testId: state.testId,
        tariff: state.tariff,
        ageGroup: state.ageGroup,
        step: state.step,
        answers: state.answers,
        userId: state.userId,
        email: state.email,
        startedAt: state.startedAt,
        lastSaved: state.lastSaved,
        isCompleted: state.isCompleted, // Сохраняем флаг завершения
      }),
      // Восстановление с проверкой устаревания (24 часа)
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hoursSinceSave = (Date.now() - state.lastSaved) / (1000 * 60 * 60);
          if (hoursSinceSave > 24) {
            // Если данные устарели - сбрасываем только незавершенные тесты
            if (!state.isCompleted) {
              state.resetTestForce();
            }
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

