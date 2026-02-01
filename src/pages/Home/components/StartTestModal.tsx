import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Modal from '../../../components/Modal';
import Select from '../../../components/Select';
import type { Plan, FormData, FormErrorKey } from '../home.types';
import { validateForm, isFormComplete, buildUserPayload } from '../home.utils';
import { testTypeToPlan, testTypeToTariff, TEST_TYPES } from '../../../utils/testTypeMapping';
import { validatePromoCode, setStoredPromo, type PromoCheckResult } from '../../../utils/promoApi';

interface StartTestModalProps {
  open: boolean;
  plan: Plan;
  initialTestType?: string;
  onClose: () => void;
}

export default function StartTestModal({ open, plan, initialTestType = '', onClose }: StartTestModalProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    testType: initialTestType,
    email: '',
    emailConfirm: '',
    parentEmail: '',
    parentEmailConfirm: '',
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({});
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCheckResult | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const isPaidTest = useMemo(
    () => form.testType === TEST_TYPES.PERSONAL || form.testType === TEST_TYPES.FAMILY,
    [form.testType]
  );

  // Обновляем testType при изменении initialTestType или открытии модалки
  useEffect(() => {
    if (open && initialTestType) {
      setForm(prev => ({ ...prev, testType: initialTestType }));
    }
  }, [open, initialTestType]);

  const isPremiumTest = useMemo(() => form.testType === TEST_TYPES.FAMILY, [form.testType]);
  const formComplete = useMemo(() => isFormComplete(form, plan), [form, plan]);

  const clearError = useCallback((field: FormErrorKey) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setForm({
      name: '',
      age: '',
      gender: '',
      testType: '',
      email: '',
      emailConfirm: '',
      parentEmail: '',
      parentEmailConfirm: '',
      consent: false,
    });
    setErrors({});
    setPromoCodeInput('');
    setAppliedPromo(null);
    setPromoError(null);
    setStoredPromo(null);
    onClose();
  }, [onClose]);

  // Сбрасываем форму при закрытии модалки
  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        age: '',
        gender: '',
        testType: '',
        email: '',
        emailConfirm: '',
        parentEmail: '',
        parentEmailConfirm: '',
        consent: false,
      });
      setErrors({});
      setPromoCodeInput('');
      setAppliedPromo(null);
      setPromoError(null);
      setStoredPromo(null);
    }
  }, [open]);

  const handleApplyPromo = useCallback(async () => {
    const code = promoCodeInput.trim();
    if (!code) {
      setPromoError('Введите промокод');
      return;
    }
    setPromoError(null);
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(code);
      if (result.valid) {
        setAppliedPromo(result);
      } else {
        setAppliedPromo(null);
        setPromoError('Промокод недействителен или истёк');
      }
    } catch (e) {
      setAppliedPromo(null);
      setPromoError(e instanceof Error ? e.message : 'Ошибка проверки промокода');
    } finally {
      setPromoLoading(false);
    }
  }, [promoCodeInput]);

  const handleSubmit = useCallback(() => {
    const newErrors = validateForm(form, plan);
    
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Определяем finalPlan на основе testType используя четкий маппинг
    let finalPlan: 'free' | 'extended' | 'premium';
    if (form.testType) {
      try {
        finalPlan = testTypeToPlan(form.testType);
      } catch {
        // Fallback для обратной совместимости
        finalPlan = plan === 'pro' ? 'extended' : 'free';
      }
    } else {
      // Fallback если testType не указан
      finalPlan = plan === 'pro' ? 'extended' : 'free';
    }
    
    // Используем правильный тип для buildUserPayload
    const planForPayload: 'free' | 'pro' = finalPlan === 'free' ? 'free' : 'pro';
    const payload = buildUserPayload(form, planForPayload);
    
    // Получаем tariff для отправки на бэкенд
    const tariff = form.testType ? testTypeToTariff(form.testType) : 'FREE';
    
    // Сохраняем возраст как число для корректной отправки на бэкенд
    const ageNum = parseInt(form.age.trim(), 10);
    
    sessionStorage.setItem('profi.user', JSON.stringify({
      ...payload,
      plan: finalPlan,
      tariff, // Добавляем tariff для отправки на бэкенд
      age: ageNum, // Сохраняем возраст как число
    }));

    // Сохраняем применённый промокод для отображения скидки на странице результата
    if (appliedPromo?.valid) {
      setStoredPromo({
        code: promoCodeInput.trim(),
        discount_percent: appliedPromo.discount_percent ?? null,
        discount_fixed: appliedPromo.discount_fixed ?? null,
      });
    } else {
      setStoredPromo(null);
    }
    
    // Навигация на правильную страницу теста в зависимости от тарифа
    const testPath = tariff === 'FREE' ? '/test/free' 
                   : tariff === 'EXTENDED' ? '/test/extended' 
                   : '/test/premium';
    navigate(testPath);
  }, [form, plan, navigate, appliedPromo, promoCodeInput]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      hideScrollbar={Object.keys(errors).length === 0}
    >
      <h3 className="text-xl font-semibold mb-4">Перед началом — немного о Вас</h3>
      <div className="grid gap-3">
        <div className="space-y-1">
          <input
            type="text"
            id="form-name"
            name="name"
            className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
              errors.name 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-black/10 focus:border-primary'
            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
            placeholder="Имя"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              clearError('name');
            }}
            onBlur={() => {
              if (!form.name.trim()) {
                setErrors(prev => ({ ...prev, name: 'Укажите имя' }));
              }
            }}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </motion.p>
          )}
        </div>
        <div className="space-y-1">
          <input
            type="text"
            id="form-age"
            name="age"
            className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
              errors.age 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-black/10 focus:border-primary'
            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
            placeholder="Возраст"
            inputMode="numeric"
            value={form.age}
            onChange={(e) => {
              setForm({ ...form, age: e.target.value });
              clearError('age');
            }}
            onBlur={() => {
              if (!form.age.trim()) {
                setErrors(prev => ({ ...prev, age: 'Укажите возраст' }));
              } else {
                const ageNum = parseInt(form.age, 10);
                if (isPremiumTest) {
                  if (isNaN(ageNum) || ageNum < 12 || ageNum > 20) {
                    setErrors(prev => ({ ...prev, age: 'Возраст должен быть от 12 до 20 лет' }));
                  }
                } else if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
                  setErrors(prev => ({ ...prev, age: 'Возраст должен быть от 12 до 70 лет' }));
                }
              }
            }}
            aria-invalid={Boolean(errors.age)}
          />
          {errors.age && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.age}
            </motion.p>
          )}
        </div>
        <div className="space-y-1">
          <Select
            id="form-gender"
            name="gender"
            value={form.gender}
            onChange={(v) => {
              setForm({ ...form, gender: v });
              clearError('gender');
            }}
            placeholder="Ваш пол"
            options={[
              { value: 'Мужской', label: 'Мужской' },
              { value: 'Женский', label: 'Женский' },
            ]}
            error={Boolean(errors.gender)}
          />
          {errors.gender && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.gender}
            </motion.p>
          )}
        </div>
        {/* Email ребёнка: только для бесплатного теста и Персонального разбора (для Семейной навигации не показываем) */}
        {!isPremiumTest && (
          <>
            <div className="space-y-1">
              <input
                type="email"
                id="form-email"
                name="email"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-black/10 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Email (обязательно)"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  clearError('email');
                }}
                onBlur={() => {
                  const emailValue = form.email.trim();
                  if (!emailValue) {
                    setErrors(prev => ({ ...prev, email: 'Укажите email' }));
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
                    setErrors(prev => ({ ...prev, email: 'Введите корректный email' }));
                  }
                }}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </motion.p>
              )}
            </div>
          </>
        )}
        {isPremiumTest && (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-heading mb-1 text-center">
                Email родителя для получения отчёта
              </label>
              <input
                type="email"
                id="form-parent-email"
                name="parentEmail"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                  errors.parentEmail 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-black/10 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Email родителя"
                value={form.parentEmail}
                onChange={(e) => {
                  setForm({ ...form, parentEmail: e.target.value });
                  clearError('parentEmail');
                }}
                onBlur={() => {
                  const parentEmailValue = form.parentEmail.trim();
                  if (!parentEmailValue) {
                    setErrors(prev => ({ ...prev, parentEmail: 'Укажите email родителя' }));
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmailValue)) {
                    setErrors(prev => ({ ...prev, parentEmail: 'Введите корректный email' }));
                  }
                }}
                aria-invalid={Boolean(errors.parentEmail)}
              />
              {errors.parentEmail && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.parentEmail}
                </motion.p>
              )}
            </div>
            <div className="space-y-1">
              <input
                type="email"
                id="form-parent-email-confirm"
                name="parentEmailConfirm"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                  errors.parentEmailConfirm 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-black/10 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Подтвердите email родителя"
                value={form.parentEmailConfirm}
                onChange={(e) => {
                  setForm({ ...form, parentEmailConfirm: e.target.value });
                  clearError('parentEmailConfirm');
                }}
                onBlur={() => {
                  const parentEmailValue = form.parentEmail.trim();
                  const parentEmailConfirmValue = form.parentEmailConfirm.trim();
                  if (!parentEmailConfirmValue) {
                    setErrors(prev => ({ ...prev, parentEmailConfirm: 'Повторите email родителя' }));
                  } else if (parentEmailConfirmValue !== parentEmailValue) {
                    setErrors(prev => ({ ...prev, parentEmailConfirm: 'Email родителя не совпадает' }));
                  }
                }}
                aria-invalid={Boolean(errors.parentEmailConfirm)}
              />
              {errors.parentEmailConfirm && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.parentEmailConfirm}
                </motion.p>
              )}
            </div>
          </>
        )}
        {plan === null && (
          <div className="space-y-1">
            <Select
              id="form-test-type"
              name="testType"
              value={form.testType}
              onChange={(v) => {
                setForm({ ...form, testType: v });
                clearError('testType');
              }}
              placeholder="Вид навигации"
              options={[
                { value: TEST_TYPES.PRIMARY, label: 'Первичное понимание — Бесплатно' },
                { value: TEST_TYPES.PERSONAL, label: 'Персональный разбор — 14 990 ₸' },
                { value: TEST_TYPES.FAMILY, label: 'Семейная навигация — 34 990 ₸' },
              ]}
              error={Boolean(errors.testType)}
            />
            {errors.testType && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.testType}
              </motion.p>
            )}
          </div>
        )}
        {/* Промокод: только для платных тестов, в самом низу формы */}
        {isPaidTest && (
          <div className="space-y-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
            <label className="block text-sm font-medium text-heading">Промокод</label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value);
                  setPromoError(null);
                  if (appliedPromo) setAppliedPromo(null);
                }}
                placeholder="Введите код"
                className="flex-1 min-w-[120px] px-4 py-2 rounded-xl border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={promoLoading}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading}
                className="px-4 py-2 rounded-xl bg-secondary/30 text-heading font-medium hover:bg-secondary/50 disabled:opacity-50 transition-colors"
              >
                {promoLoading ? 'Проверка…' : 'Применить'}
              </button>
            </div>
            {promoError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {promoError}
              </p>
            )}
            {appliedPromo?.valid && (
              <p className="text-xs text-green-600 font-medium">
                {appliedPromo.discount_percent != null
                  ? `Скидка ${appliedPromo.discount_percent}% применена`
                  : appliedPromo.discount_fixed != null
                  ? `Скидка ${appliedPromo.discount_fixed} ₸ применена`
                  : 'Промокод применён'}
              </p>
            )}
          </div>
        )}
        <div className="space-y-1 text-xs text-muted">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              id="form-consent"
              name="consent"
              checked={form.consent}
              onChange={(e) => {
                setForm({ ...form, consent: e.target.checked });
                clearError('consent');
              }}
              className={`mt-0.5 h-4 w-4 rounded border border-black/20 transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.consent ? 'border-red-500' : ''}`}
              aria-invalid={Boolean(errors.consent)}
            />
            <span>
              Настоящим Вы соглашаетесь с{' '}
              <Link to="/privacy" className="text-heading font-bold hover:underline">
                Политикой конфиденциальности
              </Link>
              ,{' '}
              <Link to="/terms" className="text-heading font-bold hover:underline">
                Пользовательским соглашением
              </Link>
              ,{' '}
              <Link to="/public-offer" className="text-heading font-bold hover:underline">
                Публичной офертой
              </Link>{' '}
              и <span className="text-heading font-bold">получением рассылок</span>.<br />
            </span>
          </label>
          {errors.consent && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.consent}
            </motion.p>
          )}
        </div>
        <button
          type="button"
          className={`btn btn-primary px-5 py-3 transition ${
            formComplete ? '' : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={!formComplete}
        >
          Начать   
        </button>
      </div>
    </Modal>
  );
}

