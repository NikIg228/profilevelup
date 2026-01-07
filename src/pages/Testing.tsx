import { useEffect, useMemo, useState } from 'react';
import { Loader2, CheckCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import { getTestConfig } from '../engine/getTestConfig';
import { resolveResult } from '../engine/resolveResult';
import { sendResultToBackend } from '../utils/sendResult';
import type { TestConfig, Answers, ResultIndex, Tariff, AgeGroup, Gender } from '../engine/types';

export default function TestingPage() {
  const user = useMemo(() => {
    const raw = sessionStorage.getItem('profi.user');
    return raw ? JSON.parse(raw) as { 
      plan: 'free'|'pro';
      name?: string;
      age?: string;
      gender?: string;
      testType?: string;
      email?: string;
    } : { plan: 'free' as const };
  }, []);

  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({} as Answers);
  const [done, setDone] = useState(false);
  const [resultIndex, setResultIndex] = useState<ResultIndex | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [resultSent, setResultSent] = useState(false);

  // Загружаем конфигурацию теста при монтировании (синхронно)
  useEffect(() => {
    try {
      setLoading(true);
      
      // Определяем параметры теста из user данных
      const tariff: Tariff = user.plan === 'free' ? 'FREE' : 'FREE'; // Пока только FREE
      const age: AgeGroup = (user.age as AgeGroup) || '18-24'; // Дефолтное значение

      const config = getTestConfig(tariff, age);
      setTestConfig(config);
    } catch (error) {
      console.error('Ошибка загрузки теста:', error);
      alert('Не удалось загрузить тест. Пожалуйста, обновите страницу.');
    } finally {
      setLoading(false);
    }
  }, [user.age, user.plan]);

  const total = testConfig?.questions.length ?? 0;
  const currentQuestion = testConfig?.questions[step - 1];

  // Проверка, что все вопросы отвечены (config-driven)
  const allAnswered = useMemo(() => {
    if (!testConfig) return false;
    return testConfig.questions.every(q => answers[q.id as keyof Answers]);
  }, [answers, testConfig]);

  useEffect(() => {
    if (step > total && total > 0) {
      setDone(true);
    }
  }, [step, total]);

  // Вычисляем результат только когда тест завершён, конфиг загружен и все вопросы отвечены
  useEffect(() => {
    if (done && testConfig && allAnswered && !resultIndex) {
      try {
        const result = resolveResult(answers, testConfig);
        setResultIndex(result);
        console.log('Результат теста:', result);
      } catch (error) {
        console.error('Ошибка вычисления результата:', error);
      }
    }
  }, [done, answers, testConfig, allAnswered, resultIndex]);

  const onSelect = (value: string) => {
    if (!currentQuestion) return;
    
    // Сохраняем букву ответа
    const questionId = currentQuestion.id as keyof Answers;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value as Answers[typeof questionId],
    }));
  };

  const handleSendResult = async () => {
    if (!resultIndex) return;
    
    setIsSending(true);
    try {
      const gender = (user.gender as Gender) || undefined;
      await sendResultToBackend(resultIndex, user.email, gender);
      setResultSent(true);
    } catch (error) {
      console.error('Ошибка отправки результата на бэкенд:', error);
      alert('Произошла ошибка при отправке результата. Попробуйте ещё раз.');
    } finally {
      setIsSending(false);
    }
  };

  // Преобразуем вопросы из TestConfig в формат для QuestionCard
  const questionCardOptions = currentQuestion?.options.map(opt => ({
    value: opt.value,
    label: opt.label,
  })) || [];

  if (loading) {
    return (
      <section className="container-balanced mt-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted">Загрузка теста...</span>
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

  if (done && resultIndex) {
    return (
      <section className="container-balanced mt-10 relative min-h-[calc(100vh-5rem)]">
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
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-6 relative z-10"
        >
          {/* Заголовок с иконкой успеха */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
            >
              <CheckCircle className="w-6 h-6 text-primary-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-semibold">Результат</h1>
              <p className="text-sm text-muted">Тест завершён</p>
            </div>
          </div>

          {/* Улучшенная карточка результата */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-4 p-5 bg-gradient-to-br from-primary-50 to-white rounded-xl border-2 border-primary-200"
          >
            <p className="text-sm text-muted mb-1">Ваш тип личности</p>
            <p className="text-2xl font-bold text-primary mb-2">{resultIndex}</p>
            <p className="text-sm text-muted mt-2">Результат отправлен на сервер для обработки</p>
          </motion.div>

          {/* Кнопка отправки результата на бэкенд */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="mt-6"
          >
            {resultSent ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                <span>Результат отправлен на сервер</span>
              </div>
            ) : (
              <button
                onClick={handleSendResult}
                disabled={isSending || !resultIndex}
                className="btn btn-primary w-full sm:w-auto px-5 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Отправка результата...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Отправить результат на сервер
                  </>
                )}
              </button>
            )}
          </motion.div>

          {user.plan === 'free' ? (
            <div className="mt-6 grid gap-3">
              <p className="text-muted">Это краткий результат на основе упрощённого теста.</p>
              <p className="text-muted">Хотите получить полный отчёт с персональными рекомендациями?</p>
              <a href="/" className="btn btn-ghost w-fit px-5 py-3">Перейти к расширенной версии</a>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              <p className="text-muted">Полный отчёт с детальными рекомендациями будет сгенерирован на сервере.</p>
              {user.email && (
                <p className="text-sm text-muted">Мы отправим вам полный отчёт на email: <span className="font-medium">{user.email}</span></p>
              )}
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="container-balanced mt-10 relative min-h-[calc(100vh-5rem)]">
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
              value={answers[currentQuestion.id as keyof Answers]}
              onChange={onSelect}
            />
          </div>
        )}
        <div className="mt-6 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
            <button
              className="px-4 py-2 w-full text-sm bg-transparent border-2 border-primary text-primary rounded-lg font-semibold transition hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >Назад</button>
            <button
              className="btn btn-primary px-4 py-2 w-full text-sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={!currentQuestion || !answers[currentQuestion.id as keyof Answers]}
            >Далее</button>
          </div>
        </div>
      </div>
    </section>
  );
}
