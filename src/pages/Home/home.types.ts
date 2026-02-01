export type FormErrorKey = 'name' | 'age' | 'gender' | 'testType' | 'email' | 'emailConfirm' | 'parentEmail' | 'parentEmailConfirm' | 'consent';

export type Plan = 'free' | 'pro' | null;

export type AgeGroup = '12-17' | '18-20' | '21+';

export interface FormData {
  name: string;
  age: string;
  gender: string;
  testType: string;
  email: string;
  emailConfirm: string;
  parentEmail: string;
  parentEmailConfirm: string;
  consent: boolean;
}

export interface UserPayload {
  plan: string;
  name: string;
  ageGroup: AgeGroup;
  gender: string;
  testType: string;
  email: string;
  parentEmail?: string;
  tariff?: string; // Тариф для отправки на бэкенд: "FREE" | "EXTENDED" | "PREMIUM"
}

