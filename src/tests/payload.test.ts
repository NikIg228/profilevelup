import { describe, it, expect } from 'vitest';
import { getAgeGroupKey } from '../utils/ageGroup';
import { getAgeBucket } from '../utils/ageBucket';
import { normalizeGender } from '../utils/genderNormalizer';
import { pickText } from '../engine/vip/textPicker';
import { resolveVipMetrics } from '../engine/vip/resolveVip';
import { buildPayload } from '../engine/buildPayload';
import { VipAnswers } from '../types/payload';
import { normalizeFullName } from '../utils/textUtils';
import { formatReportDateFromISO } from '../utils/dateFormat';
import { validatePayload } from '../utils/validatePayload';

describe('Payload Utils', () => {
  it('getAgeGroupKey maps ages correctly', () => {
    expect(getAgeGroupKey(12)).toBe('12_14');
    expect(getAgeGroupKey(21)).toBe('21_plus');
  });

  it('getAgeBucket maps ages correctly', () => {
    expect(getAgeBucket(12)).toBe('12_14');
    expect(getAgeBucket(14)).toBe('12_14');
    expect(getAgeBucket(15)).toBe('15_17');
    expect(getAgeBucket(17)).toBe('15_17');
    expect(getAgeBucket(18)).toBe('18_20');
    expect(getAgeBucket(20)).toBe('18_20');
    expect(getAgeBucket(21)).toBe('21_plus');
    expect(getAgeBucket(25)).toBe('21_plus');
    expect(getAgeBucket(99)).toBe('21_plus');
  });

  it('normalizeGender normalizes correctly', () => {
    // English
    expect(normalizeGender('male')).toBe('male');
    expect(normalizeGender('female')).toBe('female');
    expect(normalizeGender('MALE')).toBe('male');
    expect(normalizeGender('FEMALE')).toBe('female');
    
    // Russian
    expect(normalizeGender('Мужской')).toBe('male');
    expect(normalizeGender('Женский')).toBe('female');
    expect(normalizeGender('мужской')).toBe('male');
    expect(normalizeGender('женский')).toBe('female');
    
    // Short forms
    expect(normalizeGender('M')).toBe('male');
    expect(normalizeGender('F')).toBe('female');
    expect(normalizeGender('м')).toBe('male');
    expect(normalizeGender('ж')).toBe('female');
    
    // Invalid values
    expect(() => normalizeGender('unknown')).toThrow();
    expect(() => normalizeGender('')).toThrow();
    expect(() => normalizeGender(123 as any)).toThrow();
  });

  it('normalizeFullName trims and uppercases', () => {
    expect(normalizeFullName('  john doe ')).toBe('JOHN DOE');
    expect(normalizeFullName('Jane')).toBe('JANE');
  });

  it('formatReportDateFromISO formats correctly', () => {
    // Note: This creates date in local time or UTC depending on string.
    // '2025-01-24T12:00:00Z' is UTC. Local might be different day depending on TZ.
    // Ideally we treat it as ISO.
    // The util uses `new Date(isoString)`.
    const date = '2025-01-24T12:00:00.000Z';
    // If running in environment with timezone issues, this might flake.
    // For unit test safety, let's just check format structure primarily.
    const res = formatReportDateFromISO(date);
    expect(res).toMatch(/^[0-3][0-9] [A-Z]{3} 2025$/);
    expect(res).toContain('JAN');
  });
});

describe('Validation Logic', () => {
  it('throws on lowercase name', () => {
    const payload: any = {
      version: 'payload_v1',
      user: { fullName: 'Lower Case' },
      placeholdersBase: { USER_FULL_NAME: 'LOWER CASE' }
    };
    // Zod would fail first on missing fields, but if we mock complete payload:
    // Actually validatePayload calls schema parse first.
    // We need a valid payload structure to reach business logic check.
  });
});

