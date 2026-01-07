/**
 * Типы для системы тестирования
 */

export type Tariff = 'FREE' | 'PRO' | 'PREMIUM' | 'EXTENDED';

export type AgeGroup = '13-17' | '18-24' | '25-34' | '35-45';

export type Gender = 'male' | 'female';

export type QuestionLetter = 'P' | 'J' | 'E' | 'I' | 'T' | 'F' | 'N' | 'S';

export type ResultLetter = 'E' | 'I' | 'N' | 'S' | 'T' | 'F' | 'J' | 'P' | 'W' | 'Z' | 'X' | 'Q';

/**
 * Финальный результат теста в виде строки (например: "ESTW", "INFP", "EXTP", "ZNFW")
 * 
 * ⚠️ ВАЖНО: resultIndex НЕ отображается пользователю в продакшене.
 * Используется только для:
 * - отладки логики тестирования
 * - передачи на бэкенд для генерации отчётов (PDF / email)
 * - внутренней обработки результатов
 * 
 * НЕ добавлять UI-зависимости от resultIndex.
 */
export type ResultIndex = string;

/**
 * Ответы пользователя на вопросы FREE теста
 * Ключ - номер вопроса (1-5), значение - буква ответа
 */
export type Answers = {
  1: 'P' | 'J';
  2: 'E' | 'I';
  3: 'T' | 'F';
  4: 'J' | 'P';
  5: 'N' | 'S';
};

/**
 * Ответы пользователя на вопросы EXTENDED/PREMIUM теста
 * Ключ - номер вопроса (1-28), значение - вариант ответа ('A' | 'B')
 */
export type ExtendedAnswers = {
  [key: number]: 'A' | 'B';
};

/**
 * Вариант ответа на вопрос
 */
export interface QuestionOption {
  value: QuestionLetter;
  label: string;
}

/**
 * Вопрос теста
 */
export interface Question {
  id: number; // 1-5 для FREE, 1-28 для EXTENDED/PREMIUM
  text: string;
  options: QuestionOption[];
}

/**
 * Вариант ответа для EXTENDED/PREMIUM теста
 */
export interface ExtendedQuestionOption {
  value: 'A' | 'B';
  label: string;
}

/**
 * Вопрос для EXTENDED/PREMIUM теста
 * Вопросы НЕ знают, к какой дихотомии они относятся - это определяется только через resultMapping
 */
export interface ExtendedQuestion {
  id: number; // 1-28
  text: string;
  options: ExtendedQuestionOption[];
}

/**
 * Метаданные теста
 */
export interface TestMeta {
  tariff: Tariff;
  ageGroup: AgeGroup; // Возрастная группа является ключом выбора конфигурации
}

/**
 * Позиционный маппинг результатов (для FREE тестов)
 * Определяет, из каких вопросов брать данные для каждой позиции
 */
export interface PositionalResultMapping {
  position1: { from: number };      // E/I из вопроса 2
  position2: { from: number };      // N/S из вопроса 5
  position3: { from: number };      // T/F из вопроса 3
  position4: { from: number[] };    // J/P/W из вопросов [1, 4]
}

/**
 * Описание дихотомии для EXTENDED/PREMIUM тестов
 * Полностью определяет логику подсчета для одной дихотомии
 */
export interface DichotomyMapping {
  questions: number[];      // Список ID вопросов, относящихся к этой дихотомии
  primary: ResultLetter;    // Буква для варианта A (большинство)
  secondary: ResultLetter;  // Буква для варианта B (меньшинство)
  middle: ResultLetter;     // Срединная буква (используется при |A_count - B_count| === 1)
}

/**
 * Блочный маппинг результатов (для EXTENDED/PREMIUM тестов)
 * Явно определяет все дихотомии с их вопросами и буквами
 * Порядок дихотомий определяет порядок букв в resultIndex: [E/I/Z][S/N/X][T/F/Q][J/P/W]
 */
export interface BlockResultMapping {
  EI: DichotomyMapping;  // E/I дихотомия
  SN: DichotomyMapping;  // S/N дихотомия
  TF: DichotomyMapping;  // T/F дихотомия
  JP: DichotomyMapping;  // J/P дихотомия
}

/**
 * Конфигурация FREE теста
 */
export interface FreeTestConfig {
  meta: TestMeta;
  questions: Question[];
  resultMapping: PositionalResultMapping;
}

/**
 * Конфигурация EXTENDED/PREMIUM теста
 */
export interface ExtendedTestConfig {
  meta: TestMeta;
  questions: ExtendedQuestion[];
  resultMapping: BlockResultMapping;
}

/**
 * Конфигурация теста (union type для поддержки обоих типов)
 */
export type TestConfig = FreeTestConfig | ExtendedTestConfig;

/**
 * Финальный результат теста
 */
export interface TestResult {
  resultIndex: ResultIndex;
}
