import { z } from 'zod';

export const TariffSchema = z.enum(['FREE', 'EXTENDED', 'PREMIUM']);
export type Tariff = z.infer<typeof TariffSchema>;

export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;

export const AgeGroupKeySchema = z.enum(['12_14', '15_17', '18_20', '21_plus']);
export type AgeGroupKey = z.infer<typeof AgeGroupKeySchema>;

export const EngineSchema = z.enum(['FREE', 'VIP']);
export type Engine = z.infer<typeof EngineSchema>;

export const FreeAnswersSchema = z.record(z.enum(['1', '2', '3', '4', '5']), z.string());
export type FreeAnswers = z.infer<typeof FreeAnswersSchema>;

// VIP has 28 questions, keys 1-28
const VipQuestionKeys = z.enum([
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28'
]);
export const VipAnswersSchema = z.record(VipQuestionKeys, z.enum(['A', 'B']));
export type VipAnswers = z.infer<typeof VipAnswersSchema>;

// --- New Flattened Structure ---

export const PlaceholdersBaseSchema = z.object({
  USER_FULL_NAME: z.string(), // Must be UPPERCASE
  REPORT_DATE: z.string(), // "DD MON YYYY"
});
export type PlaceholdersBase = z.infer<typeof PlaceholdersBaseSchema>;

export const PlaceholdersExtendedSchema = z.object({
  // Axes
  AXIS_SOCIAL_VALUE: z.number().min(0).max(100),
  AXIS_FOCUS_VALUE: z.number().min(0).max(100),
  AXIS_DECISION_VALUE: z.number().min(0).max(100),
  AXIS_STRUCTURE_VALUE: z.number().min(0).max(100),
  AXIS_MOTIVATION_VALUE: z.number().min(0).max(100),
  AXIS_ACTIVATION_VALUE: z.number().min(0).max(100),
  AXIS_COMMUNICATION_VALUE: z.number().min(0).max(100),

  // Meta
  META_EXPRESSIVENESS_VALUE: z.number().min(0).max(100),
  META_EXPRESSIVENESS_TEXT: z.string(),
  META_CONFIDENCE_VALUE: z.number().min(0).max(100),
  META_CONFIDENCE_TEXT: z.string(),

  // Summaries
  SUMMARY_MOTIVATION: z.string(),
  SUMMARY_ACTIVATION: z.string(),
  SUMMARY_COMMUNICATION: z.string(),
});
export type PlaceholdersExtended = z.infer<typeof PlaceholdersExtendedSchema>;

export const ParentSchema = z.object({
  enabled: z.literal(true),
  email: z.string().email(),
});
export type ParentPayload = z.infer<typeof ParentSchema>;

export const PayloadSchema = z.object({
  version: z.literal('payload_v1'),
  testId: z.string(),
  tariff: TariffSchema,
  completedAt: z.string().datetime(), // ISO
  ageBucket: AgeGroupKeySchema, // Вычисляемое поле для выбора папок отчетов
  user: z.object({
    fullName: z.string(), // UPPERCASE
    age: z.number().int().positive(),
    gender: GenderSchema, // Строго "male" | "female"
    email: z.string().email(),
  }),
  moduleId: z.string(), // e.g. "ENTJ", "INFW"
  placeholdersBase: PlaceholdersBaseSchema,
  
  // Optional / Tariff dependent
  placeholdersExtended: PlaceholdersExtendedSchema.optional(),
  parent: ParentSchema.optional(),
});

export type PayloadV1 = z.infer<typeof PayloadSchema>;