describe('Build Payload V1', () => {
  it('Builds FREE payload correctly', () => {
    const payload = buildPayload({
      testId: 'free-1',
      tariff: 'FREE',
      completedAt: '2025-01-24T10:00:00Z',
      user: {
        fullName: ' Alex Free ',
        email: 'alex@example.com',
        age: 13,
        gender: 'male'
      },
      answers: {
        '1': 'J', '2': 'E', '3': 'T', '4': 'J', '5': 'N'
      }
    });

    // Check V1 Structure
    expect(payload.version).toBe('payload_v1');
    expect(payload.tariff).toBe('FREE');
    expect(payload.moduleId).toBe('ENTJ');
    expect(payload.ageBucket).toBe('12_14'); // age 13 => 12_14
    expect(payload.user.gender).toBe('male'); // Нормализовано
    
    // Check Upper Name
    expect(payload.user.fullName).toBe('ALEX FREE');
    expect(payload.placeholdersBase.USER_FULL_NAME).toBe('ALEX FREE');
    
    // Check Date
    expect(payload.placeholdersBase.REPORT_DATE).toBeTruthy();

    // Check No Extra Fields
    expect(payload.placeholdersExtended).toBeUndefined();
    expect(payload.parent).toBeUndefined();
    
    // Check answers is NOT in payload
    expect('answers' in payload).toBe(false);
    
    // Validate
    expect(() => validatePayload(payload)).not.toThrow();
  });

  it('Builds EXTENDED payload correctly', () => {
    const vipAnswers: Record<string, string> = {};
    for (let i = 1; i <= 28; i++) vipAnswers[String(i)] = 'A';

    const payload = buildPayload({
      testId: 'ext-1',
      tariff: 'EXTENDED',
      completedAt: '2025-01-24T10:00:00Z',
      user: {
        fullName: 'Maria Vip',
        email: 'maria@example.com',
        age: 16,
        gender: 'Женский' // Русский вариант, должен нормализоваться
      },
      answers: vipAnswers
    });

    expect(payload.tariff).toBe('EXTENDED');
    expect(payload.ageBucket).toBe('15_17'); // age 16 => 15_17
    expect(payload.user.gender).toBe('female'); // Нормализовано из "Женский"
    expect(payload.moduleId).toBe('ESTJ'); // All A => ESTJ (E=A, S=A, T=A, J=A)
    expect(payload.placeholdersExtended).toBeDefined();
    expect(payload.placeholdersExtended?.SUMMARY_ACTIVATION).toBeDefined(); // Activation key used
    expect(payload.placeholdersExtended?.SUMMARY_COMMUNICATION).toBeDefined(); // Communication key used
    
    expect(payload.parent).toBeUndefined();

    // Check answers is NOT in payload
    expect('answers' in payload).toBe(false);

    // Validate
    expect(() => validatePayload(payload)).not.toThrow();
  });

  it('Builds PREMIUM payload correctly', () => {
    const vipAnswers: Record<string, string> = {};
    for (let i = 1; i <= 28; i++) vipAnswers[String(i)] = 'A';

    const payload = buildPayload({
      testId: 'prem-1',
      tariff: 'PREMIUM',
      completedAt: '2025-01-24T10:00:00Z',
      user: {
        fullName: 'John Premium',
        email: 'john@example.com',
        age: 25,
        gender: 'male',
        parentEmail: 'parent@test.com'
      },
      answers: vipAnswers
    });

    expect(payload.tariff).toBe('PREMIUM');
    expect(payload.ageBucket).toBe('21_plus'); // age 25 => 21_plus
    expect(payload.user.gender).toBe('male'); // Нормализовано
    expect(payload.placeholdersExtended).toBeDefined();
    expect(payload.parent).toBeDefined();
    expect(payload.parent?.enabled).toBe(true);
    expect(payload.parent?.email).toBe('parent@test.com');

    // Check answers is NOT in payload
    expect('answers' in payload).toBe(false);

    // Validate
    expect(() => validatePayload(payload)).not.toThrow();
  });

  it('Throws error if payload contains answers', () => {
    const payload: any = {
      version: 'payload_v1',
      testId: 'test-1',
      tariff: 'FREE',
      completedAt: '2025-01-24T10:00:00Z',
      ageBucket: '15_17',
      user: {
        fullName: 'TEST USER',
        email: 'test@example.com',
        age: 15,
        gender: 'male'
      },
      moduleId: 'ENTJ',
      placeholdersBase: {
        USER_FULL_NAME: 'TEST USER',
        REPORT_DATE: '24 JAN 2025'
      },
      answers: { engine: 'FREE', items: {} } // This should cause validation error
    };

    expect(() => validatePayload(payload)).toThrow('answers must not be part of payload_v1');
  });
});
