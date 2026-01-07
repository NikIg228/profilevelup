/**
 * Типы для системы тестирования
 */

export type Tariff = 'FREE' | 'PRO' | 'PREMIUM';

export type AgeGroup = '13-17' | '18-24' | '25-34' | '35-45';

export type Gender = 'male' | 'female';

export type QuestionLetter = 'P' | 'J' | 'E' | 'I' | 'T' | 'F' | 'N' | 'S';

export type ResultLetter = 'E' | 'I' | 'N' | 'S' | 'T' | 'F' | 'J' | 'P' | 'W';

export type ResultIndex = string; // Например: "ESTW", "INFP", "ENTJ"

/**
 * Ответы пользователя на вопросы
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
  id: number; // 1-5
  text: string;
  options: QuestionOption[];
}

/**
 * Метаданные теста
 */
export interface TestMeta {
  tariff: Tariff;
  age: AgeGroup;
}

/**
 * Позиционный маппинг результатов
 * Определяет, из каких вопросов брать данные для каждой позиции
 */
export interface PositionalResultMapping {
  position1: { from: number };      // E/I из вопроса 2
  position2: { from: number };      // N/S из вопроса 5
  position3: { from: number };      // T/F из вопроса 3
  position4: { from: number[] };    // J/P/W из вопросов [1, 4]
}

/**
 * Конфигурация теста
 * Содержит только структуру вопросов и позиционный маппинг
 * НЕ содержит интерпретаций результатов
 */
export interface TestConfig {
  meta: TestMeta;
  questions: Question[];
  resultMapping: PositionalResultMapping;
}

/**
 * Финальный результат теста
 */
export interface TestResult {
  resultIndex: ResultIndex;
}
