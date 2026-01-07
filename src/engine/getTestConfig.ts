import type { Tariff, AgeGroup, TestConfig } from './types';

// Импорты FREE тестовых конфигураций
import free13_17 from '../tests/FREE/13-17';
import free18_24 from '../tests/FREE/18-24';
import free25_34 from '../tests/FREE/25-34';
import free35_45 from '../tests/FREE/35-45';

// Импорты EXTENDED тестовых конфигураций
import extended13_17 from '../tests/EXTENDED/13-17';
import extended18_24 from '../tests/EXTENDED/18-24';
import extended25_34 from '../tests/EXTENDED/25-34';
import extended35_45 from '../tests/EXTENDED/35-45';

// Импорты PREMIUM тестовых конфигураций
import premium13_17 from '../tests/PREMIUM/13-17';
import premium18_24 from '../tests/PREMIUM/18-24';
import premium25_34 from '../tests/PREMIUM/25-34';
import premium35_45 from '../tests/PREMIUM/35-45';

/**
 * Загружает конфигурацию теста по параметрам (синхронная версия)
 * 
 * @param tariff Тариф теста ('FREE' | 'EXTENDED' | 'PREMIUM')
 * @param ageGroup Возрастная группа ('13-17' | '18-24' | '25-34' | '35-45')
 *   Является ключом выбора конфигурации для всех тарифов
 * @returns Конфигурация теста
 * 
 * @throws Error если конфигурация не найдена для данного tariff и ageGroup
 */
export function getTestConfig(
  tariff: Tariff,
  ageGroup: AgeGroup
): TestConfig {
  const configMap: Record<string, TestConfig> = {
    'FREE/13-17': free13_17,
    'FREE/18-24': free18_24,
    'FREE/25-34': free25_34,
    'FREE/35-45': free35_45,
    'EXTENDED/13-17': extended13_17,
    'EXTENDED/18-24': extended18_24,
    'EXTENDED/25-34': extended25_34,
    'EXTENDED/35-45': extended35_45,
    'PREMIUM/13-17': premium13_17,
    'PREMIUM/18-24': premium18_24,
    'PREMIUM/25-34': premium25_34,
    'PREMIUM/35-45': premium35_45,
  };
  
  const key = `${tariff}/${ageGroup}`;
  const config = configMap[key];
  
  if (!config) {
    throw new Error(`Test config not found for tariff=${tariff}, ageGroup=${ageGroup}`);
  }
  
  if (!config.meta || !config.questions || !config.resultMapping) {
    throw new Error(`Invalid test config for tariff=${tariff}, ageGroup=${ageGroup}`);
  }
  
  return config;
}
