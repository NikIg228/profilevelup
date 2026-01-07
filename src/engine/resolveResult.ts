import type { Answers, ExtendedAnswers, ResultIndex, TestConfig, FreeTestConfig, ExtendedTestConfig } from './types';
import { resolveJPW } from './resolveJPW';
import { resolveExtendedResult } from './resolveExtendedResult';

/**
 * Проверяет, является ли конфигурация FREE тестом
 */
function isFreeTest(config: TestConfig): config is FreeTestConfig {
  return 'position1' in config.resultMapping;
}

/**
 * Вычисляет финальный результат FREE теста из ответов пользователя
 * 
 * Порядок букв в результате:
 * [E/I] – [N/S] – [T/F] – [J/P/W]
 * 
 * Маппинг определяется из config.resultMapping:
 * - position1 → из вопроса указанного в resultMapping.position1.from
 * - position2 → из вопроса указанного в resultMapping.position2.from
 * - position3 → из вопроса указанного в resultMapping.position3.from
 * - position4 → из вопросов указанных в resultMapping.position4.from (J/P/W логика)
 * 
 * @param answers Ответы пользователя на все 5 вопросов
 * @param config Конфигурация FREE теста с позиционным маппингом
 * @returns Финальный результат как ResultIndex (string)
 */
function resolveFreeResult(answers: Answers, config: FreeTestConfig): ResultIndex {
  const { resultMapping } = config;
  
  // Позиция 1: из вопроса указанного в resultMapping.position1.from
  const pos1QuestionId = resultMapping.position1.from;
  const pos1Letter = answers[pos1QuestionId as keyof Answers] as 'E' | 'I';
  
  // Позиция 2: из вопроса указанного в resultMapping.position2.from
  const pos2QuestionId = resultMapping.position2.from;
  const pos2Letter = answers[pos2QuestionId as keyof Answers] as 'N' | 'S';
  
  // Позиция 3: из вопроса указанного в resultMapping.position3.from
  const pos3QuestionId = resultMapping.position3.from;
  const pos3Letter = answers[pos3QuestionId as keyof Answers] as 'T' | 'F';
  
  // Позиция 4: из вопросов указанных в resultMapping.position4.from (J/P/W логика)
  const pos4QuestionIds = resultMapping.position4.from;
  const pos4Letter = resolveJPW(
    answers[pos4QuestionIds[0] as keyof Answers],
    answers[pos4QuestionIds[1] as keyof Answers]
  );
  
  // Строим финальный resultIndex
  const resultIndex = (pos1Letter + pos2Letter + pos3Letter + pos4Letter) as ResultIndex;
  
  return resultIndex;
}

/**
 * Вычисляет финальный результат теста из ответов пользователя
 * 
 * Автоматически определяет тип теста (FREE или EXTENDED/PREMIUM) и использует соответствующую логику
 * 
 * @param answers Ответы пользователя (Answers для FREE, ExtendedAnswers для EXTENDED/PREMIUM)
 * @param config Конфигурация теста
 * @returns Финальный результат как ResultIndex (string)
 */
export function resolveResult(
  answers: Answers | ExtendedAnswers,
  config: TestConfig
): ResultIndex {
  if (isFreeTest(config)) {
    // FREE тест - используем позиционную логику
    return resolveFreeResult(answers as Answers, config);
  } else {
    // EXTENDED/PREMIUM тест - используем блочную логику
    return resolveExtendedResult(answers as ExtendedAnswers, config as ExtendedTestConfig);
  }
}
