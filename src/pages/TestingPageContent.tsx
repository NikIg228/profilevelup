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
import { useTestSaveOnUnload } from '../hooks/useTestSaveOnUnload';
import { useTestExitConfirmation } from '../hooks/useTestExitConfirmation';
import ExitConfirmDialog from '../components/test/ExitConfirmDialog';
import { logger } from '../utils/logger';
import type { Answers, ExtendedAnswers, Tariff, AgeGroup, FreeTestConfig, ExtendedTestConfig } from '../engine/types';

interface TestingPageContentProps {
  tariff: Tariff;
}

export default function TestingPageContent({ tariff }: TestingPageContentProps) {
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
  const isCompleted = useTestStore(state => state.isCompleted);
  const testId = useTestStore(state => state.testId);
  const storeTariff = useTestStore(state => state.tariff);
  
  // Actions не вызывают ререндеры, получаем их отдельно
  const initializeTest = useTestStore(state => state.initializeTest);
  const setTestConfig = useTestStore(state => state.setTestConfig);
  const setStep = useTestStore(state => state.setStep);
  const setAnswer = useTestStore(state => state.setAnswer);
  const markTestCompleted = useTestStore(state => state.markTestCompleted);
  const resetTestForce = useTestStore(state => state.resetTestForce);
  
  // Немедленное сохранение при закрытии страницы
  useTestSaveOnUnload();
  
  // Подтверждение выхода при навигации внутри приложения
  useTestExitConfirmation();

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
  const configRetryCountRef = useRef(0);
  const configErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** true, если завершение произошло в этой сессии (последний вопрос → результат). Иначе редирект не делаем (восстановленный из localStorage завершённый тест = перепройти). */
  const completedInThisSessionRef = useRef(false);

  const [retryTrigger, setRetryTrigger] = useState(0);
  /** Показывать ошибку загрузки конфига только после grace period (избегаем мигания при гонке с инициализацией). */
  const [showConfigError, setShowConfigError] = useState(false);

  // ⚠️ КРИТИЧНО: При монтировании проверяем, что тариф из URL совпадает с тарифом в store
  // Если не совпадает - полностью очищаем состояние и инициализируем новый тест
  useEffect(() => {
    // Очищаем предыдущий таймер если есть
    if (initTimerRef.current) {
      clearTimeout(initTimerRef.current);
    }

    const runInit = () => {
      const state = useTestStore.getState();
      
      // ⚠️ КРИТИЧНО: Если тариф в store не совпадает с тарифом из URL - полностью очищаем
      if (state.tariff && state.tariff !== tariff) {
        logger.debug(`Обнаружено несоответствие тарифа: store=${state.tariff}, URL=${tariff}. Очищаем состояние.`);
        resetTestForce();
        setTimeout(() => {
          initializeTest(tariff, ageGroup, user.email, user.email).catch((error) => {
            logger.error('Ошибка инициализации теста:', error);
          });
        }, 100);
        return;
      }
      
      const needsInitialization = 
        !state.testId ||
        state.isCompleted ||
        state.tariff !== tariff ||
        state.ageGroup !== ageGroup;
      
      if (needsInitialization) {
        initializeTest(tariff, ageGroup, user.email, user.email).catch((error) => {
          logger.error('Ошибка инициализации теста:', error);
        });
      } else {
        if (state.isRestoring) {
          useTestStore.setState({ isRestoring: false });
        }
      }
    };

    // Если уже восстановлен завершённый тест (перепройти) — инициализируем сразу, без задержки
    const state = useTestStore.getState();
    if (state.isCompleted && state.tariff === tariff) {
      runInit();
      return;
    }
    // Иначе даём persist время восстановить состояние
    initTimerRef.current = setTimeout(runInit, 100);
    
    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
    };
  }, [tariff, ageGroup, user.email, initializeTest, resetTestForce]);

  // Загрузка конфигурации теста (с повторными попытками)
  const MAX_CONFIG_RETRIES = 3;
  useEffect(() => {
    if (!tariff || !ageGroup) {
      logger.warn('Tariff или ageGroup не определены, пропускаем загрузку конфигурации');
      return;
    }
    
    const state = useTestStore.getState();
    if (state.tariff && state.tariff !== tariff) {
      logger.debug(`Тариф в store (${state.tariff}) не совпадает с тарифом из URL (${tariff}). Ждем инициализации.`);
      return;
    }
    // Если тариф в store ещё не установлен (persist не успел восстановиться) — не ждём бесконечно:
    // через 500 мс загружаем конфиг по тарифу из URL (fallback).
    if (!state.tariff) {
      const fallbackId = setTimeout(() => {
        const current = useTestStore.getState();
        if (current.testConfig && current.tariff === tariff) return;
        if (current.tariff && current.tariff !== tariff) return;
        try {
          const config = getTestConfig(tariff, ageGroup);
          setTestConfig(config);
          configRetryCountRef.current = 0;
        } catch (e) {
          logger.error('Ошибка загрузки конфигурации (fallback):', e);
        }
      }, 500);
      return () => clearTimeout(fallbackId);
    }
    // Конфиг загружаем сразу при совпадении тарифа — не ждём окончания createTestSession (isRestoring),
    // иначе при медленной сети ошибка «Не удалось загрузить тест» показывается до появления конфига.
    
    const needsConfigReload = 
      !state.testConfig || 
      state.tariff !== tariff ||
      (state.ageGroup && state.ageGroup !== ageGroup);
    
    if (!needsConfigReload && state.testConfig) {
      configRetryCountRef.current = 0;
      return;
    }
    
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const config = getTestConfig(tariff, ageGroup);
      setTestConfig(config);
      configRetryCountRef.current = 0;
    } catch (error) {
      logger.error('Ошибка загрузки теста:', error);
      const currentState = useTestStore.getState();
      if (currentState.isRestoring || !currentState.tariff) {
        logger.warn('Ошибка загрузки конфигурации во время инициализации, будет повторная попытка');
      } else if (configRetryCountRef.current < MAX_CONFIG_RETRIES - 1) {
        configRetryCountRef.current += 1;
        retryTimeoutId = setTimeout(() => setRetryTrigger(r => r + 1), 400);
      }
    }
    return () => {
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [tariff, ageGroup, storeTariff, isRestoring, retryTrigger, setTestConfig]);

  // Страховка: загрузка конфига по тарифу из URL через 400 и 800 мс, независимо от store
  // Устраняет повторяющуюся ошибку «Не удалось загрузить тест» при гонках с persist/инициализацией
  useEffect(() => {
    if (!tariff || !ageGroup) return;
    const delays = [400, 800];
    const ids: ReturnType<typeof setTimeout>[] = [];
    delays.forEach((ms) => {
      ids.push(
        setTimeout(() => {
          try {
            const config = getTestConfig(tariff, ageGroup);
            setTestConfig(config);
            configRetryCountRef.current = 0;
          } catch (e) {
            logger.error('Ошибка загрузки конфигурации (страховка):', e);
          }
        }, ms)
      );
    });
    return () => ids.forEach((id) => clearTimeout(id));
  }, [tariff, ageGroup, setTestConfig]);

  // Grace period перед показом ошибки загрузки конфига (после страховки 400/800 мс)
  const CONFIG_ERROR_GRACE_MS = 3500;
  useEffect(() => {
    if (testConfig) {
      setShowConfigError(false);
      if (configErrorTimeoutRef.current) {
        clearTimeout(configErrorTimeoutRef.current);
        configErrorTimeoutRef.current = null;
      }
      return;
    }
    // Запускаем таймер, если конфига нет и тариф из URL совпадает с store (или store ещё пустой — fallback по URL)
    const canShowError = !isRestoring && (storeTariff === tariff || storeTariff === null) && !!tariff;
    if (!canShowError) {
      return;
    }
    configErrorTimeoutRef.current = setTimeout(() => {
      configErrorTimeoutRef.current = null;
      setShowConfigError(true);
    }, CONFIG_ERROR_GRACE_MS);
    return () => {
      if (configErrorTimeoutRef.current) {
        clearTimeout(configErrorTimeoutRef.current);
        configErrorTimeoutRef.current = null;
      }
    };
  }, [testConfig, storeTariff, tariff, isRestoring]);

  const total = testConfig?.questions?.length ?? 0;
  const currentQuestion = testConfig?.questions?.[step - 1];
  const isTestComplete = step > total && total > 0;
  
  // Состояние для превью результата
  const [resultPreview, setResultPreview] = useState<string | null>(null);

  // Вычисление результата и отображение превью
  useEffect(() => {
    if (!isTestComplete || !testConfig || !answers || hasNavigatedRef.current) {
      return;
    }
    // Не редиректить, если тест был завершён до этой сессии (восстановлен из localStorage) — пользователь зашёл перепройти
    if (isCompleted && !completedInThisSessionRef.current) {
      return;
    }

    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
    }

    completedInThisSessionRef.current = true;

    try {
      const isExtendedTest = 'EI' in testConfig.resultMapping;
      
      if (isExtendedTest) {
        const extendedConfig = testConfig as ExtendedTestConfig;
        const result = resolveExtendedResult(answers as ExtendedAnswers, extendedConfig);
        setResultPreview(result);
        
        markTestCompleted();
        
        hasNavigatedRef.current = true;
        navigateTimerRef.current = setTimeout(() => {
          navigate('/result/vip');
        }, 2000);
      } else if (tariff === 'FREE') {
        const freeConfig = testConfig as FreeTestConfig;
        const result = resolveFreeResult(answers as Answers, freeConfig);
        setResultPreview(result);
        
        markTestCompleted();
        
        hasNavigatedRef.current = true;
        navigateTimerRef.current = setTimeout(() => {
          navigate('/result/free');
        }, 2000);
      }
    } catch (error) {
      logger.error('Ошибка вычисления результата:', error);
    }

    return () => {
      // Не сбрасываем таймер, если редирект уже запланирован (иначе в React Strict Mode
      // cleanup отменит таймер, повторный запуск эффекта не поставит его из-за hasNavigatedRef)
      if (navigateTimerRef.current && !hasNavigatedRef.current) {
        clearTimeout(navigateTimerRef.current);
        navigateTimerRef.current = null;
      }
    };
  }, [isTestComplete, testConfig, answers, tariff, isCompleted, navigate, markTestCompleted]);

  const onSelect = useCallback((value: string) => {
    if (!currentQuestion || !testConfig) return;
    
    const isExtendedTest = 'EI' in testConfig.resultMapping;
    
    if (isExtendedTest) {
      setAnswer(currentQuestion.id, value as 'A' | 'B');
    } else {
      const questionId = currentQuestion.id as keyof Answers;
      setAnswer(questionId as number, value as Answers[typeof questionId]);
    }
  }, [currentQuestion, testConfig, setAnswer]);

  const questionCardOptions = useMemo(() => {
    return currentQuestion?.options.map(opt => ({
      value: opt.value,
      label: opt.label,
    })) || [];
  }, [currentQuestion]);

  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion || !testConfig) return false;
    const isExtendedTest = 'EI' in testConfig.resultMapping;
    if (isExtendedTest) {
      return !!(answers as ExtendedAnswers)[currentQuestion.id];
    } else {
      return !!(answers as Answers)[currentQuestion.id as keyof Answers];
    }
  }, [currentQuestion, testConfig, answers]);

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
          <span className="ml-3 text-muted">Загрузка теста...</span>
        </div>
      </section>
    );
  }

  // Ошибка загрузки конфига — только после grace period и только если конфиг так и не появился
  if (!testConfig && showConfigError) {
    return (
      <section className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="card p-6">
          <p className="text-muted">Не удалось загрузить тест. Пожалуйста, обновите страницу.</p>
        </div>
      </section>
    );
  }
  
  // Пока конфига нет — показываем лоадер (в т.ч. во время grace period и при восстановлении)
  if (!testConfig) {
    return (
      <section className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted">Загрузка теста...</span>
        </div>
      </section>
    );
  }

  if (isTestComplete) {
    return (
      <section className="fixed inset-0 flex items-center justify-center overflow-hidden">
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
      <div 
        className="fixed inset-0 -z-10 opacity-10 pointer-events-none test-bg-logo"
        style={{
          backgroundImage: 'url(/logomain.png)',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="hidden md:flex flex-shrink-0 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <TestHeader current={step} total={total} />
        </div>
        
        <div 
          className="flex-1 flex flex-col justify-center overflow-hidden container-balanced py-4 min-h-0"
          style={{
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
        
        <div className="hidden md:flex flex-shrink-0 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <TestNav
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={isCurrentQuestionAnswered}
            canGoBack={step > 1}
            isLastQuestion={step === total}
          />
        </div>

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
      
      <ExitConfirmDialog />
    </section>
  );
}

