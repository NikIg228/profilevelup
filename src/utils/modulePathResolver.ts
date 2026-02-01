/**
 * Утилиты для нормализации параметров для выбора DOCX-модулей на backend
 * 
 * ВАЖНО: Эти функции используются для формирования документации и понимания того,
 * как backend должен выбирать модули. Сама логика выбора модулей реализуется на backend.
 */

/**
 * Преобразует возраст в age_bucket для пути к модулю
 * 
 * @param age Возраст пользователя (12-90)
 * @returns age_bucket для пути к модулю
 */
export function getAgeBucket(age: number): '12_14' | '15_17' | '18_20' | '21_plus' {
  if (age >= 12 && age <= 14) {
    return '12_14';
  } else if (age >= 15 && age <= 17) {
    return '15_17';
  } else if (age >= 18 && age <= 20) {
    return '18_20';
  } else {
    return '21_plus';
  }
}

/**
 * Вычисляет indexFolder (e/i/z) из первой буквы moduleId
 * 
 * ВАЖНО: Это НЕ гендер. Это индекс по первой букве moduleId.
 * 
 * @param moduleId Тип личности (например, "ENFJ", "INFP", "ZNFW")
 * @returns indexFolder: "e" | "i" | "z"
 * @throws Error если первая буква не E, I или Z
 */
export function getIndexFolder(moduleId: string): 'e' | 'i' | 'z' {
  const firstLetter = moduleId.toUpperCase().charAt(0);
  
  if (firstLetter === 'E') {
    return 'e';
  } else if (firstLetter === 'I') {
    return 'i';
  } else if (firstLetter === 'Z') {
    return 'z';
  } else {
    throw new Error(
      `Invalid moduleId first letter: "${firstLetter}". ` +
      `Expected E, I, or Z. Got moduleId: "${moduleId}"`
    );
  }
}

/**
 * Преобразует moduleId в type (lowercase) для имени файла
 * 
 * @param moduleId Тип личности (например, "ENFJ")
 * @returns type для имени файла (например, "enfj")
 */
export function getModuleType(moduleId: string): string {
  return moduleId.toLowerCase();
}

/**
 * Формирует путь к child модулю для FREE тарифа
 * 
 * @param age Возраст пользователя
 * @param gender Пол пользователя
 * @param moduleId Тип личности
 * @returns Путь к модулю
 */
export function getFreeModulePath(
  age: number,
  gender: 'male' | 'female',
  moduleId: string
): string {
  const ageBucket = getAgeBucket(age);
  const indexFolder = getIndexFolder(moduleId);
  const type = getModuleType(moduleId);
  
  return `modules/free/${ageBucket}/${gender}/${indexFolder}/${type}.docx`;
}

/**
 * Формирует путь к child модулю для EXTENDED тарифа
 * 
 * @param age Возраст пользователя
 * @param gender Пол пользователя
 * @param moduleId Тип личности
 * @returns Путь к модулю (primary)
 * @returns Путь к модулю (fallback, если primary не существует)
 */
export function getExtendedModulePath(
  age: number,
  gender: 'male' | 'female',
  moduleId: string
): { primary: string; fallback: string } {
  const ageBucket = getAgeBucket(age);
  const indexFolder = getIndexFolder(moduleId);
  const type = getModuleType(moduleId);
  
  return {
    primary: `modules/extended/${ageBucket}/${gender}/${indexFolder}/${type}.docx`,
    fallback: `modules/paid/${ageBucket}/${gender}/${indexFolder}/${type}.docx`,
  };
}

/**
 * Формирует путь к parent модулю для PREMIUM тарифа
 * 
 * @param age Возраст пользователя
 * @param moduleId Тип личности
 * @returns Путь к модулю (primary)
 * @returns Путь к модулю (fallback, если primary не существует)
 */
export function getPremiumParentModulePath(
  age: number,
  moduleId: string
): { primary: string; fallback: string } {
  const ageBucket = getAgeBucket(age);
  const indexFolder = getIndexFolder(moduleId);
  const type = getModuleType(moduleId);
  
  return {
    primary: `modules/premium/${ageBucket}/${indexFolder}/${type}_parent.docx`,
    fallback: `modules/parents_review/${ageBucket}/${indexFolder}/${type}_parent.docx`,
  };
}

/**
 * Формирует путь к child модулю для PREMIUM тарифа
 * (используется тот же путь, что и для EXTENDED)
 * 
 * @param age Возраст пользователя
 * @param gender Пол пользователя
 * @param moduleId Тип личности
 * @returns Путь к модулю (primary и fallback)
 */
export function getPremiumChildModulePath(
  age: number,
  gender: 'male' | 'female',
  moduleId: string
): { primary: string; fallback: string } {
  // Child PDF для PREMIUM использует тот же путь, что и EXTENDED
  return getExtendedModulePath(age, gender, moduleId);
}

/**
 * Примеры использования для документации
 */
export const MODULE_PATH_EXAMPLES = {
  free: {
    example1: getFreeModulePath(13, 'male', 'ENFJ'),
    // "modules/free/12_14/male/e/enfj.docx"
    example2: getFreeModulePath(16, 'female', 'INFP'),
    // "modules/free/15_17/female/i/infp.docx"
    example3: getFreeModulePath(20, 'male', 'ZNFW'),
    // "modules/free/18_20/male/z/znfw.docx"
  },
  extended: {
    example1: getExtendedModulePath(13, 'male', 'ENFJ'),
    // primary: "modules/extended/12_14/male/e/enfj.docx"
    // fallback: "modules/paid/12_14/male/e/enfj.docx"
  },
  premium: {
    child: getPremiumChildModulePath(13, 'male', 'ENFJ'),
    // primary: "modules/extended/12_14/male/e/enfj.docx"
    // fallback: "modules/paid/12_14/male/e/enfj.docx"
    parent: getPremiumParentModulePath(13, 'ENFJ'),
    // primary: "modules/premium/12_14/e/enfj_parent.docx"
    // fallback: "modules/parents_review/12_14/e/enfj_parent.docx"
  },
} as const;

