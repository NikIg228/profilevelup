/**
 * Нормализует значение пола к строгому формату "male" | "female"
 * 
 * Поддерживает различные варианты ввода:
 * - "male", "female" (английский)
 * - "Мужской", "Женский" (русский)
 * - "M", "F" (сокращения)
 * - "м", "ж" (русские сокращения)
 * 
 * @throws Error если значение не может быть распознано
 */
export function normalizeGender(input: string | unknown): 'male' | 'female' {
  if (typeof input !== 'string') {
    throw new Error(`Invalid gender input: expected string, got ${typeof input}`);
  }

  const normalized = input.trim().toLowerCase();

  // Прямые совпадения
  if (normalized === 'male' || normalized === 'мужской' || normalized === 'm' || normalized === 'м') {
    return 'male';
  }

  if (normalized === 'female' || normalized === 'женский' || normalized === 'f' || normalized === 'ж') {
    return 'female';
  }

  // Если не распознано, выбрасываем ошибку
  throw new Error(`Invalid gender value: "${input}". Expected one of: male, female, Мужской, Женский, M, F, м, ж`);
}

