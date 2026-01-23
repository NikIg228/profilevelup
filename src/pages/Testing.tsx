import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import TestHeader from '../components/test/TestHeader';
import QuestionCard from '../components/test/QuestionCard';
import TestNav from '../components/test/TestNav';
import { getTestConfig } from '../engine/getTestConfig';
import { resolveFreeResult, resolveExtendedResult } from '../engine/resolveResult';
import { useTestStore } from '../stores/useTestStore';
import { useMotionMode } from '../hooks/useMotionMode';
import { logger } from '../utils/logger';
import type { Answers, ExtendedAnswers, Tariff, AgeGroup, FreeTestConfig, ExtendedTestConfig } from '../engine/types';

export default function TestingPage() {
  const navigate = useNavigate();
  const motionConfig = useMotionMode();
  const user = useMemo(() => {
    const raw = sessionStorage.getItem('profi.user');
    if (!raw) return { plan: 'free' as const };
    try {
      return JSON.parse(raw) as { 
        plan: 'free'|'pro'|'extended'|'premium';
        name?: string;
        ageGroup?: AgeGroup;
        gender?: string;
        testType?: string;
        email?: string;
      };
    } catch (error) {
      logger.error('Ошибка парсинга данных пользователя:', error);
      return { plan: 'free' as const };
    }
  }, []);

  // Используем Zustand store с селекторами для оптимизации ререндеров
  const testConfig = useTestStore(state => state.testConfig);
  const step = useTestStore(state => state.step);
  const answers = useTestStore(state => state.answers);
  const isRestoring = useTestStore(state => state.isRestoring);
  
  // Actions не вызывают ререндеры, получаем их отдельно
  const initializeTest = useTestStore(state => state.initializeTest);
  const setTestConfig = useTestStore(state => state.setTestConfig);
  const setStep = useTestStore(state => state.setStep);
  const setAnswer = useTestStore(state => state.setAnswer);

  // Определяем параметры теста
  const tariff: Tariff = useMemo(() => {
    if (user.plan === 'free') return 'FREE';
    if (user.plan === 'extended') return 'EXTENDED';
    if (user.plan === 'premium') return 'PREMIUM';
    return 'FREE';
  }, [user.plan]);

  // Преобразуем возрастную группу в правильный формат (для обратной совместимости)
  const normalizeAgeGroup = (ag: string | undefined): AgeGroup => {
    if (!ag) return '21+';
    // Старый формат (из PersonalDataForm) -> новый формат
    if (ag === '13-17') return '12-17';
    if (ag === '18-24') return '18-20';
    if (ag === '25-34' || ag === '35-45') return '21+';
    // Если уже правильный формат
    if (ag === '12-17' || ag === '18-20' || ag === '21+') return ag as AgeGroup;
    // По умолчанию
    return '21+';
  };
  
  const ageGroup: AgeGroup = normalizeAgeGroup(user.ageGroup);

  // Refs для таймеров и guards
  const initTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // Инициализация теста через Zustand (только если нужно)
  useEffect(() => {
    // Очищаем предыдущий таймер если есть
    if (initTimerRef.current) {
      clearTimeout(initTimerRef.current);
    }

    // Небольшая задержка, чтобы persist middleware успел восстановить состояние
    initTimerRef.current = setTimeout(() => {
      const state = useTestStore.getState();
      
      // Инициализируем только если:
      // 1. Нет активного теста ИЛИ
      // 2. Параметры изменились (тариф или возрастная группа)
      const needsInitialization = 
        !state.testId ||
        state.tariff !== tariff ||
        state.ageGroup !== ageGroup;
      
      if (needsInitialization) {
        initializeTest(tariff, ageGroup, user.email, user.email);
      } else {
        // Если тест уже активен и параметры совпадают - просто снимаем флаг восстановления
        if (state.isRestoring) {
          useTestStore.setState({ isRestoring: false });
        }
      }
    }, 100); // Небольшая задержка для восстановления из localStorage
    
    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
    };
  }, [tariff, ageGroup, user.email, initializeTest]);


  // Загрузка конфигурации теста
  useEffect(() => {
    try {
      const config = getTestConfig(tariff, ageGroup);
      setTestConfig(config);
    } catch (error) {
      logger.error('Ошибка загрузки теста:', error);
      // Показываем ошибку пользователю через navigate на главную с сообщением
      // В будущем можно добавить toast notification
      navigate('/', { 
        state: { 
          error: 'Не удалось загрузить тест. Пожалуйста, попробуйте еще раз.' 
        } 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // setTestConfig из Zustand - стабильная функция, не требует включения в зависимости
  }, [tariff, ageGroup, navigate]);

  const total = testConfig?.questions?.length ?? 0;
  const currentQuestion = testConfig?.questions?.[step - 1];
  const isTestComplete = step > total && total > 0;
  
  // Состояние для превью результата
  const [resultPreview, setResultPreview] = useState<string | null>(null);

  // Вычисление результата и отображение превью
  // ВАЖНО: Этот useEffect должен быть ПЕРЕД условными return
  useEffect(() => {
    // Guard: предотвращаем повторное вычисление и навигацию
    if (!isTestComplete || !testConfig || !answers || hasNavigatedRef.current) {
      return;
    }

    // Очищаем предыдущий таймер навигации если есть
    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
    }

    try {
      // Определяем тип теста
      const isExtendedTest = 'EI' in testConfig.resultMapping;
      
      if (isExtendedTest) {
        // EXTENDED/PREMIUM тест
        const extendedConfig = testConfig as ExtendedTestConfig;
        const result = resolveExtendedResult(answers as ExtendedAnswers, extendedConfig);
        setResultPreview(result);
        
        // Переходим на страницу результатов VIP через 2 секунды (чтобы показать превью)
        hasNavigatedRef.current = true;
        navigateTimerRef.current = setTimeout(() => {
          navigate('/result/vip');
        }, 2000);
      } else if (tariff === 'FREE') {
        // FREE тест
        const freeConfig = testConfig as FreeTestConfig;
        const result = resolveFreeResult(answers as Answers, freeConfig);
        setResultPreview(result);
        
        // Переходим на страницу результатов FREE через 2 секунды (чтобы показать превью)
        hasNavigatedRef.current = true;
        navigateTimerRef.current = setTimeout(() => {
          navigate('/result/free');
        }, 2000);
      }
    } catch (error) {
      logger.error('Ошибка вычисления результата:', error);
    }

    return () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
        navigateTimerRef.current = null;
      }
    };
  }, [isTestComplete, testConfig, answers, tariff, navigate]);

  const onSelect = useCallback((value: string) => {
    if (!currentQuestion || !testConfig) return;
    
    // Определяем тип теста для правильной обработки ответов
    const isExtendedTest = 'EI' in testConfig.resultMapping;
    
    if (isExtendedTest) {
      // EXTENDED/PREMIUM тест - сохраняем A или B
      setAnswer(currentQuestion.id, value as 'A' | 'B');
    } else {
      // FREE тест - сохраняем букву ответа
      const questionId = currentQuestion.id as keyof Answers;
      setAnswer(questionId as number, value as Answers[typeof questionId]);
    }
  }, [currentQuestion, testConfig, setAnswer]);


  // Преобразуем вопросы из TestConfig в формат для QuestionCard
  const questionCardOptions = useMemo(() => {
    return currentQuestion?.options.map(opt => ({
      value: opt.value,
      label: opt.label,
    })) || [];
  }, [currentQuestion]);

  // Определяем, выбран ли ответ на текущий вопрос
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion || !testConfig) return false;
    const isExtendedTest = 'EI' in testConfig.resultMapping;
    if (isExtendedTest) {
      return !!(answers as ExtendedAnswers)[currentQuestion.id];
    } else {
      return !!(answers as Answers)[currentQuestion.id as keyof Answers];
    }
  }, [currentQuestion, testConfig, answers]);

  // Обработчики навигации - используем useCallback вместо useMemo для функций
  const handleNext = useCallback(() => {
    if (step < total) {
      setStep(step + 1);
    } else if (step === total) {
      setStep(step + 1);
    }
  }, [step, total, setStep]);

  const handleBack = useCallback(() => {
    setStep(Math.max(1, step - 1));
  }, [step, setStep]);

  if (isRestoring) {
    return (
      <section className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted">Восстановление прогресса...</span>
        </div>
      </section>
    );
  }

  if (!testConfig) {
    return (
      <section className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="card p-6">
          <p className="text-muted">Не удалось загрузить тест. Пожалуйста, обновите страницу.</p>
        </div>
      </section>
    );
  }

  // Если тест завершен, показываем превью результата перед переходом на результаты
  if (isTestComplete) {
    return (
      <section className="fixed inset-0 flex items-center justify-center overflow-hidden">
        {/* Полупрозрачный фон с логотипом */}
        <div 
          className="fixed inset-0 -z-10 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'url(/logomain.png)',
            backgroundSize: '30%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        <div className="relative z-10 w-full max-w-2xl px-4">
          <div className="card p-8 text-center">
            {resultPreview ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-primary mb-4" strokeWidth={1.5} />
                <h2 className="text-3xl font-bold mb-4">Тест завершен!</h2>
                <p className="text-sm text-muted mb-6">Ваш тип личности</p>
                <div className={`text-7xl font-bold text-primary mb-6 ${motionConfig.mode !== 'reduced' ? 'animate-pulse' : ''}`}>
                  {resultPreview}
                </div>
                <p className="text-muted text-sm mb-4">
                  Переход на страницу с подробными результатами...
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Тест завершен!</h2>
                <p className="text-muted">Вычисление результата...</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="fixed inset-0 flex flex-col overflow-hidden bg-base">
      {/* Полупрозрачный фон с логотипом */}
      <div 
        className="fixed inset-0 -z-10 opacity-10 pointer-events-none test-bg-logo"
        style={{
          backgroundImage: 'url(/logomain.png)',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Mobile-first layout с безопасными отступами */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Фиксированный контейнер для заголовка и прогресс-бара (скрыт на мобильных) */}
        <div className="hidden md:flex flex-shrink-0 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <TestHeader current={step} total={total} />
        </div>
        
        {/* Контейнер для вопроса с независимой шириной и адаптацией под мобилки */}
        <div 
          className="flex-1 flex flex-col justify-center overflow-hidden container-balanced py-4 min-h-0"
          style={{
            // Добавляем padding-bottom на мобильных, чтобы sticky кнопка не перекрывала контент
            // На desktop этот padding не влияет, так как контент центрируется
            paddingBottom: 'max(120px, calc(120px + env(safe-area-inset-bottom, 0px)))',
          }}
        >
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <QuestionCard
                key={currentQuestion.id}
                questionId={currentQuestion.id}
                question={currentQuestion.text}
                options={questionCardOptions}
                selectedValue={
                  testConfig && 'EI' in testConfig.resultMapping
                    ? (answers as ExtendedAnswers)[currentQuestion.id]
                    : (answers as Answers)[currentQuestion.id as keyof Answers]
                }
                onChange={onSelect}
                current={step}
                total={total}
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Контейнер для кнопок навигации (desktop layout внутри TestNav) */}
        <div className="hidden md:flex flex-shrink-0 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <TestNav
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={isCurrentQuestionAnswered}
            canGoBack={step > 1}
            isLastQuestion={step === total}
          />
        </div>

        {/* Mobile: sticky кнопка (рендерится в TestNav) */}
        <div className="md:hidden">
          <TestNav
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={isCurrentQuestionAnswered}
            canGoBack={step > 1}
            isLastQuestion={step === total}
          />
        </div>
      </div>
    </section>
  );
}

