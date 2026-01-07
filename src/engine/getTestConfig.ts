import type { Tariff, AgeGroup, TestConfig } from './types';

// Импорты всех тестовых конфигураций
import test13_17 from '../tests/FREE/13-17';
import test18_24 from '../tests/FREE/18-24';
import test25_34 from '../tests/FREE/25-34';
import test35_45 from '../tests/FREE/35-45';

/**
 * Загружает конфигурацию теста по параметрам (синхронная версия)
 * 
 * @param tariff Тариф теста ('FREE' | 'PRO' | 'PREMIUM')
 * @param age Возрастная группа ('13-17' | '18-24' | '25-34' | '35-45')
 * @returns Конфигурация теста
 */
export function getTestConfig(
  tariff: Tariff,
  age: AgeGroup
): TestConfig {
  // Маппинг путей на импортированные конфигурации
  const configMap: Record<string, TestConfig> = {
    'FREE/13-17': test13_17,
    'FREE/18-24': test18_24,
    'FREE/25-34': test25_34,
    'FREE/35-45': test35_45,
  };
  
  const key = `${tariff}/${age}`;
  const config = configMap[key];
  
  if (!config) {
    throw new Error(`Test config not found for ${tariff}/${age}`);
  }
  
  if (!config.meta || !config.questions || !config.resultMapping) {
    throw new Error(`Invalid test config for ${tariff}/${age}`);
  }
  
  return config;
}
