import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import { getTestConfig } from '../engine/getTestConfig';
import { resolveFreeResult, resolveExtendedResult } from '../engine/resolveResult';
import { useTestStore } from '../stores/useTestStore';
import { logger } from '../utils/logger';
import type { Answers, ExtendedAnswers, Tariff, AgeGroup, FreeTestConfig, ExtendedTestConfig } from '../engine/types';

export default function TestingPage() {
  const navigate = useNavigate();
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

  // Используем Zustand store
  const {
    testConfig,
    step,
    answers,
    isRestoring,
    initializeTest,
    setTestConfig,
    setStep,
    setAnswer,
  } = useTestStore();

  // Определяем параметры теста
  const tariff: Tariff = useMemo(() => {
    if (user.plan === 'free') return 'FREE';
    if (user.plan === 'extended') return 'EXTENDED';
    if (user.plan === 'premium') return 'PREMIUM';
    return 'FREE';
  }, [user.plan]);

  const ageGroup: AgeGroup = user.ageGroup || '21+';

  // Инициализация теста через Zustand (только если нужно)
  useEffect(() => {
    // Небольшая задержка, чтобы persist middleware успел восстановить состояние
    const timer = setTimeout(() => {
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
    
    return () => clearTimeout(timer);
  }, [tariff, ageGroup, user.email, initializeTest]);


  // Загрузка конфигурации теста
  useEffect(() => {
    try {
      const config = getTestConfig(tariff, ageGroup);
      setTestConfig(config);
    } catch (error) {
      console.error('Ошибка загрузки теста:', error);
      alert('Не удалось загрузить тест. Пожалуйста, обновите страницу.');
    }
  }, [tariff, ageGroup, setTestConfig]);

  const total = testConfig?.questions?.length ?? 0;
  const currentQuestion = testConfig?.questions?.[step - 1];
  const isTestComplete = step > total && total > 0;
  
  // Состояние для превью результата
  const [resultPreview, setResultPreview] = useState<string | null>(null);

  // Вычисление результата и отображение превью
  // ВАЖНО: Этот useEffect должен быть ПЕРЕД условными return
  useEffect(() => {
    if (isTestComplete && testConfig && answers) {
      try {
        // Определяем тип теста
        const isExtendedTest = 'EI' in testConfig.resultMapping;
        
        if (isExtendedTest) {
          // EXTENDED/PREMIUM тест
          const extendedConfig = testConfig as ExtendedTestConfig;
          const result = resolveExtendedResult(answers as ExtendedAnswers, extendedConfig);
          setResultPreview(result);
          
          // Переходим на страницу результатов VIP через 2 секунды (чтобы показать превью)
          setTimeout(() => {
            navigate('/result/vip');
          }, 2000);
        } else if (tariff === 'FREE') {
          // FREE тест
          const freeConfig = testConfig as FreeTestConfig;
          const result = resolveFreeResult(answers as Answers, freeConfig);
          setResultPreview(result);
          
          // Переходим на страницу результатов FREE через 2 секунды (чтобы показать превью)
          setTimeout(() => {
            navigate('/result/free');
          }, 2000);
        }
      } catch (error) {
        logger.error('Ошибка вычисления результата:', error);
      }
    }
  }, [isTestComplete, testConfig, answers, tariff, navigate]);

  const onSelect = (value: string) => {
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
  };


  // Преобразуем вопросы из TestConfig в формат для QuestionCard
  const questionCardOptions = currentQuestion?.options.map(opt => ({
    value: opt.value,
    label: opt.label,
  })) || [];

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
                <div className="text-7xl font-bold text-primary mb-6 animate-pulse">
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
    <section className="fixed inset-0 flex flex-col overflow-hidden">
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
      
      <div className="flex-1 flex flex-col container-balanced py-6 overflow-hidden">
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-2xl font-semibold">Пройди тест и узнай, какая профессия тебе подходит</h1>
        </div>
        <div className="flex-shrink-0 mb-6">
          <ProgressBar current={step} total={total} />

        </div>
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          {currentQuestion && (
            <div className="mb-6">
              <QuestionCard
                question={currentQuestion.text}
                options={questionCardOptions}
                value={
                  testConfig && 'EI' in testConfig.resultMapping
                    ? (answers as ExtendedAnswers)[currentQuestion.id]
                    : (answers as Answers)[currentQuestion.id as keyof Answers]
                }
                onChange={onSelect}
              />
            </div>
          )}
        </div>
        <div className="flex-shrink-0 mt-6 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
            <button
              className="px-4 py-2 w-full text-sm bg-transparent border-2 border-primary text-primary rounded-lg font-semibold transition hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Назад
            </button>
            <button
              className="btn btn-primary px-4 py-2 w-full text-sm"
              onClick={() => {
                if (step < total) {
                  setStep(step + 1);
                } else if (step === total) {
                  // Переходим к экрану завершения
                  setStep(step + 1);
                }
              }}
              disabled={
                !currentQuestion || 
                (testConfig && 'EI' in testConfig.resultMapping
                  ? !(answers as ExtendedAnswers)[currentQuestion.id]
                  : !(answers as Answers)[currentQuestion.id as keyof Answers])
              }
            >
              {step < total ? 'Далее' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

