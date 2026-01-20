import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Select from './Select';

interface PersonalDataFormProps {
  open: boolean;
  onClose: () => void;
}

type FormErrorKey = 'name' | 'age' | 'gender' | 'email' | 'emailConfirm' | 'consent';

export default function PersonalDataForm({ open, onClose }: PersonalDataFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    age: '', 
    gender: '', 
    email: '', 
    emailConfirm: '', 
    consent: false 
  });
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({});

  const clearError = (field: FormErrorKey) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    const emailValue = form.email.trim();
    const emailConfirmValue = form.emailConfirm.trim();
    const newErrors: Partial<Record<FormErrorKey, string>> = {};

    if (!form.name.trim()) newErrors.name = 'Укажите имя';
    
    // Валидация возраста (12-70)
    if (!form.age.trim()) {
      newErrors.age = 'Укажите возраст';
    } else {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
        newErrors.age = 'Возраст должен быть от 12 до 70 лет';
      }
    }
    
    if (!form.gender) newErrors.gender = 'Выберите пол';
    
    if (!emailValue) {
      newErrors.email = 'Укажите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (!emailConfirmValue) {
      newErrors.emailConfirm = 'Повторите email';
    } else if (emailConfirmValue !== emailValue) {
      newErrors.emailConfirm = 'Email не совпадает';
    }
    
    if (!form.consent) newErrors.consent = 'Необходимо подтвердить согласие';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Преобразуем возраст в возрастную группу (формат должен соответствовать getTestConfig)
    const ageNum = parseInt(form.age, 10);
    let ageGroup: '12-17' | '18-20' | '21+';
    if (ageNum >= 12 && ageNum <= 17) {
      ageGroup = '12-17';
    } else if (ageNum >= 18 && ageNum <= 20) {
      ageGroup = '18-20';
    } else {
      ageGroup = '21+';
    }
    
    // Сохраняем данные для EXTENDED теста (Личный разбор)
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      name: form.name.trim(),
      ageGroup,
      gender: form.gender,
      email: emailValue,
      testType: 'Личный разбор',
      plan: 'extended'
    }));
    
    // Закрываем модальное окно и переходим к тесту
    onClose();
    navigate('/test');
  };

  const isFormComplete = Boolean(
    form.name.trim() &&
    form.age.trim() &&
    form.gender &&
    form.email.trim() &&
    form.emailConfirm.trim() &&
    form.email.trim() === form.emailConfirm.trim() &&
    form.consent
  );

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="text-xl font-semibold mb-4">Перед началом — немного о Вас</h3>
      <div className="grid gap-3">
        <div className="space-y-1">
          <input
            type="text"
            id="pdf-name"
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
            id="pdf-age"
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
                if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
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
            id="pdf-gender"
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

        <div className="space-y-1">
          <input
            type="email"
            id="pdf-email"
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

        <div className="space-y-1">
          <input
            type="email"
            id="pdf-email-confirm"
            name="emailConfirm"
            className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
              errors.emailConfirm 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-black/10 focus:border-primary'
            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
            placeholder="Подтвердите email"
            value={form.emailConfirm}
            onChange={(e) => {
              setForm({ ...form, emailConfirm: e.target.value });
              clearError('emailConfirm');
            }}
            onBlur={() => {
              const emailValue = form.email.trim();
              const emailConfirmValue = form.emailConfirm.trim();
              if (!emailConfirmValue) {
                setErrors(prev => ({ ...prev, emailConfirm: 'Повторите email' }));
              } else if (emailConfirmValue !== emailValue) {
                setErrors(prev => ({ ...prev, emailConfirm: 'Email не совпадает' }));
              }
            }}
            aria-invalid={Boolean(errors.emailConfirm)}
          />
          {errors.emailConfirm && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.emailConfirm}
            </motion.p>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              id="pdf-consent"
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
              <a href="/privacy" className="text-heading font-bold hover:underline">
                Политикой конфиденциальности
              </a>
              ,{' '}
              <a href="/terms" className="text-heading font-bold hover:underline">
                Пользовательским соглашением
              </a>
              ,{' '}
              <a href="/public-offer" className="text-heading font-bold hover:underline">
                Публичной офертой
              </a>{' '}
              и <span className="text-heading font-bold">получением рассылок</span>.
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
            isFormComplete ? '' : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={!isFormComplete}
        >
          Начать тест
        </button>
      </div>
    </Modal>
  );
}

