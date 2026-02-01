/**
 * API функции для отправки данных на бэкенд для генерации PDF
 * 
 * Использует единый формат payload_v1 согласно API_SPEC.md:
 * - Единый endpoint: POST /api/v1/reports (или /api/report-jobs для совместимости)
 * - Единый формат payload_v1 для всех тарифов
 * - Валидация по PayloadSchema из types/payload.ts
 */

import { logger } from './logger';
import { buildPayload } from '../engine/buildPayload';
import { validatePayload } from './validatePayload';
import { REPORT_API } from '../config/api';
import type { Tariff } from './testTypeMapping';
import type { Answers, ExtendedAnswers, TestConfig, ExtendedTestConfig } from '../engine/types';
import type { PayloadV1 } from '../types/payload';

/**
 * Интерфейс для ответа от бэкенда
 */
export interface ReportJobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  childUrl?: string;
  emailStatus?: 'pending' | 'sent' | 'failed';
  error?: string;
}

/**
 * Получает данные пользователя из sessionStorage для buildPayload
 */
function getUserDataForPayload(): { fullName: string; email: string; age: number; gender: 'male' | 'female'; parentEmail?: string } {
  const raw = sessionStorage.getItem('profi.user');
  if (!raw) {
    throw new Error('Данные пользователя не найдены в sessionStorage');
  }
  
  try {
    const userData = JSON.parse(raw) as {
      name?: string;
      age?: string | number;
      gender?: 'male' | 'female';
      email?: string;
      parentEmail?: string;
    };
    
    if (!userData.name || !userData.email || !userData.gender) {
      throw new Error('Недостаточно данных пользователя (требуется: name, email, gender)');
    }
    
    const age = typeof userData.age === 'number' 
      ? userData.age 
      : parseInt(String(userData.age), 10) || 18;
    
    return {
      fullName: userData.name,
      email: userData.email,
      age,
      gender: userData.gender,
      parentEmail: userData.parentEmail,
    };
  } catch (error) {
    throw new Error(`Ошибка получения данных пользователя: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Преобразует answers в формат Record<string, string> для buildPayload
 */
function normalizeAnswers(answers: Answers | ExtendedAnswers): Record<string, string> {
  const result: Record<string, string> = {};
  const obj = answers as Record<string, unknown>;
  Object.keys(obj).forEach(key => {
    result[key] = String(obj[key]);
  });
  return result;
}

/**
 * Отправляет запрос на генерацию PDF отчета
 * 
 * Использует единый формат payload_v1 согласно API_SPEC.md
 * 
 * @param testId Уникальный ID теста
 * @param tariff Тариф теста
 * @param answers Ответы пользователя
 * @param config Конфигурация теста
 * @param completedAt Дата завершения теста (ISO string)
 * @returns Ответ от бэкенда с jobId и статусом
 */
export async function submitReportJob(
  testId: string,
  tariff: Tariff,
  answers: Answers | ExtendedAnswers,
  config: TestConfig,
  completedAt: string = new Date().toISOString()
): Promise<ReportJobResponse> {
  try {
    // Получаем данные пользователя из sessionStorage
    const userData = getUserDataForPayload();
    
    // Преобразуем answers в формат для buildPayload
    const answersRecord = normalizeAnswers(answers);
    
    // Формируем payload_v1: для EXTENDED/PREMIUM передаём config, чтобы moduleId совпадал с экраном результатов
    const payload: PayloadV1 = buildPayload({
      testId,
      tariff,
      completedAt,
      user: userData,
      answers: answersRecord,
      testConfig: (tariff === 'EXTENDED' || tariff === 'PREMIUM') ? (config as ExtendedTestConfig) : undefined,
    });
    
    // Валидируем payload перед отправкой
    validatePayload(payload);
    
    // Отправляем POST запрос на бэкенд
    const response = await fetch(REPORT_API.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      // Если бэкенд не готов (404, 500), это нормально для разработки
      if (response.status === 404 || response.status >= 500) {
        logger.warn(`Бэкенд не готов (${response.status}), пропускаем отправку отчета`);
        return {
          jobId: testId,
          status: 'pending',
          error: `Backend unavailable: ${response.status}`,
        };
      }
      
      // Для других ошибок пробрасываем исключение
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    // Парсим ответ
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Бэкенд вернул не JSON, пропускаем парсинг ответа');
      return {
        jobId: testId,
        status: 'pending',
      };
    }
    
    const data = await response.json();
    return data as ReportJobResponse;
  } catch (error) {
    logger.error('Ошибка отправки запроса на генерацию отчета:', error);
    
    // Возвращаем объект с ошибкой, но не пробрасываем исключение
    // Это позволяет приложению продолжать работу даже если бэкенд недоступен
    return {
      jobId: testId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Проверяет статус job генерации отчета
 * 
 * @param jobId ID job
 * @returns Текущий статус job
 */
export async function checkReportJobStatus(jobId: string): Promise<ReportJobResponse> {
  try {
    const response = await fetch(REPORT_API.STATUS(jobId));
    
    if (!response.ok) {
      if (response.status === 404 || response.status >= 500) {
        return {
          jobId,
          status: 'pending',
          error: `Backend unavailable: ${response.status}`,
        };
      }
      
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        jobId,
        status: 'pending',
      };
    }
    
    const data = await response.json();
    return data as ReportJobResponse;
  } catch (error) {
    logger.error('Ошибка проверки статуса job:', error);
    return {
      jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

