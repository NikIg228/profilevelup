import type { ExtendedAnswers, ExtendedTestConfig, ExtendedAgeGroup } from './types';

/**
 * Интерфейс для результата подсчета блока
 */
interface BlockCounts {
  aCount: number;
  bCount: number;
}

/**
 * Интерфейс для всех метрик VIP теста
 */
export interface VipMetrics {
  resultType: string;
  expression: number; // 0-100
  confidence: number; // 0-100
  axes: {
    axis1: number; // Социальный режим (0-100)
    axis2: number; // Фокус мышления (0-100)
    axis3: number; // Основание решений (0-100)
    axis4: number; // Стиль организации (0-100)
    axis5: number; // Драйвер мотивации (0-100)
    axis6: number; // Старт действий (0-100)
    axis7: number; // Стиль диалога в напряжении (0-100)
  };
  modules: {
    motivation: string; // Текст модуля мотивации
    start: string; // Текст модуля старта действий
    conflict: string; // Текст модуля диалога в напряжении
    expression: string; // Текст для выраженности
    confidence: string; // Текст для уверенности
  };
}

/**
 * Подсчитывает ответы A и B для списка вопросов
 */
function countAnswers(answers: ExtendedAnswers, questionIds: number[]): BlockCounts {
  let aCount = 0;
  let bCount = 0;
  
  for (const questionId of questionIds) {
    const answer = answers[questionId];
    if (answer === 'A') {
      aCount++;
    } else if (answer === 'B') {
      bCount++;
    }
  }
  
  return { aCount, bCount };
}

/**
 * Ось 1: Социальный режим (0 Автономно ↔ 100 Через людей)
 * Источник: Блок E/I (вопросы 1, 5, 9, 13, 17, 21, 25)
 */
function calculateAxis1(answers: ExtendedAnswers, eiQuestions: number[]): number {
  const counts = countAnswers(answers, eiQuestions);
  // A = E = "через людей" → увеличивает значение
  return Math.round((counts.aCount / 7) * 100);
}

/**
 * Ось 2: Фокус мышления (0 Конкретика и факты ↔ 100 Идеи и сценарии)
 * Источник: Блок S/N (вопросы 2, 6, 10, 14, 18, 22, 26)
 */
function calculateAxis2(answers: ExtendedAnswers, snQuestions: number[]): number {
  const counts = countAnswers(answers, snQuestions);
  // B = N = "идеи/сценарии" → увеличивает значение
  return Math.round((counts.bCount / 7) * 100);
}

/**
 * Ось 3: Основание решений (0 Логика/справедливость ↔ 100 Люди/ценности)
 * Источник: Блок T/F (вопросы 3, 7, 11, 15, 19, 23, 27)
 */
function calculateAxis3(answers: ExtendedAnswers, tfQuestions: number[]): number {
  const counts = countAnswers(answers, tfQuestions);
  // B = F = "люди/ценности" → увеличивает значение
  return Math.round((counts.bCount / 7) * 100);
}

/**
 * Ось 4: Стиль организации (0 Адаптация ↔ 100 План/структура)
 * Источник: Блок J/P (вопросы 4, 8, 12, 16, 20, 24, 28)
 */
function calculateAxis4(answers: ExtendedAnswers, jpQuestions: number[]): number {
  const counts = countAnswers(answers, jpQuestions);
  // A = J = "план/структура" → увеличивает значение
  return Math.round((counts.aCount / 7) * 100);
}

/**
 * Ось 5: Драйвер мотивации (0 Результат ↔ 100 Смысл)
 * Вычисляется из осей 1–4
 */
function calculateAxis5(axis2: number, axis3: number, axis4: number): number {
  return Math.round(
    0.45 * axis2 + 
    0.35 * axis3 + 
    0.20 * (100 - axis4)
  );
}

/**
 * Ось 6: Старт действий (0 Через план ↔ 100 Через пробу/эксперимент)
 * Вычисляется из осей 1–4
 */
function calculateAxis6(axis2: number, axis4: number): number {
  return Math.round(
    0.80 * (100 - axis4) + 
    0.20 * axis2
  );
}

/**
 * Ось 7: Стиль диалога в напряжении (0 Прямо/жёстко ↔ 100 Мягко/согласуя)
 * Вычисляется из осей 1–4
 */
