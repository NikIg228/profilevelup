import type { FormData, FormErrorKey, AgeGroup, UserPayload } from './home.types';

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

  const trimmedEmail = form.email.trim();
  const trimmedEmailConfirm = form.emailConfirm.trim();
  const trimmedParentEmail = form.parentEmail.trim();
  const trimmedParentEmailConfirm = form.parentEmailConfirm.trim();
  const isBasicTest = plan === 'free' || form.testType === 'Первичное понимание';
  const isPremiumTest = form.testType === 'Семейная навигация';

  // Валидация имени
  if (!form.name.trim()) {
    errors.name = 'Введите имя';
  }

  // Валидация возраста
  if (!form.age.trim()) {
    errors.age = 'Введите возраст';
  } else {
    const ageNum = parseInt(form.age.trim(), 10);
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
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

  // Валидация email
  if (!trimmedEmail) {
    errors.email = 'Введите email';
  } else if (!validateEmail(trimmedEmail)) {
    errors.email = 'Введите корректный email';
  }

  // Валидация подтверждения email (для не-Basic тестов)
  if (!isBasicTest) {
    if (!trimmedEmailConfirm) {
      errors.emailConfirm = 'Подтвердите email';
    } else if (trimmedEmail !== trimmedEmailConfirm) {
      errors.emailConfirm = 'Email не совпадает';
    }
  }

  // Валидация email родителя (для Premium теста)
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
  const trimmedEmail = form.email.trim();
  const trimmedEmailConfirm = form.emailConfirm.trim();
  const trimmedParentEmail = form.parentEmail.trim();
  const trimmedParentEmailConfirm = form.parentEmailConfirm.trim();
  const isBasicTest = plan === 'free' || form.testType === 'Первичное понимание';
  const isPremiumTest = form.testType === 'Семейная навигация';
  const emailsMatch = trimmedEmail && trimmedEmailConfirm && trimmedEmail === trimmedEmailConfirm;
  const parentEmailsMatch = trimmedParentEmail && trimmedParentEmailConfirm && trimmedParentEmail === trimmedParentEmailConfirm;

  // testType требуется только если plan === null (пользователь должен выбрать тип)
  const testTypeValid = plan !== null || form.testType;
  
  return Boolean(
    form.name.trim() &&
    form.age.trim() &&
    form.gender &&
    testTypeValid &&
    trimmedEmail &&
    (isBasicTest || (trimmedEmailConfirm && emailsMatch)) &&
    (!isPremiumTest || (trimmedParentEmail && trimmedParentEmailConfirm && parentEmailsMatch)) &&
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
      testType = 'Первичное понимание';
    } else if (plan === 'pro') {
      testType = 'Персональный разбор';
    } else {
      testType = 'Первичное понимание'; // По умолчанию для null
    }
  }

  const payload: UserPayload = {
    plan: plan || 'free',
    name: form.name.trim(),
    ageGroup,
    gender: form.gender,
    testType,
    email: form.email.trim(),
  };

  // Добавляем email родителя для Premium теста
  if (form.testType === 'Семейная навигация' && form.parentEmail.trim()) {
    payload.parentEmail = form.parentEmail.trim();
  }

  return payload;
}

