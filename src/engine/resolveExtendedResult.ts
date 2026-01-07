import type { ExtendedAnswers, ResultIndex, ExtendedTestConfig } from './types';

/**
 * Вычисляет финальный результат EXTENDED/PREMIUM теста из ответов пользователя
 * 
 * Логика подсчета:
 * - Для каждой дихотомии (EI, SN, TF, JP) считаем количество ответов A и B
 * - Если |A_count - B_count| === 1 → используем middle букву
 * - Иначе → используем букву большинства (primary для A, secondary для B)
 * 
 * Порядок букв в результате определяется порядком дихотомий в resultMapping:
 * [E/I/Z] + [S/N/X] + [T/F/Q] + [J/P/W]
 * 
 * @param answers Ответы пользователя на все 28 вопросов (A или B)
 * @param config Конфигурация теста с явным маппингом дихотомий
 * @returns Финальный результат как ResultIndex (string)
 */
export function resolveExtendedResult(
  answers: ExtendedAnswers,
  config: ExtendedTestConfig
): ResultIndex {
  const { resultMapping } = config;

  /**
   * Определяет букву для дихотомии на основе подсчета A и B
   * 
   * @param A_count Количество ответов A
   * @param B_count Количество ответов B
   * @param primary Буква для варианта A (большинство)
   * @param secondary Буква для варианта B (меньшинство)
   * @param middle Срединная буква (используется при разнице в 1)
   * @returns Буква результата
   */
  function getLetter(
    A_count: number,
    B_count: number,
    primary: string,
    secondary: string,
    middle: string
  ): string {
    if (Math.abs(A_count - B_count) === 1) {
      return middle;
    }
    return A_count > B_count ? primary : secondary;
  }

  /**
   * Вычисляет букву для одной дихотомии
   */
  function processDichotomy(dichotomy: typeof resultMapping.EI): string {
    let A_count = 0;
    let B_count = 0;
    
    for (const qId of dichotomy.questions) {
      if (answers[qId] === 'A') A_count++;
      else if (answers[qId] === 'B') B_count++;
    }
    
    return getLetter(A_count, B_count, dichotomy.primary, dichotomy.secondary, dichotomy.middle);
  }

  // Обрабатываем дихотомии в строгом порядке MBTI
  const letter1 = processDichotomy(resultMapping.EI);  // E/I/Z
  const letter2 = processDichotomy(resultMapping.SN); // S/N/X
  const letter3 = processDichotomy(resultMapping.TF);  // T/F/Q
  const letter4 = processDichotomy(resultMapping.JP);  // J/P/W

  // Строим финальный resultIndex в порядке MBTI
  const resultIndex = (letter1 + letter2 + letter3 + letter4) as ResultIndex;

  return resultIndex;
}

