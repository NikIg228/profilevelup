import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { resolveFreeResult } from '../engine/resolveResult';
import { useTestStore } from '../stores/useTestStore';
import { logger } from '../utils/logger';
import { submitReportJob, checkReportJobStatus } from '../utils/reportApi';
import type { Answers, FreeTestConfig } from '../engine/types';

const POLL_INTERVAL_MS = 3000;
type ReportStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export default function ResultFreePage() {
  const navigate = useNavigate();
  const { testId, testConfig, answers, resetTest, tariff } = useTestStore();
  const [resultIndex, setResultIndex] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reportJobId, setReportJobId] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle');
  const [childUrl, setChildUrl] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = useMemo(() => {
    const raw = sessionStorage.getItem('profi.user');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as { 
        name?: string;
        ageGroup?: string;
        testType?: string;
      };
    } catch (error) {
      logger.error('Ошибка парсинга данных пользователя:', error);
      return {};
    }
  }, []);

  useEffect(() => {
    if (!testConfig || !answers) {
      // Если нет данных теста, перенаправляем на главную
      navigate('/');
      return;
    }

    try {
      // Вычисляем результат
      const freeConfig = testConfig as FreeTestConfig;
      const result = resolveFreeResult(answers as Answers, freeConfig);
      setResultIndex(result);
      setIsLoading(false);
    } catch (error) {
      logger.error('Ошибка вычисления результата:', error);
      setIsLoading(false);
    }
  }, [testConfig, answers, navigate]);

  useEffect(() => {
    if (!reportJobId || (reportStatus !== 'pending' && reportStatus !== 'processing')) return;
    const poll = async () => {
      const res = await checkReportJobStatus(reportJobId!);
      setReportStatus(res.status);
      if (res.status === 'completed') {
        setChildUrl(res.childUrl ?? null);
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
    } else if (res.status === 'failed') {
      setReportError(res.error ?? 'Не удалось создать задачу отчёта');
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

  if (!resultIndex) {
    return (
      <section className="container-balanced mt-10">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ошибка</h2>
          <p className="text-muted mb-6">Не удалось вычислить результат теста.</p>
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

        {/* 3 кнопки в ряд */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                const testPath = tariff === 'EXTENDED' ? '/test/extended' 
                               : tariff === 'PREMIUM' ? '/test/premium' 
                               : '/test/free';
                navigate(testPath);
              }, 50);
            }}
            className="btn btn-primary px-6 py-3 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Пройти навигацию снова
          </button>
          {/* Кнопка/ссылка "Просмотреть отчёт" всегда в одном месте — не исчезает при смене статуса */}
          {reportStatus === 'completed' && childUrl ? (
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
          )}
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
        </div>

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

