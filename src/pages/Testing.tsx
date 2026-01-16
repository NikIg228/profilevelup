import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import TestSyncStatus from '../components/TestSyncStatus';
import { getTestConfig } from '../engine/getTestConfig';
import { resolveResult } from '../engine/resolveResult';
import { sendResultToBackend } from '../utils/sendResult';
import { useTestStore } from '../stores/useTestStore';
import type { Answers, ExtendedAnswers, ResultIndex, Tariff, AgeGroup, Gender } from '../engine/types';

export default function TestingPage() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    const raw = sessionStorage.getItem('profi.user');
    return raw ? JSON.parse(raw) as { 
      plan: 'free'|'pro'|'extended'|'premium';
      name?: string;
      ageGroup?: AgeGroup;
      gender?: string;
      testType?: string;
      email?: string;
    } : { plan: 'free' as const };
  }, []);

  // Используем Zustand store
  const {
    testConfig,
    step,
    answers,
    done,
    resultIndex,
    isRestoring,
    initializeTest,
    setTestConfig,
    setStep,
    setAnswer,
    setResultIndex,
    setDone,
    completeTest,
  } = useTestStore();

  // Определяем параметры теста
  const tariff: Tariff = useMemo(() => {
    if (user.plan === 'free') return 'FREE';
    if (user.plan === 'extended') return 'EXTENDED';
    if (user.plan === 'premium') return 'PREMIUM';
    return 'FREE';
  }, [user.plan]);

  const ageGroup: AgeGroup = user.ageGroup || '18-24';

  // Инициализация теста через Zustand (только если нужно)
  useEffect(() => {
    // Небольшая задержка, чтобы persist middleware успел восстановить состояние
    const timer = setTimeout(() => {
      const state = useTestStore.getState();
      
      // Инициализируем только если:
      // 1. Нет активного теста ИЛИ
      // 2. Тест завершен ИЛИ
      // 3. Параметры изменились (тариф или возрастная группа)
      const needsInitialization = 
        !state.testId ||
        state.done ||
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

  const total = testConfig?.questions.length ?? 0;
  const currentQuestion = testConfig?.questions[step - 1];

  // Проверка, что все вопросы отвечены (config-driven)
  const allAnswered = useMemo(() => {
    if (!testConfig) return false;
    const isExtendedTest = 'EI' in testConfig.resultMapping;
    return testConfig.questions.every(q => {
      if (isExtendedTest) {
        return (answers as ExtendedAnswers)[q.id] !== undefined;
      } else {
        return (answers as Answers)[q.id as keyof Answers] !== undefined;
      }
    });
  }, [answers, testConfig]);

  useEffect(() => {
    if (step > total && total > 0) {
      setDone(true);
    }
  }, [step, total, setDone]);

  // Вычисляем результат только когда тест завершён, конфиг загружен и все вопросы отвечены
  useEffect(() => {
    if (done && testConfig && allAnswered && !resultIndex) {
      try {
        const result = resolveResult(answers, testConfig);
        setResultIndex(result);

        // Завершаем тест на сервере через Zustand
        completeTest(result).then((success) => {
          if (success) {
            // Отправляем результат на бэкенд
            sendResultToBackend(result, user.email, user.gender as Gender).catch((error) => {
              console.error('Ошибка отправки результата на бэкенд:', error);
            });
          }
        });
      } catch (error) {
        console.error('Ошибка вычисления результата:', error);
      }
    }
  }, [done, answers, testConfig, allAnswered, resultIndex, setResultIndex, completeTest, user.email, user.gender]);

  // Перенаправление на страницу результата после завершения теста
  useEffect(() => {
    const storeTariff = useTestStore.getState().tariff;
    if (done && resultIndex && storeTariff) {
      // Небольшая задержка для завершения анимаций
      const timer = setTimeout(() => {
        if (storeTariff === 'FREE') {
          navigate('/result/free');
        } else if (storeTariff === 'EXTENDED') {
          navigate('/result/extended');
        } else if (storeTariff === 'PREMIUM') {
          navigate('/result/premium');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [done, resultIndex, navigate]);

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
      <section className="container-balanced mt-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted">Восстановление прогресса...</span>
        </div>
      </section>
    );
  }

  if (!testConfig) {
    return (
      <section className="container-balanced mt-10">
        <div className="card p-6">
          <p className="text-muted">Не удалось загрузить тест. Пожалуйста, обновите страницу.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-balanced mt-10 relative min-h-screen">
      <TestSyncStatus />
      
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
      
      <div className="relative z-10">
        <h1 className="text-2xl font-semibold">Пройди тест и узнай, какая профессия тебе подходит</h1>
        <div className="mt-6">
          <ProgressBar current={step} total={total} />
        </div>
        {currentQuestion && (
          <div className="mt-6">
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
        <div className="mt-6 flex justify-center">
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
              onClick={() => setStep(step + 1)}
              disabled={
                !currentQuestion || 
                (testConfig && 'block1' in testConfig.resultMapping
                  ? !(answers as ExtendedAnswers)[currentQuestion.id]
                  : !(answers as Answers)[currentQuestion.id as keyof Answers])
              }
            >
              Далее
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
