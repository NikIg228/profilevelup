/**
 * ⚠️ ВРЕМЕННОЕ РЕШЕНИЕ ДЛЯ ВНУТРЕННЕГО ТЕСТИРОВАНИЯ ЛОГИКИ ТЕСТОВ
 * 
 * Утилита для записи данных теста в localStorage:
 * - Выбор ответов с их уникальными индексами
 * - Конечный буквенный результат (resultIndex)
 */

export interface TestRecord {
  id: string;
  startTime: string;
  endTime?: string;
  tariff: 'FREE' | 'EXTENDED' | 'PREMIUM';
  ageGroup: string;
  testType?: string;
  answers: Record<number, string>; // questionId -> answer value
  resultIndex?: string;
  completed: boolean;
}

const STORAGE_KEY = 'profi.testRecords';
const SESSION_KEY = 'profi.currentTestRecordId'; // ID текущей записи в сессии
const MAX_RECORDS = 100; // Ограничение на количество записей

/**
 * Получает ID активной записи из sessionStorage
 */
function getCurrentRecordId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Сохраняет ID активной записи в sessionStorage
 */
function setCurrentRecordId(recordId: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, recordId);
  } catch (error) {
    console.error('Ошибка сохранения ID записи в sessionStorage:', error);
  }
}

/**
 * Очищает ID активной записи из sessionStorage
 */
function clearCurrentRecordId(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Игнорируем ошибки
  }
}

/**
 * Начинает запись нового теста
 * Если уже есть активная незавершенная запись в этой сессии, возвращает её ID
 */
export function startTestRecording(
  tariff: 'FREE' | 'EXTENDED' | 'PREMIUM',
  ageGroup: string,
  testType?: string
): string {
  // Проверяем, есть ли уже активная запись в этой сессии
  const currentRecordId = getCurrentRecordId();
  if (currentRecordId) {
    const records = getTestRecords();
    const existingRecord = records.find(r => r.id === currentRecordId);
    
    // Если запись существует и не завершена, используем её
    if (existingRecord && !existingRecord.completed) {
      console.log('Используется существующая активная запись теста:', currentRecordId);
      return currentRecordId;
    }
    
    // Если запись завершена или не найдена, очищаем ID
    if (existingRecord?.completed || !existingRecord) {
      clearCurrentRecordId();
    }
  }

  // Создаём новую запись
  const recordId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const record: TestRecord = {
    id: recordId,
    startTime: new Date().toISOString(),
    tariff,
    ageGroup,
    testType,
    answers: {},
    completed: false,
  };

  const records = getTestRecords();
  records.unshift(record); // Добавляем в начало
  
  // Ограничиваем количество записей
  if (records.length > MAX_RECORDS) {
    records.splice(MAX_RECORDS);
  }
  
  saveTestRecords(records);
  setCurrentRecordId(recordId); // Сохраняем ID в sessionStorage
  return recordId;
}

/**
 * Записывает ответ на вопрос
 */
export function recordAnswer(questionId: number, answer: string): void {
  const records = getTestRecords();
  if (records.length === 0) {
    console.warn('Нет активной записи теста');
    return;
  }

  // Ищем активную запись по ID из sessionStorage или берём первую незавершенную
  const currentRecordId = getCurrentRecordId();
  let currentRecord: TestRecord | undefined;
  
  if (currentRecordId) {
    currentRecord = records.find(r => r.id === currentRecordId);
  }
  
  // Если не нашли по ID, берём первую незавершенную
  if (!currentRecord) {
    currentRecord = records.find(r => !r.completed);
  }
  
  // Если всё ещё не нашли, берём первую запись
  if (!currentRecord) {
    currentRecord = records[0];
  }

  if (currentRecord.completed) {
    console.warn('Попытка записать ответ в завершённый тест');
    return;
  }

  currentRecord.answers[questionId] = answer;
  saveTestRecords(records);
}

/**
 * Завершает запись теста и сохраняет результат
 */
export function finishTestRecording(resultIndex: string): void {
  const records = getTestRecords();
  if (records.length === 0) {
    console.warn('Нет активной записи теста');
    return;
  }

  // Ищем активную запись по ID из sessionStorage или берём первую незавершенную
  const currentRecordId = getCurrentRecordId();
  let currentRecord: TestRecord | undefined;
  
  if (currentRecordId) {
    currentRecord = records.find(r => r.id === currentRecordId);
  }
  
  // Если не нашли по ID, берём первую незавершенную
  if (!currentRecord) {
    currentRecord = records.find(r => !r.completed);
  }
  
  // Если всё ещё не нашли, берём первую запись
  if (!currentRecord) {
    currentRecord = records[0];
  }

  if (currentRecord.completed) {
    console.warn('Тест уже завершён');
    return;
  }

  currentRecord.endTime = new Date().toISOString();
  currentRecord.resultIndex = resultIndex;
  currentRecord.completed = true;
  
  saveTestRecords(records);
  clearCurrentRecordId(); // Очищаем ID после завершения
}

/**
 * Получает все записи тестов из localStorage
 */
export function getTestRecords(): TestRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TestRecord[];
  } catch (error) {
    console.error('Ошибка чтения записей тестов:', error);
    return [];
  }
}

/**
 * Сохраняет записи тестов в localStorage
 */
function saveTestRecords(records: TestRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Ошибка сохранения записей тестов:', error);
  }
}

/**
 * Очищает все записи тестов
 */
export function clearTestRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Экспортирует записи тестов в JSON для скачивания
 */
export function exportTestRecords(): string {
  const records = getTestRecords();
  return JSON.stringify(records, null, 2);
}

