import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { resolveVipMetrics, type VipMetrics } from '../engine/resolveVipMetrics';
import { useTestStore } from '../stores/useTestStore';
import { useAuthStore } from '../stores/useAuthStore';
import { logger } from '../utils/logger';
import { getStoredPromo, getPriceWithPromo } from '../utils/promoApi';
import { PAYMENT_API } from '../config/api';
import { submitReportJob, checkReportJobStatus } from '../utils/reportApi';
import type { ExtendedAnswers, ExtendedTestConfig } from '../engine/types';

const POLL_INTERVAL_MS = 3000;

function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₸`;
}

type ReportStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export default function ResultVipPage() {
  const navigate = useNavigate();
  const { testId, testConfig, answers, resetTest, tariff } = useTestStore();
  const authUser = useAuthStore((s) => s.user);
  const [metrics, setMetrics] = useState<VipMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  /** Оплачен ли платный тест (доступ к просмотру отчёта) */
  const [isPaid, setIsPaid] = useState(false);
  const [paidCheckLoading, setPaidCheckLoading] = useState(false);

  // PDF отчёт: создание задачи, опрос, отображение
  const [reportJobId, setReportJobId] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle');
  const [childUrl, setChildUrl] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sent' | 'failed' | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = useMemo(() => {
    const raw = sessionStorage.getItem('profi.user');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as { 
        name?: string;
        age?: number | string;
        ageGroup?: string;
        testType?: string;
      };
    } catch (error) {
      logger.error('Ошибка парсинга данных пользователя:', error);
      return {};
    }
  }, []);

  const promo = useMemo(() => getStoredPromo(), []);
  const { basePrice, finalPrice, hasDiscount } = useMemo(
    () => getPriceWithPromo(tariff || 'EXTENDED', promo),
    [tariff, promo]
  );

  useEffect(() => {
    if (!testConfig || !answers) {
      // Если нет данных теста, перенаправляем на главную
      navigate('/');
      return;
    }

    async function calculateMetrics() {
      if (!testConfig) return;
      
      try {
        // Проверяем, что это EXTENDED/PREMIUM тест
        if (!('EI' in testConfig.resultMapping)) {
          logger.error('Неверный тип теста для VIP результатов');
          navigate('/');
          return;
        }

        // Загружаем текстовые модули
        let textModules = null;
        try {
          const response = await fetch('/data/text_modules.json');
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              textModules = await response.json();
            } else {
              logger.warn('Сервер вернул не JSON, пропускаем загрузку модулей');
            }
          } else {
            logger.warn(`Не удалось загрузить текстовые модули: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          logger.warn('Не удалось загрузить текстовые модули:', error);
        }

        // Вычисляем все метрики VIP теста
        const extendedConfig = testConfig as ExtendedTestConfig;
        
        // Получаем возраст из user объекта (он должен быть числом, но на всякий случай парсим)
        const userAge = user.age ? (typeof user.age === 'number' ? user.age : parseInt(user.age as string, 10)) : 18;
        
        const vipMetrics = resolveVipMetrics(answers as ExtendedAnswers, extendedConfig, textModules, userAge);
        setMetrics(vipMetrics);
        setIsLoading(false);
      } catch (error) {
        logger.error('Ошибка вычисления результата:', error);
        setIsLoading(false);
      }
    }

    calculateMetrics();
  }, [testConfig, answers, navigate]);

  // Проверка оплаты для платного теста (доступ к отчёту только после оплаты)
  useEffect(() => {
    if (!testId || !tariff || (tariff !== 'EXTENDED' && tariff !== 'PREMIUM')) return;
    let cancelled = false;
    setPaidCheckLoading(true);
    fetch(PAYMENT_API.CHECK(testId))
      .then((res) => (res.ok ? res.json() : { paid: false }))
      .then((data) => {
        if (!cancelled && data && typeof data.paid === 'boolean') setIsPaid(data.paid);
      })
      .catch(() => {
        if (!cancelled) setIsPaid(false);
      })
      .finally(() => {
        if (!cancelled) setPaidCheckLoading(false);
      });
    return () => { cancelled = true; };
  }, [testId, tariff]);

  // Опрос статуса отчёта по jobId
  useEffect(() => {
    if (!reportJobId || (reportStatus !== 'pending' && reportStatus !== 'processing')) return;

    const poll = async () => {
      const res = await checkReportJobStatus(reportJobId!);
      setReportStatus(res.status);
      if (res.status === 'completed') {
        setChildUrl(res.childUrl ?? null);
        if (res.emailStatus) setEmailStatus(res.emailStatus);
        setReportError(null);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else if (res.status === 'failed') {
        setReportError(res.error ?? 'Ошибка генерации отчёта');
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [reportJobId, reportStatus]);

  const requestReport = async () => {
    if (!testId || !tariff || !testConfig || !answers) {
      setReportError('Недостаточно данных для генерации отчёта');
      return;
    }
    if (reportJobId || reportStatus === 'processing' || reportStatus === 'pending') {
      return;
    }
    setReportError(null);
    setReportStatus('processing');
    const completedAt = new Date().toISOString();
    const res = await submitReportJob(testId, tariff, answers, testConfig, completedAt);
    setReportJobId(res.jobId);
    setReportStatus(res.status);
    if (res.status === 'completed') {
      const statusRes = await checkReportJobStatus(res.jobId);
      setChildUrl(statusRes.childUrl ?? null);
      if (statusRes.emailStatus) setEmailStatus(statusRes.emailStatus);
    } else if (res.status === 'failed') {
      const errMsg = res.error ?? 'Не удалось создать задачу отчёта';
      const isPaymentRequired = errMsg.includes('403') || errMsg.includes('PAYMENT_REQUIRED') || errMsg.includes('оплаты');
      setReportError(isPaymentRequired
        ? 'Просмотр отчёта доступен только после оплаты. Нажмите «Получить расширенный разбор» и оплатите.'
        : errMsg);
    }
  };

  if (isLoading) {
    return (
      <section className="container-balanced mt-10">
        <div className="card p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Вычисление результата...</p>
        </div>
      </section>
    );
  }

  if (!metrics) {
    return (
      <section className="container-balanced mt-10">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ошибка</h2>
          <p className="text-muted mb-6">Не удалось вычислить результат навигации.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Вернуться на главную
          </button>
        </div>
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
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-heading mb-2">
            Навигация завершена!
          </h1>
          {user.name && (
            <p className="text-lg text-muted">
              {user.name}, спасибо за прохождение навигации
            </p>
          )}
        </div>

        {reportStatus === 'completed' && childUrl && (
          <p className="mb-4 text-center text-primary font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Ваш отчёт готов!
          </p>
        )}

        {/* Подсказка: не выходить и не обновлять страницу пока отчёт готовится */}
        {(reportStatus === 'pending' || reportStatus === 'processing') && (
          <div className="mb-4 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-600 text-center">
            <p className="font-semibold sm:text-base" style={{ color: '#1a1a1a' }}>
              Не закрывайте и не обновляйте страницу! Ваш отчёт будет готов в течение минуты.
            </p>
          </div>
        )}

        {reportStatus === 'failed' && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            {reportError ?? 'Ошибка генерации отчёта'}
          </p>
        )}

        {/* Кнопки в ряд */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost px-6 py-3 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться на главную
          </button>
          <button
            onClick={async () => {
              await resetTest();
              setTimeout(() => {
                const testPath = tariff === 'PREMIUM' ? '/test/premium' 
                               : tariff === 'FREE' ? '/test/free' 
                               : '/test/extended';
                navigate(testPath);
              }, 50);
            }}
            className="btn btn-primary px-6 py-3 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Пройти навигацию снова
          </button>
          {/* Просмотр отчёта только после оплаты платного теста. Ссылка на отчёт для родителя только в письме на email родителя. */}
          {isPaid ? (
            reportStatus === 'completed' && childUrl ? (
              <a
                href={childUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline px-6 py-3 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Просмотреть отчёт
              </a>
            ) : (
              <button
                type="button"
                onClick={requestReport}
                disabled={reportStatus === 'pending' || reportStatus === 'processing' || (reportStatus === 'completed' && !childUrl)}
                className="btn btn-outline px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[180px]"
              >
                {(reportStatus === 'pending' || reportStatus === 'processing' || (reportStatus === 'completed' && !childUrl)) ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 shrink-0" />
                )}
                {reportStatus === 'completed' && !childUrl ? 'Подготовка ссылки...' : 'Просмотреть отчёт'}
              </button>
            )
          ) : !paidCheckLoading ? (
            <span className="text-muted text-sm px-2 py-1 rounded bg-muted/50">
              Отчёт доступен после оплаты расширенного разбора
            </span>
          ) : null}
          {reportStatus === 'failed' && (
            <button
              type="button"
              onClick={() => {
                setReportStatus('idle');
                setReportJobId(null);
                setReportError(null);
                requestReport();
              }}
              className="btn btn-outline px-6 py-3"
            >
              Повторить
            </button>
          )}
          <button
            onClick={async () => {
              setPaymentPending(true);
              try {
                // При 100% скидке платёж не нужен — выдаём доступ к отчёту без Robokassa
                if (finalPrice <= 0) {
                  const res = await fetch(PAYMENT_API.GRANT_FREE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      test_id: testId ?? '',
                      tariff: tariff ?? 'EXTENDED',
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    logger.error('Ошибка выдачи бесплатного доступа:', res.status, err);
                    alert(err.detail || 'Не удалось получить доступ к отчёту. Попробуйте позже.');
                    return;
                  }
                  setIsPaid(true);
                  return;
                }
                const res = await fetch(PAYMENT_API.CREATE, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount: finalPrice,
                    description: 'Расширенный разбор результата теста',
                    test_id: testId ?? undefined,
                    tariff: tariff ?? 'EXTENDED',
                    user_id: authUser?.id ?? undefined,
                    email: (user as { email?: string }).email ?? undefined,
                  }),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  logger.error('Ошибка создания платежа:', res.status, err);
                  alert(err.detail || 'Не удалось перейти к оплате. Попробуйте позже.');
                  return;
                }
                const data = await res.json() as { payment_url: string; inv_id: number };
                window.location.href = data.payment_url;
              } catch (e) {
                logger.error('Ошибка создания платежа:', e);
                alert('Не удалось перейти к оплате. Проверьте подключение.');
              } finally {
                setPaymentPending(false);
              }
            }}
            disabled={paymentPending}
            className="btn btn-outline px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 disabled:opacity-70"
          >
            {paymentPending ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            ) : (
              <Download className="w-5 h-5 shrink-0" />
            )}
            <span>{finalPrice <= 0 ? 'Получить отчёт бесплатно' : 'Получить расширенный разбор'}</span>
            <span className="flex items-center gap-2 text-sm font-medium">
              {hasDiscount ? (
                <>
                  <span className="line-through text-muted">{formatPrice(basePrice)}</span>
                  <span className="text-primary">{formatPrice(finalPrice)}</span>
                </>
              ) : (
                <span className="text-primary">{formatPrice(finalPrice)}</span>
              )}
            </span>
          </button>
        </div>

        {/* Для PREMIUM: отчёт для родителя только по email, не по кнопке */}
        {tariff === 'PREMIUM' && reportStatus === 'completed' && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center text-sm text-muted">
            {emailStatus === 'sent' && (
              <p>Ссылка на отчёт для родителя отправлена на указанный при регистрации email.</p>
            )}
            {emailStatus === 'pending' && (
              <p>Письмо с отчётом для родителя будет отправлено на указанный при регистрации email.</p>
            )}
            {emailStatus === 'failed' && (
              <p className="text-amber-700 dark:text-amber-400">Не удалось отправить письмо с отчётом для родителя. Обратитесь в поддержку.</p>
            )}
          </div>
        )}

        {/* Дополнительная информация */}
        <div className="mt-8 card p-6 bg-primary/5 border border-primary/20">
          <h3 className="text-lg font-semibold mb-3">Что дальше?</h3>
          <ul className="space-y-2 text-muted">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Откройте PDF-отчёт по кнопке выше</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Вернитесь на главную или пройдите навигацию снова</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

