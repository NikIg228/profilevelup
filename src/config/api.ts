/**
 * Конфигурация API endpoints
 * 
 * Использует переменную окружения VITE_API_BASE_URL для определения базового URL бэкенда.
 * 
 * Для разработки (локальный бэкенд):
 *   VITE_API_BASE_URL=http://localhost:8000/api
 * 
 * Для production (бэкенд на VPS):
 *   VITE_API_BASE_URL=https://api.profi-level.com/api
 * 
 * Если переменная не задана, используется относительный путь /api (для единого домена или proxy)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Test API endpoints (сессия и прогресс теста)
 */
export const TEST_API = {
  START: `${API_BASE_URL}/test/start`,
  PROGRESS: (testId: string) => `${API_BASE_URL}/test/progress/${testId}`,
  COMPLETE: (testId: string) => `${API_BASE_URL}/test/complete/${testId}`,
} as const;

/**
 * Report API endpoints (генерация PDF отчётов)
 */
export const REPORT_API = {
  CREATE: `${API_BASE_URL}/v1/reports`,
  STATUS: (jobId: string) => `${API_BASE_URL}/v1/reports/${jobId}`,
  VALIDATE: `${API_BASE_URL}/v1/validate-payload`,
} as const;

/**
 * Payment API (Robokassa — создание платежа)
 */
export const PAYMENT_API = {
  CREATE: `${API_BASE_URL}/payment/create`,
} as const;

/**
 * Получить полный URL для endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Если endpoint уже полный URL, возвращаем как есть
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Если endpoint начинается с /, используем как есть
  if (endpoint.startsWith('/')) {
    return endpoint;
  }
  
  // Иначе добавляем базовый URL
  return `${API_BASE_URL}/${endpoint}`;
}

/**
 * Проверка доступности API (для диагностики)
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 секунд таймаут
    });
    return response.ok;
  } catch {
    return false;
  }
}
