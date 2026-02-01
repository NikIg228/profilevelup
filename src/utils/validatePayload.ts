import { PayloadV1, PayloadSchema } from '../types/payload';
import { normalizeFullName } from './textUtils';
import { getAgeBucket } from './ageBucket';

/**
 * Validates a payload against strict business rules and schema.
 * Throws validation errors if checks fail.
 */
export function validatePayload(payload: any): void {
  // 1. Zod Schema Validation (structure & types)
  const parseResult = PayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Schema validation failed: ${JSON.stringify(parseResult.error.format())}`);
  }
  
  const data = parseResult.data as PayloadV1;

  // 2. Business Rules Checks

  // a) Full Name Uppercase consistency
  const normalizedName = normalizeFullName(data.user.fullName);
  if (data.user.fullName !== normalizedName) {
    throw new Error('user.fullName must be trimmed and uppercase');
  }
  if (data.placeholdersBase.USER_FULL_NAME !== data.user.fullName) {
    throw new Error('placeholdersBase.USER_FULL_NAME must match user.fullName');
  }

  // b) Report Date Format Regex
  const dateRegex = /^[0-3][0-9] [A-Z]{3} [0-9]{4}$/;
  if (!dateRegex.test(data.placeholdersBase.REPORT_DATE)) {
    throw new Error('REPORT_DATE must match format "DD MON YYYY" (e.g. "24 JAN 2026")');
  }

  // c) Tariff Specific Rules
  if (data.tariff === 'FREE') {
    if (data.placeholdersExtended) {
      throw new Error('FREE tariff must NOT have placeholdersExtended');
    }
    if (data.parent) {
      throw new Error('FREE tariff must NOT have parent field');
    }
  }

  if (data.tariff === 'EXTENDED') {
    if (!data.placeholdersExtended) {
      throw new Error('EXTENDED tariff MUST have placeholdersExtended');
    }
    if (data.parent) {
      throw new Error('EXTENDED tariff must NOT have parent field');
    }
  }

  if (data.tariff === 'PREMIUM') {
    if (!data.placeholdersExtended) {
      throw new Error('PREMIUM tariff MUST have placeholdersExtended');
    }
    if (!data.parent || !data.parent.enabled || !data.parent.email) {
      throw new Error('PREMIUM tariff MUST have parent field with enabled=true and email');
    }
  }

  // d) Value ranges (already checked by Zod min/max, but explicit check for logic if needed)
  if (data.placeholdersExtended) {
    const p = data.placeholdersExtended;
    const values = [
      p.AXIS_SOCIAL_VALUE, p.AXIS_FOCUS_VALUE, p.AXIS_DECISION_VALUE, p.AXIS_STRUCTURE_VALUE,
      p.AXIS_MOTIVATION_VALUE, p.AXIS_ACTIVATION_VALUE, p.AXIS_COMMUNICATION_VALUE,
      p.META_EXPRESSIVENESS_VALUE, p.META_CONFIDENCE_VALUE
    ];
    if (values.some(v => v < 0 || v > 100)) {
       throw new Error('All metric values must be 0-100');
    }
  }

  // e) AgeBucket validation
  const expectedAgeBucket = getAgeBucket(data.user.age);
  if (data.ageBucket !== expectedAgeBucket) {
    throw new Error(`ageBucket mismatch: expected ${expectedAgeBucket} for age ${data.user.age}, got ${data.ageBucket}`);
  }

  // f) Gender validation (must be strictly "male" | "female")
  if (data.user.gender !== 'male' && data.user.gender !== 'female') {
    throw new Error(`user.gender must be "male" or "female", got "${data.user.gender}"`);
  }

  // g) Answers must NOT be part of payload_v1
  if ('answers' in payload) {
    throw new Error('answers must not be part of payload_v1');
  }
}

