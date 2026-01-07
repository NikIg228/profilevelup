import { useEffect, useMemo, useState } from 'react';
import { Loader2, CheckCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import { getTestConfig } from '../engine/getTestConfig';
import { resolveResult } from '../engine/resolveResult';
import { sendResultToBackend } from '../utils/sendResult';
import { startTestRecording, recordAnswer, finishTestRecording } from '../utils/testRecorder';
import type { TestConfig, Answers, ExtendedAnswers, ResultIndex, Tariff, AgeGroup, Gender, FreeTestConfig, ExtendedTestConfig } from '../engine/types';

export default function TestingPage() {
  const user = useMemo(() => {
    const raw = sessionStorage.getItem('profi.user');
    return raw ? JSON.parse(raw) as { 
      plan: 'free'|'pro'|'extended'|'premium';
      name?: string;
      ageGroup?: AgeGroup; // Используем ageGroup вместо age
      gender?: string;
      testType?: string;
      email?: string;
    } : { plan: 'free' as const };
  }, []);

  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers | ExtendedAnswers>({} as Answers | ExtendedAnswers);
  const [done, setDone] = useState(false);
  const [resultIndex, setResultIndex] = useState<ResultIndex | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [resultSent, setResultSent] = useState(false);

  // Загружаем конфигурацию теста при монтировании (синхронно)
  useEffect(() => {
    try {
      setLoading(true);
      
      // Определяем параметры теста из user данных
      let tariff: Tariff;
      if (user.plan === 'free') {
        tariff = 'FREE';
      } else if (user.plan === 'extended') {
        tariff = 'EXTENDED';
      } else if (user.plan === 'premium') {
        tariff = 'PREMIUM';
      } else {
        tariff = 'FREE'; // По умолчанию FREE
      }
      
      const ageGroup: AgeGroup = user.ageGroup || '18-24'; // Дефолтное значение

      const config = getTestConfig(tariff, ageGroup);
      setTestConfig(config);

      // ⚠️ ВРЕМЕННОЕ РЕШЕНИЕ: Начинаем запись теста для всех типов тестов
      if (user.testType) {
        startTestRecording(tariff, ageGroup, user.testType);
        console.log('Начата запись теста в localStorage');
      }
    } catch (error) {
      console.error('Ошибка загрузки теста:', error);
      alert('Не удалось загрузить тест. Пожалуйста, обновите страницу.');
    } finally {
      setLoading(false);
    }
  }, [user.ageGroup, user.plan, user.testType]);

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
  }, [step, total]);

  // Вычисляем результат только когда тест завершён, конфиг загружен и все вопросы отвечены
  // ⚠️ ВАЖНО: resultIndex используется для отладки, передачи на бэкенд и генерации отчётов.
  // В продакшене НЕ должен отображаться пользователю напрямую как финальный результат.
  useEffect(() => {
    if (done && testConfig && allAnswered && !resultIndex) {
      try {
        const result = resolveResult(answers, testConfig);
        setResultIndex(result);
        console.log('Результат теста:', result);

        // ⚠️ ВРЕМЕННОЕ РЕШЕНИЕ: Завершаем запись теста для всех типов тестов
        if (user.testType) {
          finishTestRecording(result);
          console.log('Запись теста завершена и сохранена в localStorage');
        }
      } catch (error) {
        console.error('Ошибка вычисления результата:', error);
      }
    }
  }, [done, answers, testConfig, allAnswered, resultIndex, user.testType]);

  const onSelect = (value: string) => {
    if (!currentQuestion || !testConfig) return;
    
    // Определяем тип теста для правильной обработки ответов
    const isExtendedTest = 'EI' in testConfig.resultMapping;
    
    if (isExtendedTest) {
      // EXTENDED/PREMIUM тест - сохраняем A или B
      setAnswers((prev) => {
        const extendedAnswers = prev as ExtendedAnswers;
        return {
          ...extendedAnswers,
          [currentQuestion.id]: value as 'A' | 'B',
        } as ExtendedAnswers;
      });
    } else {
      // FREE тест - сохраняем букву ответа
      const questionId = currentQuestion.id as keyof Answers;
      setAnswers((prev) => {
        const freeAnswers = prev as Answers;
        return {
          ...freeAnswers,
          [questionId]: value as Answers[typeof questionId],
        } as Answers;
      });
    }

    // ⚠️ ВРЕМЕННОЕ РЕШЕНИЕ: Записываем ответ в localStorage для всех типов тестов
    if (user.testType) {
      // Для EXTENDED/PREMIUM тестов преобразуем A/B в конкретные буквы для удобства просмотра
      let answerToRecord = value;
      if (isExtendedTest && testConfig && 'EI' in testConfig.resultMapping) {
        // Находим, к какой дихотомии относится вопрос
        const questionId = currentQuestion.id;
        const mapping = testConfig.resultMapping;
        
        if (mapping.EI.questions.includes(questionId)) {
          // E/I дихотомия: A -> E, B -> I
          answerToRecord = value === 'A' ? 'E' : 'I';
        } else if (mapping.SN.questions.includes(questionId)) {
          // S/N дихотомия: A -> S, B -> N
          answerToRecord = value === 'A' ? 'S' : 'N';
        } else if (mapping.TF.questions.includes(questionId)) {
          // T/F дихотомия: A -> T, B -> F
          answerToRecord = value === 'A' ? 'T' : 'F';
        } else if (mapping.JP.questions.includes(questionId)) {
          // J/P дихотомия: A -> J, B -> P
          answerToRecord = value === 'A' ? 'J' : 'P';
        }
      }
      recordAnswer(currentQuestion.id, answerToRecord);
    }
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
      <section className="container-balanced mt-10 relative min-h-screen">
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
            {/* ⚠️ ВРЕМЕННО: resultIndex отображается для тестирования. В продакшене должен быть заменен на пользовательский формат результата */}
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
    <section className="container-balanced mt-10 relative min-h-screen">
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
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >Назад</button>
            <button
              className="btn btn-primary px-4 py-2 w-full text-sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={
                !currentQuestion || 
                (testConfig && 'block1' in testConfig.resultMapping
                  ? !(answers as ExtendedAnswers)[currentQuestion.id]
                  : !(answers as Answers)[currentQuestion.id as keyof Answers])
              }
            >Далее</button>
          </div>
        </div>
      </div>
    </section>
  );
}
