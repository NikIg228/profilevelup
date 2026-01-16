import { useState, useEffect } from 'react';
import { useTestStore } from '../stores/useTestStore';
import { Download, Calendar, User, FileText } from 'lucide-react';
import type { Tariff, AgeGroup } from '../engine/types';

interface TestRecord {
  testId: string;
  tariff: Tariff;
  ageGroup: AgeGroup;
  resultIndex: string | null;
  completedAt: string;
  startedAt: string;
}

export default function TestHistory() {
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загружаем историю тестов из localStorage
    // В реальном приложении это будет API запрос
    const loadTestHistory = () => {
      try {
        const stored = localStorage.getItem('profi-test-history');
        if (stored) {
          const history: TestRecord[] = JSON.parse(stored);
          // Сортируем по дате завершения (новые первыми)
          const sorted = history.sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );
          setTests(sorted);
        }
      } catch (error) {
        console.error('Ошибка загрузки истории тестов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTestHistory();

    // Периодически обновляем историю (на случай, если тест завершился в другой вкладке)
    const interval = setInterval(() => {
      loadTestHistory();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = (test: TestRecord) => {
    // Заглушка для скачивания
    // В реальном приложении здесь будет API запрос для генерации PDF
    const data = {
      testId: test.testId,
      tariff: test.tariff,
      ageGroup: test.ageGroup,
      resultIndex: test.resultIndex,
      completedAt: test.completedAt,
      startedAt: test.startedAt,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-result-${test.testId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTariffLabel = (tariff: Tariff) => {
    const labels: Record<Tariff, string> = {
      FREE: 'Бесплатный',
      PRO: 'Про',
      PREMIUM: 'Премиум',
      EXTENDED: 'Расширенный',
    };
    return labels[tariff];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="bg-secondary/20 rounded-2xl p-8 border border-secondary text-center">
        <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-heading mb-2">История тестов пуста</h3>
        <p className="text-muted">Здесь будут отображаться все пройденные вами тесты</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        История тестов ({tests.length})
      </h3>
      
      <div className="space-y-3">
        {tests.map((test) => (
          <div
            key={test.testId}
            className="bg-secondary/20 rounded-xl p-4 border border-secondary hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    {getTariffLabel(test.tariff)}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-secondary text-muted text-sm">
                    {test.ageGroup}
                  </span>
                </div>
                
                {test.resultIndex && (
                  <div className="mb-2">
                    <span className="text-sm text-muted">Результат: </span>
                    <span className="text-sm font-mono font-semibold text-heading">
                      {test.resultIndex}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Завершен: {formatDate(test.completedAt)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDownload(test)}
                className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm font-medium"
                aria-label="Скачать результат теста"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Скачать</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

