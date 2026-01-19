import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { resolveVipMetrics, type VipMetrics } from '../engine/resolveVipMetrics';
import { useTestStore } from '../stores/useTestStore';
import { logger } from '../utils/logger';
import type { ExtendedAnswers, ExtendedTestConfig } from '../engine/types';

export default function ResultVipPage() {
  const navigate = useNavigate();
  const { testConfig, answers } = useTestStore();
  const [metrics, setMetrics] = useState<VipMetrics | null>(null);
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
        const vipMetrics = resolveVipMetrics(answers as ExtendedAnswers, extendedConfig, textModules);
        setMetrics(vipMetrics);
        setIsLoading(false);
      } catch (error) {
        logger.error('Ошибка вычисления результата:', error);
        setIsLoading(false);
      }
    }

    calculateMetrics();
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

  if (!metrics) {
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
              {metrics.resultType}
            </div>
            <p className="text-muted text-sm">
              Это ваш базовый стиль мышления и принятия решений
            </p>
          </div>

          {/* Метрики Выраженность и Уверенность */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm text-muted mb-1">Выраженность</p>
              <div className="text-3xl font-bold text-primary">{metrics.expression}%</div>
              {metrics.modules.expression && (
                <p className="text-xs text-muted mt-2 italic">
                  {metrics.modules.expression}
                </p>
              )}
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm text-muted mb-1">Уверенность</p>
              <div className="text-3xl font-bold text-primary">{metrics.confidence}%</div>
              {metrics.modules.confidence && (
                <p className="text-xs text-muted mt-2 italic">
                  {metrics.modules.confidence}
                </p>
              )}
            </div>
          </div>

          {/* Описание результата */}
          <div className="mt-8 pt-8 border-t border-secondary/20">
            <h2 className="text-xl font-semibold mb-4">Что это значит?</h2>
            <p className="text-muted leading-relaxed mb-4">
              Ваш тип {metrics.resultType} показывает, как вы обычно думаете, принимаете решения и взаимодействуете с миром.
            </p>
            <p className="text-muted leading-relaxed">
              Это первая карта вашей навигационной системы — точка отсчета для понимания себя и своих сильных сторон.
            </p>
          </div>
        </div>

        {/* 7 осей личности */}
        {metrics.axes && (
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Ваши характеристики</h2>
          <div className="space-y-6">
            {/* Ось 1 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Социальный режим</span>
                <span className="text-sm text-muted">{metrics.axes.axis1}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis1}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Автономно</span>
                <span>Через людей</span>
              </div>
            </div>

            {/* Ось 2 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Фокус мышления</span>
                <span className="text-sm text-muted">{metrics.axes.axis2}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis2}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Конкретика и факты</span>
                <span>Идеи и сценарии</span>
              </div>
            </div>

            {/* Ось 3 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Основание решений</span>
                <span className="text-sm text-muted">{metrics.axes.axis3}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis3}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Логика/справедливость</span>
                <span>Люди/ценности</span>
              </div>
            </div>

            {/* Ось 4 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Стиль организации</span>
                <span className="text-sm text-muted">{metrics.axes.axis4}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis4}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Адаптация</span>
                <span>План/структура</span>
              </div>
            </div>

            {/* Ось 5 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Драйвер мотивации</span>
                <span className="text-sm text-muted">{metrics.axes.axis5}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis5}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Результат</span>
                <span>Смысл</span>
              </div>
            </div>

            {/* Ось 6 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Старт действий</span>
                <span className="text-sm text-muted">{metrics.axes.axis6}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis6}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Через план</span>
                <span>Через пробу/эксперимент</span>
              </div>
            </div>

            {/* Ось 7 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Стиль диалога в напряжении</span>
                <span className="text-sm text-muted">{metrics.axes.axis7}%</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-3">
                <div 
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${metrics.axes.axis7}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Прямо/жёстко</span>
                <span>Мягко/согласуя</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Текстовые модули */}
        {(metrics.modules.motivation || metrics.modules.start || metrics.modules.conflict) && (
          <div className="card p-8 mb-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">Ваши особенности</h2>
            <div className="space-y-6">
              {/* Модуль мотивации */}
              {metrics.modules.motivation && (
                <div className="bg-primary/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-primary">Драйвер мотивации</h3>
                  <p className="text-muted leading-relaxed">{metrics.modules.motivation}</p>
                </div>
              )}

              {/* Модуль старта действий */}
              {metrics.modules.start && (
                <div className="bg-primary/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-primary">Старт действий</h3>
                  <p className="text-muted leading-relaxed">{metrics.modules.start}</p>
                </div>
              )}

              {/* Модуль диалога в напряжении */}
              {metrics.modules.conflict && (
                <div className="bg-primary/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-primary">Стиль диалога в напряжении</h3>
                  <p className="text-muted leading-relaxed">{metrics.modules.conflict}</p>
                </div>
              )}
            </div>
          </div>
        )}

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
            onClick={() => {
              // Здесь можно добавить логику скачивания отчета
              alert('Функция скачивания отчета будет доступна в ближайшее время');
            }}
            className="btn btn-primary px-6 py-3 flex items-center justify-center gap-2"
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

