import { PayloadV1, Tariff, FreeAnswers, VipAnswers } from '../types/payload';
import { getAgeGroupKey } from '../utils/ageGroup';
import { getAgeBucket } from '../utils/ageBucket';
import { normalizeGender } from '../utils/genderNormalizer';
import { formatReportDateFromISO } from '../utils/dateFormat';
import { normalizeFullName } from '../utils/textUtils';
import { resolveFreeProfileCode } from './free/resolveFree';
import { resolveVipMetrics as resolveVipLegacy } from './vip/resolveVip';
import { resolveVipMetrics as resolveVipWithConfig } from './resolveVipMetrics';
import { pickText } from './vip/textPicker';
import type { ExtendedTestConfig } from './types';
import type { ExtendedAnswers } from './types';

interface UserInput {
  fullName: string;
  email: string;
  age: number;
  gender: string | 'male' | 'female'; // Может быть русским или английским, будет нормализовано
  parentEmail?: string;
}

interface BuilderOptions {
  testId: string;
  tariff: Tariff;
  completedAt: string; // ISO
  user: UserInput;
  answers: Record<string, string>; // Raw answers
  /** Конфиг EXTENDED/PREMIUM — если передан, moduleId считается по нему (как на странице результатов). */
  testConfig?: ExtendedTestConfig;
}

function toExtendedAnswers(answers: Record<string, string>): ExtendedAnswers {
  const out: ExtendedAnswers = {} as ExtendedAnswers;
  for (const k of Object.keys(answers)) {
    const num = Number(k);
    if (!Number.isNaN(num) && (answers[k] === 'A' || answers[k] === 'B')) {
      out[num] = answers[k] as 'A' | 'B';
    }
  }
  return out;
}

export function buildPayload(opts: BuilderOptions): PayloadV1 {
  const { testId, tariff, completedAt, user, answers, testConfig } = opts;

  // 1. Normalize core data
  const ageGroupKey = getAgeGroupKey(user.age);
  const ageBucket = getAgeBucket(user.age);
  const fullNameUpper = normalizeFullName(user.fullName);
  const genderNormalized = normalizeGender(user.gender);
  const reportDateFormatted = formatReportDateFromISO(completedAt);

  const isVip = tariff === 'EXTENDED' || tariff === 'PREMIUM';

  // 2. Base Objects
  const baseUser = {
    fullName: fullNameUpper,
    age: user.age,
    gender: genderNormalized, // Нормализовано к "male" | "female"
    email: user.email,
    // Parent Email is NOT here in V1
  };

  const placeholdersBase = {
    USER_FULL_NAME: fullNameUpper,
    REPORT_DATE: reportDateFormatted,
  };

  // 3. Engine Calculation
  let moduleId = '';
  let placeholdersExtended = undefined;
  
  if (!isVip) {
    // FREE Logic
    const freeAnswers = answers as unknown as FreeAnswers;
    moduleId = resolveFreeProfileCode(freeAnswers);
    // FREE has NO placeholdersExtended
  } else {
    // VIP Logic: при наличии testConfig считаем так же, как на странице результатов (одна логика)
    const extendedAnswers = toExtendedAnswers(answers);
    let axes: {
      AXIS_SOCIAL_VALUE: number;
      AXIS_FOCUS_VALUE: number;
      AXIS_DECISION_VALUE: number;
      AXIS_STRUCTURE_VALUE: number;
      AXIS_MOTIVATION_VALUE: number;
      AXIS_ACTIVATION_VALUE: number;
      AXIS_COMMUNICATION_VALUE: number;
    };
    let expression: number;
    let confidence: number;

    if (testConfig && 'EI' in testConfig.resultMapping) {
      const metrics = resolveVipWithConfig(extendedAnswers, testConfig, null, user.age);
      moduleId = metrics.resultType;
      axes = {
        AXIS_SOCIAL_VALUE: metrics.axes.axis1,
        AXIS_FOCUS_VALUE: metrics.axes.axis2,
        AXIS_DECISION_VALUE: metrics.axes.axis3,
        AXIS_STRUCTURE_VALUE: metrics.axes.axis4,
        AXIS_MOTIVATION_VALUE: metrics.axes.axis5,
        AXIS_ACTIVATION_VALUE: metrics.axes.axis6,
        AXIS_COMMUNICATION_VALUE: metrics.axes.axis7,
      };
      expression = metrics.expression;
      confidence = metrics.confidence;
    } else {
      const vipAnswers = answers as unknown as VipAnswers;
      const legacy = resolveVipLegacy(vipAnswers);
      moduleId = legacy.profileCode;
      axes = legacy.axes;
      expression = legacy.expression;
      confidence = legacy.confidence;
    }

    const motivationText = pickText(ageGroupKey, 'motivation', axes.AXIS_MOTIVATION_VALUE);
    const activationText = pickText(ageGroupKey, 'activation', axes.AXIS_ACTIVATION_VALUE);
    const communicationText = pickText(ageGroupKey, 'communication', axes.AXIS_COMMUNICATION_VALUE);
    const expressionText = pickText(ageGroupKey, 'expression', expression);
    const confidenceText = pickText(ageGroupKey, 'confidence', confidence);

    placeholdersExtended = {
      AXIS_SOCIAL_VALUE: axes.AXIS_SOCIAL_VALUE,
      AXIS_FOCUS_VALUE: axes.AXIS_FOCUS_VALUE,
      AXIS_DECISION_VALUE: axes.AXIS_DECISION_VALUE,
      AXIS_STRUCTURE_VALUE: axes.AXIS_STRUCTURE_VALUE,
      AXIS_MOTIVATION_VALUE: axes.AXIS_MOTIVATION_VALUE,
      AXIS_ACTIVATION_VALUE: axes.AXIS_ACTIVATION_VALUE,
      AXIS_COMMUNICATION_VALUE: axes.AXIS_COMMUNICATION_VALUE,
      META_EXPRESSIVENESS_VALUE: expression,
      META_EXPRESSIVENESS_TEXT: expressionText,
      META_CONFIDENCE_VALUE: confidence,
      META_CONFIDENCE_TEXT: confidenceText,
      SUMMARY_MOTIVATION: motivationText,
      SUMMARY_ACTIVATION: activationText,
      SUMMARY_COMMUNICATION: communicationText,
    };
  }

  // 4. Construct Final Payload
  const payload: PayloadV1 = {
    version: 'payload_v1',
    testId,
    tariff,
    completedAt,
    ageBucket, // Вычисляемое поле для выбора папок отчетов
    user: baseUser,
    moduleId,
    placeholdersBase,
  };

  if (placeholdersExtended) {
    payload.placeholdersExtended = placeholdersExtended;
  }

  if (tariff === 'PREMIUM') {
    if (!user.parentEmail) {
      // Logic requirement: Premium needs parent email.
      // If missing in input, we can't create valid payload.
      // For safety, we might throw or assume it's optional in input but required in payload.
      // Assuming input must provide it.
      console.warn("PREMIUM tariff requires parentEmail, but it was missing in input.");
    }
    payload.parent = {
      enabled: true,
      email: user.parentEmail || '' // fallback to avoid crash, validation will catch empty string if email required
    };
  }

  return payload;
}
