/**
 * Маппинг типов тестов на тарифы для отправки на бэкенд
 * 
 * ⚠️ ВАЖНО: Четкое соответствие типов тестов и тарифов
 * 
 * Фронтенд отправляет на бэкенд следующие значения:
 * 
 * "Первичное понимание" → "FREE"
 * "Персональный разбор" → "EXTENDED"
 * "Семейная навигация" → "PREMIUM"
 * 
 * Это соответствие зафиксировано в коде и не должно изменяться.
 * Все преобразования должны использовать функции из этого модуля.
 */

export type TestType = 'Первичное понимание' | 'Персональный разбор' | 'Семейная навигация';
export type Tariff = 'FREE' | 'EXTENDED' | 'PREMIUM';
export type Plan = 'free' | 'extended' | 'premium';

/**
 * Константы типов тестов
 */
export const TEST_TYPES = {
  PRIMARY: 'Первичное понимание' as const,
  PERSONAL: 'Персональный разбор' as const,
  FAMILY: 'Семейная навигация' as const,
} as const;

/**
 * Константы тарифов
 */
export const TARIFFS = {
  FREE: 'FREE' as const,
  EXTENDED: 'EXTENDED' as const,
  PREMIUM: 'PREMIUM' as const,
} as const;

/**
 * Маппинг testType -> tariff (для отправки на бэкенд)
 */
const TEST_TYPE_TO_TARIFF: Record<TestType, Tariff> = {
  'Первичное понимание': 'FREE',
  'Персональный разбор': 'EXTENDED',
  'Семейная навигация': 'PREMIUM',
};

/**
 * Маппинг tariff -> testType (обратный)
 */
const TARIFF_TO_TEST_TYPE: Record<Tariff, TestType> = {
  'FREE': 'Первичное понимание',
  'EXTENDED': 'Персональный разбор',
  'PREMIUM': 'Семейная навигация',
};

/**
 * Маппинг testType -> plan (для внутреннего использования)
 */
const TEST_TYPE_TO_PLAN: Record<TestType, Plan> = {
  'Первичное понимание': 'free',
  'Персональный разбор': 'extended',
  'Семейная навигация': 'premium',
};

/**
 * Маппинг plan -> tariff
 */
const PLAN_TO_TARIFF: Record<Plan, Tariff> = {
  'free': 'FREE',
  'extended': 'EXTENDED',
  'premium': 'PREMIUM',
};

/**
 * Преобразует тип теста в тариф для отправки на бэкенд
 * 
 * @param testType Тип теста (например, "Первичное понимание")
 * @returns Тариф для отправки на бэкенд ("FREE" | "EXTENDED" | "PREMIUM")
 * @throws Error если testType не распознан
 */
export function testTypeToTariff(testType: string | undefined | null): Tariff {
  if (!testType) {
    throw new Error('testType is required');
  }
  
  const tariff = TEST_TYPE_TO_TARIFF[testType as TestType];
  if (!tariff) {
    throw new Error(`Unknown testType: ${testType}. Expected: "Первичное понимание", "Персональный разбор", or "Семейная навигация"`);
  }
  
  return tariff;
}

/**
 * Преобразует тариф в тип теста (обратное преобразование)
 * 
 * @param tariff Тариф ("FREE" | "EXTENDED" | "PREMIUM")
 * @returns Тип теста
 * @throws Error если tariff не распознан
 */
export function tariffToTestType(tariff: Tariff): TestType {
  const testType = TARIFF_TO_TEST_TYPE[tariff];
  if (!testType) {
    throw new Error(`Unknown tariff: ${tariff}. Expected: "FREE", "EXTENDED", or "PREMIUM"`);
  }
  
  return testType;
}

/**
 * Преобразует тип теста в plan (для внутреннего использования)
 * 
 * @param testType Тип теста
 * @returns Plan ("free" | "extended" | "premium")
 * @throws Error если testType не распознан
 */
export function testTypeToPlan(testType: string | undefined | null): Plan {
  if (!testType) {
    throw new Error('testType is required');
  }
  
  const plan = TEST_TYPE_TO_PLAN[testType as TestType];
  if (!plan) {
    throw new Error(`Unknown testType: ${testType}. Expected: "Первичное понимание", "Персональный разбор", or "Семейная навигация"`);
  }
  
  return plan;
}

/**
 * Преобразует plan в tariff
 * 
 * @param plan Plan ("free" | "extended" | "premium")
 * @returns Тариф для отправки на бэкенд
 * @throws Error если plan не распознан
 */
export function planToTariff(plan: Plan | 'free' | 'pro' | 'extended' | 'premium' | null | undefined): Tariff {
  if (!plan) {
    return 'FREE'; // По умолчанию
  }
  
  // Обработка старого формата 'pro'
  if (plan === 'pro') {
    return 'EXTENDED';
  }
  
  const tariff = PLAN_TO_TARIFF[plan as Plan];
  if (!tariff) {
    return 'FREE'; // По умолчанию для неизвестных значений
  }
  
  return tariff;
}

/**
 * Проверяет, является ли тест PREMIUM (Семейная навигация)
 */
export function isPremiumTest(testType: string | undefined | null): boolean {
  return testType === TEST_TYPES.FAMILY;
}

/**
 * Проверяет, является ли тест FREE (Первичное понимание)
 */
export function isFreeTest(testType: string | undefined | null): boolean {
  return testType === TEST_TYPES.PRIMARY;
}

/**
 * Проверяет, является ли тест EXTENDED (Персональный разбор)
 */
export function isExtendedTest(testType: string | undefined | null): boolean {
  return testType === TEST_TYPES.PERSONAL;
}

