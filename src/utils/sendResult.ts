import type { ResultIndex, Gender } from '../engine/types';

/**
 * Отправляет финальный результат теста на бэкенд
 * 
 * @param resultIndex Финальный результат теста (например: "ESTW", "INFP")
 * @param userId ID пользователя (опционально)
 * @param gender Пол пользователя (для бэкенда, не влияет на логику теста)
 * @returns Promise с ответом от сервера
 */
export async function sendResultToBackend(
  resultIndex: ResultIndex,
  userId?: string,
  gender?: Gender
): Promise<void> {
  try {
    // TODO: Заменить на реальный endpoint бэкенда
    const response = await fetch('/api/test/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resultIndex,
        userId,
        gender,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Результат отправлен на бэкенд:', data);
  } catch (error) {
    console.error('Ошибка отправки результата на бэкенд:', error);
    throw error;
  }
}

