import type { FormData, FormErrorKey, AgeGroup, UserPayload } from './home.types';
import { testTypeToTariff, TEST_TYPES } from '../../utils/testTypeMapping';

/**
 * Определяет возрастную группу на основе возраста
 */
export function getAgeGroup(age: number): AgeGroup {
  if (age >= 12 && age <= 17) {
    return '12-17';
  } else if (age >= 18 && age <= 20) {
    return '18-20';
  } else {
    return '21+';
  }
}

/**
 * Валидация email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Валидация формы
 */
export function validateForm(
  form: FormData,
  plan: 'free' | 'pro' | null
): Partial<Record<FormErrorKey, string>> {
  const errors: Partial<Record<FormErrorKey, string>> = {};

  const trimmedParentEmail = form.parentEmail.trim();
  const trimmedParentEmailConfirm = form.parentEmailConfirm.trim();
  const isPremiumTest = form.testType === TEST_TYPES.FAMILY;

  // Валидация имени
  if (!form.name.trim()) {
    errors.name = 'Введите имя';
  }

  // Валидация возраста (для Семейной навигации — 12–20 лет)
  if (!form.age.trim()) {
    errors.age = 'Введите возраст';
  } else {
    const ageNum = parseInt(form.age.trim(), 10);
    if (isPremiumTest) {
      if (isNaN(ageNum) || ageNum < 12 || ageNum > 20) {
        errors.age = 'Возраст должен быть от 12 до 20 лет';
      }
    } else if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
      errors.age = 'Возраст должен быть от 12 до 70 лет';
    }
  }

  // Валидация пола
  if (!form.gender) {
    errors.gender = 'Выберите пол';
  }

  // Валидация типа теста (требуется только если plan === null)
  if (plan === null && !form.testType) {
    errors.testType = 'Выберите тип теста';
  }

  // Валидация email родителя (для Семейной навигации — только родительский email)
  if (isPremiumTest) {
    if (!trimmedParentEmail) {
      errors.parentEmail = 'Введите email родителя';
    } else if (!validateEmail(trimmedParentEmail)) {
      errors.parentEmail = 'Введите корректный email родителя';
    }

    if (!trimmedParentEmailConfirm) {
      errors.parentEmailConfirm = 'Подтвердите email родителя';
    } else if (trimmedParentEmail !== trimmedParentEmailConfirm) {
      errors.parentEmailConfirm = 'Email родителя не совпадает';
    }
  }

  // Валидация согласия
  if (!form.consent) {
    errors.consent = 'Необходимо согласие на обработку данных';
  }

  return errors;
}

/**
 * Проверяет, заполнена ли форма полностью
 */
export function isFormComplete(
  form: FormData,
  plan: 'free' | 'pro' | null
): boolean {
  const trimmedParentEmail = form.parentEmail.trim();
  const trimmedParentEmailConfirm = form.parentEmailConfirm.trim();
  const isPremiumTest = form.testType === TEST_TYPES.FAMILY;
  const parentEmailsMatch = trimmedParentEmail && trimmedParentEmailConfirm && trimmedParentEmail === trimmedParentEmailConfirm;

  // testType требуется только если plan === null (пользователь должен выбрать тип)
  const testTypeValid = plan !== null || form.testType;

  // Возраст для Семейной навигации — 12–20
  const ageNum = parseInt(form.age.trim(), 10);
  const ageValid = form.age.trim()
    ? isPremiumTest
      ? !isNaN(ageNum) && ageNum >= 12 && ageNum <= 20
      : !isNaN(ageNum) && ageNum >= 12 && ageNum <= 70
    : false;

  // Семейная навигация: только родительский email, без полей ребёнка
  if (isPremiumTest) {
    return Boolean(
      form.name.trim() &&
      ageValid &&
      form.gender &&
      testTypeValid &&
      trimmedParentEmail &&
      trimmedParentEmailConfirm &&
      parentEmailsMatch &&
      form.consent
    );
  }

  return Boolean(
    form.name.trim() &&
    ageValid &&
    form.gender &&
    testTypeValid &&
    form.consent
  );
}

/**
 * Создаёт payload пользователя для отправки в тест
 */
export function buildUserPayload(
  form: FormData,
  plan: 'free' | 'pro' | null
): UserPayload {
  const ageNum = parseInt(form.age.trim(), 10);
  const ageGroup = getAgeGroup(ageNum);

  // Определяем testType: если не указан, используем значение по умолчанию на основе плана
  let testType = form.testType;
  if (!testType) {
    if (plan === 'free') {
      testType = TEST_TYPES.PRIMARY;
    } else if (plan === 'pro') {
      testType = TEST_TYPES.PERSONAL;
    } else {
      testType = TEST_TYPES.PRIMARY; // По умолчанию для null
    }
  }

  // Получаем tariff для отправки на бэкенд
  const tariff = testTypeToTariff(testType);

  // Для Семейной навигации контактный email — родительский (поля ребёнка не заполняются)
  const contactEmail = form.testType === TEST_TYPES.FAMILY
    ? form.parentEmail.trim()
    : form.email.trim();

  const payload: UserPayload = {
    plan: plan || 'free',
    name: form.name.trim(),
    ageGroup,
    gender: form.gender,
    testType,
    email: contactEmail,
    tariff, // Добавляем tariff для отправки на бэкенд
  };

  if (form.testType === TEST_TYPES.FAMILY && form.parentEmail.trim()) {
    payload.parentEmail = form.parentEmail.trim();
  }

  return payload;
}

