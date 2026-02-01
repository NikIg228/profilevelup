import { AgeGroupKey } from '../types/payload';

/**
 * Определяет возрастную группу (bucket) на основе возраста.
 * Используется для выбора папок с отчетами.
 * 
 * Правила:
 * - 12..14 => "12_14"
 * - 15..17 => "15_17"
 * - 18..20 => "18_20"
 * - >=21   => "21_plus"
 */
export function getAgeBucket(age: number): AgeGroupKey {
  if (age >= 12 && age <= 14) return '12_14';
  if (age >= 15 && age <= 17) return '15_17';
  if (age >= 18 && age <= 20) return '18_20';
  return '21_plus';
}

