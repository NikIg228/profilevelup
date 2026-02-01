import { AgeGroupKey } from '../types/payload';

/**
 * Determines the age group key based on user's age.
 * 
 * Rules:
 * - 12..14 -> "12_14"
 * - 15..17 -> "15_17"
 * - 18..20 -> "18_20"
 * - 21+    -> "21_plus"
 * 
 * Note: Ages below 12 are treated as 12_14 for safety, though frontend should validation age >= 12.
 */
export function getAgeGroupKey(age: number): AgeGroupKey {
  if (age < 15) return '12_14';
  if (age >= 15 && age <= 17) return '15_17';
  if (age >= 18 && age <= 20) return '18_20';
  return '21_plus';
}

