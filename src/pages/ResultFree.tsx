import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, RotateCcw } from 'lucide-react';
import { resolveFreeResult } from '../engine/resolveResult';
import { useTestStore } from '../stores/useTestStore';
import { logger } from '../utils/logger';
import type { Answers, FreeTestConfig } from '../engine/types';

export default function ResultFreePage() {
  const navigate = useNavigate();
  const { testConfig, answers, resetTest, tariff } = useTestStore();
  const [resultIndex, setResultIndex] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            Тест завершен!
          </h1>
          {user.name && (
            <p className="text-lg text-muted">
              {user.name}, спасибо за прохождение теста
            </p>
          )}
        </div>

        {/* Результат */}
        <div className="card p-8 mb-6 text-center">
          <div className="mb-6">
            <p className="text-sm text-muted mb-2">Ваш тип личности</p>
            <div className="text-6xl font-bold text-primary mb-4">
              {resultIndex}
            </div>
            <p className="text-muted text-sm">
              Это ваш базовый стиль мышления и принятия решений
            </p>
          </div>

          {/* Описание результата */}
          <div className="mt-8 pt-8 border-t border-secondary/20">
            <h2 className="text-xl font-semibold mb-4">Что это значит?</h2>
            <p className="text-muted leading-relaxed mb-4">
              Ваш тип {resultIndex} показывает, как вы обычно думаете, принимаете решения и взаимодействуете с миром.
            </p>
            <p className="text-muted leading-relaxed">
              Это первая карта вашей навигационной системы — точка отсчета для понимания себя и своих сильных сторон.
            </p>
          </div>
        </div>

        {/* Действия */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost px-6 py-3 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться на главную
          </button>
          <button
            onClick={async () => {
              // Сбрасываем состояние теста и переходим к новому прохождению
              await resetTest();
              // Небольшая задержка для гарантии полного сброса состояния
              setTimeout(() => {
                // Используем тариф из store или по умолчанию FREE
                const testPath = tariff === 'EXTENDED' ? '/test/extended' 
                               : tariff === 'PREMIUM' ? '/test/premium' 
                               : '/test/free';
                navigate(testPath);
              }, 50);
            }}
            className="btn btn-primary px-6 py-3 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Пройти тест снова
          </button>
          <button
            onClick={() => {
              // Здесь можно добавить логику скачивания отчета
              alert('Функция скачивания отчета будет доступна в ближайшее время');
            }}
            className="btn btn-outline px-6 py-3 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Скачать отчет
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 card p-6 bg-primary/5 border border-primary/20">
          <h3 className="text-lg font-semibold mb-3">Что дальше?</h3>
          <ul className="space-y-2 text-muted">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Изучите подробный отчет о вашем типе личности</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Узнайте о своих сильных сторонах и зонах роста</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Получите рекомендации по развитию и взаимодействию</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

