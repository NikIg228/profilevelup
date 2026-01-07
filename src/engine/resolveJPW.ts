import type { QuestionLetter } from './types';

/**
 * Разрешает позицию 4 (J/P/W) из ответов на вопросы 1 и 4
 * 
 * Правила:
 * - Если answer_q1 === answer_q4 → использовать эту букву (J или P)
 * - Если answer_q1 !== answer_q4 → использовать "W"
 * 
 * @param a1 Ответ на вопрос 1 ('P' | 'J')
 * @param a4 Ответ на вопрос 4 ('J' | 'P')
 * @returns 'J' | 'P' | 'W'
 */
export function resolveJPW(
  a1: QuestionLetter,
  a4: QuestionLetter
): 'J' | 'P' | 'W' {
  if (a1 === a4) {
    return a1 as 'J' | 'P';
  }
  return 'W';
}

