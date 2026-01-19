/**
 * Утилиты для работы с возрастом и возрастными группами
 */

import type { FreeAgeGroup, ExtendedAgeGroup, AgeGroup } from '../engine/types';

/**
 * Преобразует возраст в возрастную группу для FREE теста
 * @param age Возраст пользователя
 * @returns Возрастная группа для FREE теста
 */
export function getFreeAgeGroup(age: number): FreeAgeGroup {
  if (age >= 12 && age <= 17) {
    return '12-17';
  } else if (age >= 18 && age <= 20) {
    return '18-20';
  } else {
    return '21+';
  }
}

/**
 * Преобразует возраст в возрастную группу для EXTENDED/PREMIUM теста
 * @param age Возраст пользователя
 * @returns Возрастная группа для EXTENDED/PREMIUM теста
 */
export function getExtendedAgeGroup(age: number): ExtendedAgeGroup {
  if (age >= 13 && age <= 17) {
    return '13-17';
  } else if (age >= 18 && age <= 24) {
    return '18-24';
  } else if (age >= 25 && age <= 34) {
    return '25-34';
  } else {
    return '35-45';
  }
}

/**
 * Преобразует возраст в возрастную группу на основе тарифа
 * @param age Возраст пользователя
 * @param tariff Тариф теста
 * @returns Возрастная группа
 */
export function getAgeGroup(age: number, tariff: 'FREE' | 'EXTENDED' | 'PREMIUM'): AgeGroup {
  if (tariff === 'FREE') {
    return getFreeAgeGroup(age);
  } else {
    return getExtendedAgeGroup(age);
  }
}

