import type { Answers, ResultIndex, FreeTestConfig, ExtendedTestConfig, ExtendedAnswers } from './types';
import { resolveJPW } from './resolveJPW';

/**
 * Вычисляет финальный результат FREE теста из ответов пользователя
 * 
 * Порядок букв в результате согласно free_rules.md:
 * [E/I] – [N/S] – [T/F] – [J/P/W]
 * 
 * Маппинг определяется из config.resultMapping:
 * - position1 → из вопроса указанного в resultMapping.position1.from (вопрос 2)
 * - position2 → из вопроса указанного в resultMapping.position2.from (вопрос 5)
 * - position3 → из вопроса указанного в resultMapping.position3.from (вопрос 3)
 * - position4 → из вопросов указанных в resultMapping.position4.from (вопросы 1 и 4)
 * 
 * @param answers Ответы пользователя на все 5 вопросов
 * @param config Конфигурация FREE теста с позиционным маппингом
 * @returns Финальный результат как ResultIndex (string)
 */
export function resolveFreeResult(answers: Answers, config: FreeTestConfig): ResultIndex {
  const { resultMapping } = config;
  
  // Позиция 1: E/I из вопроса 2
  const pos1QuestionId = resultMapping.position1.from;
  const pos1Letter = answers[pos1QuestionId as keyof Answers] as 'E' | 'I';
  
  // Позиция 2: N/S из вопроса 5
  const pos2QuestionId = resultMapping.position2.from;
  const pos2Letter = answers[pos2QuestionId as keyof Answers] as 'N' | 'S';
  
  // Позиция 3: T/F из вопроса 3
  const pos3QuestionId = resultMapping.position3.from;
  const pos3Letter = answers[pos3QuestionId as keyof Answers] as 'T' | 'F';
  
  // Позиция 4: J/P/W из вопросов 1 и 4
  const pos4QuestionIds = resultMapping.position4.from;
  const pos4Letter = resolveJPW(
    answers[pos4QuestionIds[0] as keyof Answers],
    answers[pos4QuestionIds[1] as keyof Answers]
  );
  
  // Строим финальный resultIndex
  const resultIndex = pos1Letter + pos2Letter + pos3Letter + pos4Letter;
  
  return resultIndex;
}

/**
 * Вычисляет финальный результат EXTENDED/PREMIUM (VIP) теста из ответов пользователя
 * 
 * Порядок букв в результате согласно vip_rules.md:
 * [E/I/Z] – [S/N/X] – [T/F/Q] – [J/P/W]
 * 
 * Алгоритм:
 * 1. Для каждой дихотомии подсчитываются ответы A и B
 * 2. Если разница между A и B равна 1, используется срединная буква
 * 3. Иначе используется первая буква если A > B, вторая если B > A
 * 
 * @param answers Ответы пользователя на все 28 вопросов (A или B)
 * @param config Конфигурация EXTENDED/PREMIUM теста с блочным маппингом
 * @returns Финальный результат как ResultIndex (string)
 */
export function resolveExtendedResult(
  answers: ExtendedAnswers,
  config: ExtendedTestConfig
): ResultIndex {
  const { resultMapping } = config;
  
  /**
   * Вычисляет букву для дихотомии на основе подсчета ответов A и B
   */
  function getDichotomyLetter(
    aCount: number,
    bCount: number,
    primary: string,
    secondary: string,
    middle: string
  ): string {
    if (Math.abs(aCount - bCount) === 1) {
      return middle; // Срединный тип
    }
    return aCount > bCount ? primary : secondary;
  }
  
  /**
   * Подсчитывает ответы A и B для списка вопросов
   */
  function countAnswers(questionIds: number[]): { aCount: number; bCount: number } {
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
  
  // Дихотомия E/I
  const eiCounts = countAnswers(resultMapping.EI.questions);
  const eiLetter = getDichotomyLetter(
    eiCounts.aCount,
    eiCounts.bCount,
    resultMapping.EI.primary,
    resultMapping.EI.secondary,
    resultMapping.EI.middle
  );
  
  // Дихотомия S/N
  const snCounts = countAnswers(resultMapping.SN.questions);
  const snLetter = getDichotomyLetter(
    snCounts.aCount,
    snCounts.bCount,
    resultMapping.SN.primary,
    resultMapping.SN.secondary,
    resultMapping.SN.middle
  );
  
  // Дихотомия T/F
  const tfCounts = countAnswers(resultMapping.TF.questions);
  const tfLetter = getDichotomyLetter(
    tfCounts.aCount,
    tfCounts.bCount,
    resultMapping.TF.primary,
    resultMapping.TF.secondary,
    resultMapping.TF.middle
  );
  
  // Дихотомия J/P
  const jpCounts = countAnswers(resultMapping.JP.questions);
  const jpLetter = getDichotomyLetter(
    jpCounts.aCount,
    jpCounts.bCount,
    resultMapping.JP.primary,
    resultMapping.JP.secondary,
    resultMapping.JP.middle
  );
  
  // Строим финальный resultIndex
  const resultIndex = eiLetter + snLetter + tfLetter + jpLetter;
  
  return resultIndex;
}

/**
 * Экспортируем функцию для использования в компонентах
 */
export function resolveResult(answers: Answers, config: FreeTestConfig): ResultIndex {
  return resolveFreeResult(answers, config);
}

