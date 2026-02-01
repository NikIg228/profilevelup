import { VipAnswers } from '../../types/payload';

export const VIP_MIDDLE_MODE = 'Z';

const EI_QUESTIONS = ['1', '5', '9', '13', '17', '21', '25'];
const SN_QUESTIONS = ['2', '6', '10', '14', '18', '22', '26'];
const TF_QUESTIONS = ['3', '7', '11', '15', '19', '23', '27'];
const JP_QUESTIONS = ['4', '8', '12', '16', '20', '24', '28'];

interface BlockCounts {
  aCount: number;
  bCount: number;
}

function countAnswers(answers: VipAnswers, keys: string[]): BlockCounts {
  let aCount = 0;
  let bCount = 0;
  for (const k of keys) {
    const val = answers[k as keyof VipAnswers];
    if (val === 'A') aCount++;
    if (val === 'B') bCount++;
  }
  return { aCount, bCount };
}

function clamp(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

// Axis 1: Social (E/I). A=E(High), B=I(Low)? 
// Logic: (countA / 7) * 100.
// If A is max (7), score is 100. So A -> High Value.
function calculateAxis1(counts: BlockCounts): number {
  return clamp((counts.aCount / 7) * 100);
}

// Axis 2: Focus (S/N). B=N(High), A=S(Low).
// Logic: (countB / 7) * 100.
// If B is max (7), score is 100. So B -> High Value.
function calculateAxis2(counts: BlockCounts): number {
  return clamp((counts.bCount / 7) * 100);
}

// Axis 3: Decision (T/F). B=F(High), A=T(Low).
// Logic: (countB / 7) * 100.
function calculateAxis3(counts: BlockCounts): number {
  return clamp((counts.bCount / 7) * 100);
}

// Axis 4: Structure (J/P). A=J(High), B=P(Low).
// Logic: (countA / 7) * 100.
function calculateAxis4(counts: BlockCounts): number {
  return clamp((counts.aCount / 7) * 100);
}

function resolveDichotomy(counts: BlockCounts, primary: string, secondary: string): string {
  // При ничьей (разница 0 или 1) — Z (срединный); в бэкенде есть папка Z и модули вроде ZXQW
  if (Math.abs(counts.aCount - counts.bCount) <= 1) {
    return VIP_MIDDLE_MODE;
  }
  return counts.aCount > counts.bCount ? primary : secondary;
}

export function resolveVipMetrics(answers: VipAnswers) {
  const eiCounts = countAnswers(answers, EI_QUESTIONS);
  const snCounts = countAnswers(answers, SN_QUESTIONS);
  const tfCounts = countAnswers(answers, TF_QUESTIONS);
  const jpCounts = countAnswers(answers, JP_QUESTIONS);

  // Axes 1-4
  const axis1 = calculateAxis1(eiCounts);
  const axis2 = calculateAxis2(snCounts);
  const axis3 = calculateAxis3(tfCounts);
  const axis4 = calculateAxis4(jpCounts);

  // Axes 5-7
  const axis5 = clamp(0.45 * axis2 + 0.35 * axis3 + 0.20 * (100 - axis4));
  const axis6 = clamp(0.80 * (100 - axis4) + 0.20 * axis2);
  const axis7 = clamp(0.60 * axis3 + 0.20 * (100 - axis1) + 0.20 * (100 - axis4));

  // Expression
  const avgDist = (
    Math.abs(axis1 - 50) +
    Math.abs(axis2 - 50) +
    Math.abs(axis3 - 50) +
    Math.abs(axis4 - 50)
  ) / 4;
  const expression = clamp(2 * avgDist);

  // Confidence
  // Base Conf (Margin)
  const confMargin = (diff: number) => 30 + 10 * diff;
  const baseConf = (
    confMargin(Math.abs(eiCounts.aCount - eiCounts.bCount)) +
    confMargin(Math.abs(snCounts.aCount - snCounts.bCount)) +
    confMargin(Math.abs(tfCounts.aCount - tfCounts.bCount)) +
    confMargin(Math.abs(jpCounts.aCount - jpCounts.bCount))
  ) / 4;

  // Stability
  // Helper to split questions and check consistency
  const calcStability = (questions: string[], targetForHigh: 'A' | 'B', isAxisHigh: boolean) => {
    // If axis is high (e.g. E over I), we expect 'A' answers for E/I (since A=E).
    // Wait, let's map "Right Value" concept.
    // Axis 1: A=E (High). If user is E (High), we expect As. If user is I (Low), we expect Bs.
    // The previous logic passed `rightValue: 'A' | 'B'`.
    // Let's look at `resolveVipMetrics.ts`:
    // calculateStability(eiQuestions, 'A') -> always passed 'A' for E/I.
    // calculateStability(snQuestions, 'B') -> always passed 'B' for S/N.
    // calculateStability(tfQuestions, 'B') -> always passed 'B' for T/F.
    // calculateStability(jpQuestions, 'A') -> always passed 'A' for J/P.
    
    // Implementation in `resolveVipMetrics.ts`:
    // p1 = first3Counts[rightValue] / 3
    // p2 = last4Counts[rightValue] / 4
    // stability = 100 - abs(p1 - p2) * 100
    
    // This measures if the proportion of the "target" answer is consistent between first half and second half.
    // It doesn't depend on what the user actually scored, just consistency of that specific option.
    // So I will replicate that exactly.
    
    const target = targetForHigh;
    const first3 = questions.slice(0, 3);
    const last4 = questions.slice(3);
    
    const c1 = countAnswers(answers, first3);
    const c2 = countAnswers(answers, last4);
    
    const p1 = target === 'A' ? c1.aCount / 3 : c1.bCount / 3;
    const p2 = target === 'A' ? c2.aCount / 4 : c2.bCount / 4;
    
    return 100 - Math.abs(p1 - p2) * 100;
  };

  const stability = (
    calcStability(EI_QUESTIONS, 'A', true) +
    calcStability(SN_QUESTIONS, 'B', true) +
    calcStability(TF_QUESTIONS, 'B', true) +
    calcStability(JP_QUESTIONS, 'A', true)
  ) / 4;

  const confidence = clamp(0.70 * baseConf + 0.30 * stability);

  // Profile Code
  // E/I: A=E, B=I.
  const let1 = resolveDichotomy(eiCounts, 'E', 'I');
  // S/N: A=S, B=N. (Axis 2 is N-based, B=N).
  const let2 = resolveDichotomy(snCounts, 'S', 'N');
  // T/F: A=T, B=F. (Axis 3 is F-based, B=F).
  const let3 = resolveDichotomy(tfCounts, 'T', 'F');
  // J/P: A=J, B=P. (Axis 4 is J-based, A=J).
  const let4 = resolveDichotomy(jpCounts, 'J', 'P');

  const profileCode = `${let1}${let2}${let3}${let4}`;

  return {
    profileCode,
    axes: {
      AXIS_SOCIAL_VALUE: axis1,
      AXIS_FOCUS_VALUE: axis2,
      AXIS_DECISION_VALUE: axis3,
      AXIS_STRUCTURE_VALUE: axis4,
      AXIS_MOTIVATION_VALUE: axis5,
      AXIS_ACTIVATION_VALUE: axis6,
      AXIS_COMMUNICATION_VALUE: axis7,
    },
    expression,
    confidence
  };
}

