import type { Tariff, FreeAgeGroup, ExtendedAgeGroup, TestConfig, FreeTestConfig, ExtendedTestConfig } from './types';

// Импорты FREE тестовых конфигураций
import free12_17 from '../tests/FREE/12-17.json';
import free18_20 from '../tests/FREE/18-20.json';
import free21plus from '../tests/FREE/21plus.json';

// Импорты VIP (EXTENDED/PREMIUM) тестовых конфигураций
import vip12_17 from '../tests/VIP/12-17.json';
import vip18_20 from '../tests/VIP/18-20.json';
import vip21plus from '../tests/VIP/21plus.json';

/**
 * Загружает конфигурацию FREE теста по возрастной группе
 * 
 * @param ageGroup Возрастная группа ('12-17' | '18-20' | '21+')
 * @returns Конфигурация FREE теста
 * 
 * @throws Error если конфигурация не найдена
 */
function getFreeTestConfig(ageGroup: FreeAgeGroup): FreeTestConfig {
  const configMap: Record<FreeAgeGroup, FreeTestConfig> = {
    '12-17': free12_17 as FreeTestConfig,
    '18-20': free18_20 as FreeTestConfig,
    '21+': free21plus as FreeTestConfig,
  };
  
  const config = configMap[ageGroup];
  
  if (!config) {
    throw new Error(`FREE test config not found for ageGroup=${ageGroup}`);
  }
  
  if (!config.meta || !config.questions || !config.resultMapping) {
    throw new Error(`Invalid FREE test config for ageGroup=${ageGroup}`);
  }
  
  return config;
}

/**
 * Загружает конфигурацию VIP (EXTENDED/PREMIUM) теста по возрастной группе
 * 
 * @param ageGroup Возрастная группа ('12-17' | '18-20' | '21+')
 * @returns Конфигурация VIP теста
 * 
 * @throws Error если конфигурация не найдена
 */
function getExtendedTestConfig(ageGroup: ExtendedAgeGroup): ExtendedTestConfig {
  const configMap: Record<ExtendedAgeGroup, ExtendedTestConfig> = {
    '12-17': vip12_17 as ExtendedTestConfig,
    '18-20': vip18_20 as ExtendedTestConfig,
    '21+': vip21plus as ExtendedTestConfig,
  };
  
  const config = configMap[ageGroup];
  
  if (!config) {
    throw new Error(`VIP test config not found for ageGroup=${ageGroup}`);
  }
  
  if (!config.meta || !config.questions || !config.resultMapping) {
    throw new Error(`Invalid VIP test config for ageGroup=${ageGroup}`);
  }
  
  return config;
}

/**
 * Загружает конфигурацию теста по параметрам
 * 
 * @param tariff Тариф теста ('FREE' | 'EXTENDED' | 'PREMIUM')
 * @param ageGroup Возрастная группа
 * @returns Конфигурация теста
 * 
 * @throws Error если конфигурация не найдена
 */
export function getTestConfig(
  tariff: Tariff,
  ageGroup: string
): TestConfig {
  if (tariff === 'FREE') {
    // Валидация и преобразование возрастной группы для FREE теста
    if (ageGroup === '12-17' || ageGroup === '18-20' || ageGroup === '21+') {
      return getFreeTestConfig(ageGroup as FreeAgeGroup);
    }
    throw new Error(`Invalid FREE ageGroup: ${ageGroup}. Expected: 12-17, 18-20, or 21+`);
  }
  
  if (tariff === 'EXTENDED' || tariff === 'PREMIUM') {
    // Для EXTENDED и PREMIUM используются одинаковые VIP тесты
    // Валидация и преобразование возрастной группы для VIP теста
    if (ageGroup === '12-17' || ageGroup === '18-20' || ageGroup === '21+') {
      return getExtendedTestConfig(ageGroup as ExtendedAgeGroup);
    }
    throw new Error(`Invalid VIP ageGroup: ${ageGroup}. Expected: 12-17, 18-20, or 21+`);
  }
  
  throw new Error(`Test config not implemented for tariff=${tariff}`);
}