function calculateAxis7(axis1: number, axis3: number, axis4: number): number {
  return Math.round(
    0.60 * axis3 + 
    0.20 * (100 - axis1) + 
    0.20 * (100 - axis4)
  );
}

/**
 * Выраженность (EXPRESSION) - показывает насколько стиль заметный
 * Показывает насколько оси 1–4 далеко от середины 50
 */
function calculateExpression(
  axis1: number,
  axis2: number,
  axis3: number,
  axis4: number
): number {
  const average = (
    Math.abs(axis1 - 50) +
    Math.abs(axis2 - 50) +
    Math.abs(axis3 - 50) +
    Math.abs(axis4 - 50)
  ) / 4;
  
  return Math.round(2 * average);
}

/**
 * Уверенность (CONFIDENCE) - показывает согласованность ответов
 */
function calculateConfidence(
  eiCounts: BlockCounts,
  snCounts: BlockCounts,
  tfCounts: BlockCounts,
  jpCounts: BlockCounts,
  answers: ExtendedAnswers,
  eiQuestions: number[],
  snQuestions: number[],
  tfQuestions: number[],
  jpQuestions: number[]
): number {
  // A) Сила перевеса (base_conf)
  function confMargin(margin: number): number {
    return 30 + 10 * margin;
  }
  
  const baseConf = (
    confMargin(Math.abs(eiCounts.aCount - eiCounts.bCount)) +
    confMargin(Math.abs(snCounts.aCount - snCounts.bCount)) +
    confMargin(Math.abs(tfCounts.aCount - tfCounts.bCount)) +
    confMargin(Math.abs(jpCounts.aCount - jpCounts.bCount))
  ) / 4;
  
  // B) Стабильность (stability)
  function calculateStability(
    questions: number[],
    rightValue: 'A' | 'B'
  ): number {
    // Первые 3 вопроса
    const first3 = questions.slice(0, 3);
    const first3Counts = countAnswers(answers, first3);
    const p1 = rightValue === 'A' 
      ? first3Counts.aCount / 3 
      : first3Counts.bCount / 3;
    
    // Последние 4 вопроса
    const last4 = questions.slice(3);
    const last4Counts = countAnswers(answers, last4);
    const p2 = rightValue === 'A'
      ? last4Counts.aCount / 4
      : last4Counts.bCount / 4;
    
    return 100 - Math.abs(p1 - p2) * 100;
  }
  
  const stability = (
    calculateStability(eiQuestions, 'A') + // E/I: right = A (E)
    calculateStability(snQuestions, 'B') + // S/N: right = B (N)
    calculateStability(tfQuestions, 'B') + // T/F: right = B (F)
    calculateStability(jpQuestions, 'A')   // J/P: right = A (J)
  ) / 4;
  
  // Итоговая уверенность
  return Math.round(0.70 * baseConf + 0.30 * stability);
}

/**
 * Вычисляет итоговый тип личности на основе подсчета блоков
 */
function calculateResultType(
  eiCounts: BlockCounts,
  snCounts: BlockCounts,
  tfCounts: BlockCounts,
  jpCounts: BlockCounts,
  config: ExtendedTestConfig
): string {
  const { resultMapping } = config;
  
  function getDichotomyLetter(
    aCount: number,
    bCount: number,
    primary: string,
    secondary: string,
    middle: string
  ): string {
    if (Math.abs(aCount - bCount) === 1) {
      return middle;
    }
    return aCount > bCount ? primary : secondary;
  }
  
  const eiLetter = getDichotomyLetter(
    eiCounts.aCount,
    eiCounts.bCount,
    resultMapping.EI.primary,
    resultMapping.EI.secondary,
    resultMapping.EI.middle
  );
  
  const snLetter = getDichotomyLetter(
    snCounts.aCount,
    snCounts.bCount,
    resultMapping.SN.primary,
    resultMapping.SN.secondary,
    resultMapping.SN.middle
  );
  
  const tfLetter = getDichotomyLetter(
    tfCounts.aCount,
    tfCounts.bCount,
    resultMapping.TF.primary,
    resultMapping.TF.secondary,
    resultMapping.TF.middle
  );
  
  const jpLetter = getDichotomyLetter(
    jpCounts.aCount,
    jpCounts.bCount,
    resultMapping.JP.primary,
    resultMapping.JP.secondary,
    resultMapping.JP.middle
  );
  
  return eiLetter + snLetter + tfLetter + jpLetter;
}

