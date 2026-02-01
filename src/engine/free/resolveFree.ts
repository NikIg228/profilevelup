import { FreeAnswers } from '../../types/payload';

/**
 * Resolves the 4-letter profile code for the FREE tariff.
 * 
 * Logic:
 * - Position 1 (E/I) = Answer to Q2
 * - Position 2 (S/N) = Answer to Q5
 * - Position 3 (T/F) = Answer to Q3
 * - Position 4 (J/P/W) = ResolveJPW(Q1, Q4)
 *   - If Q1 == Q4 => Use that letter
 *   - If Q1 != Q4 => 'W'
 */
export function resolveFreeProfileCode(answers: FreeAnswers): string {
  // Ensure we have values, though schema guarantees keys exist
  const a1 = answers['1'] || '';
  const a2 = answers['2'] || '';
  const a3 = answers['3'] || '';
  const a4 = answers['4'] || '';
  const a5 = answers['5'] || '';

  // Position 1: E/I
  const pos1 = a2;

  // Position 2: S/N
  const pos2 = a5;

  // Position 3: T/F
  const pos3 = a3;

  // Position 4: J/P or W
  let pos4 = 'W';
  if (a1 && a4 && a1 === a4) {
    pos4 = a1;
  }

  return `${pos1}${pos2}${pos3}${pos4}`;
}