/**
 * Определяет диапазон для значения оси (L/M/R)
 * Согласно vip_rules.md:
 * - 0-35: L (Левая сторона шкалы)
 * - 36-64: M (Середина шкалы)
 * - 65-100: R (Правая сторона шкалы)
 */
export function getBand(score: number): 'L' | 'M' | 'R' {
  if (score <= 35) return 'L';
  if (score <= 64) return 'M';
  return 'R';
}

/**
 * Получает текстовый модуль для указанной оси и возрастной группы
 */
interface TextModules {
  ageGroups?: {
    [key in ExtendedAgeGroup]?: {
      [moduleName: string]: {
        [band: string]: string;
      };
    };
  };
}

function getTextModule(
  modules: TextModules | null | undefined,
  ageGroup: ExtendedAgeGroup,
  moduleName: 'motivation' | 'start' | 'conflict' | 'expression' | 'confidence',
  axisValue: number
): string {
  if (!modules || !modules.ageGroups) {
    return '';
  }
  
  const band = getBand(axisValue);
  const ageGroupData = modules.ageGroups[ageGroup];
  
  if (!ageGroupData || !ageGroupData[moduleName]) {
    return '';
  }
  
  return ageGroupData[moduleName][band] || '';
}

/**
 * Вычисляет все метрики VIP теста согласно vip_rules.md
 * 
 * @param answers Ответы пользователя на все 28 вопросов (A или B)
 * @param config Конфигурация EXTENDED/PREMIUM теста
 * @param textModules Загруженные текстовые модули (опционально)
 * @returns Все метрики VIP теста включая тип личности, оси и метрики
 */
export function resolveVipMetrics(
  answers: ExtendedAnswers,
  config: ExtendedTestConfig,
  textModules?: TextModules | null
): VipMetrics {
  const { resultMapping } = config;
  
  // 1. Подсчёт результата по блокам
  const eiCounts = countAnswers(answers, resultMapping.EI.questions);
  const snCounts = countAnswers(answers, resultMapping.SN.questions);
  const tfCounts = countAnswers(answers, resultMapping.TF.questions);
  const jpCounts = countAnswers(answers, resultMapping.JP.questions);
  
  // 2. Определение итогового типа личности
  const resultType = calculateResultType(eiCounts, snCounts, tfCounts, jpCounts, config);
  
  // 3. Подсчёт 7 осей
  const axis1 = calculateAxis1(answers, resultMapping.EI.questions);
  const axis2 = calculateAxis2(answers, resultMapping.SN.questions);
  const axis3 = calculateAxis3(answers, resultMapping.TF.questions);
  const axis4 = calculateAxis4(answers, resultMapping.JP.questions);
  const axis5 = calculateAxis5(axis2, axis3, axis4);
  const axis6 = calculateAxis6(axis2, axis4);
  const axis7 = calculateAxis7(axis1, axis3, axis4);
  
  // 4. Подсчёт метрик
  const expression = calculateExpression(axis1, axis2, axis3, axis4);
  const confidence = calculateConfidence(
    eiCounts,
    snCounts,
    tfCounts,
    jpCounts,
    answers,
    resultMapping.EI.questions,
    resultMapping.SN.questions,
    resultMapping.TF.questions,
    resultMapping.JP.questions
  );
  
  // 5. Выбор текстовых модулей на основе осей 5-7 и метрик (если модули переданы)
  const ageGroup = config.meta.ageGroup;
  const motivationModule = textModules ? getTextModule(textModules, ageGroup, 'motivation', axis5) : '';
  const startModule = textModules ? getTextModule(textModules, ageGroup, 'start', axis6) : '';
  const conflictModule = textModules ? getTextModule(textModules, ageGroup, 'conflict', axis7) : '';
  const expressionModule = textModules ? getTextModule(textModules, ageGroup, 'expression', expression) : '';
  const confidenceModule = textModules ? getTextModule(textModules, ageGroup, 'confidence', confidence) : '';
  
  return {
    resultType,
    expression,
    confidence,
    axes: {
      axis1,
      axis2,
      axis3,
      axis4,
      axis5,
      axis6,
      axis7,
    },
    modules: {
      motivation: motivationModule,
      start: startModule,
      conflict: conflictModule,
      expression: expressionModule,
      confidence: confidenceModule,
    },
  };
}

