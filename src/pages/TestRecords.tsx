/**
 * ⚠️ ВРЕМЕННАЯ СТРАНИЦА ДЛЯ ВНУТРЕННЕГО ТЕСТИРОВАНИЯ
 * 
 * Страница для просмотра записей тестов из localStorage
 */

import { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTestRecords, clearTestRecords, exportTestRecords, type TestRecord } from '../utils/testRecorder';

export default function TestRecordsPage() {
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = () => {
    setLoading(true);
    const loadedRecords = getTestRecords();
    setRecords(loadedRecords);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleExport = () => {
    const json = exportTestRecords();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Вы уверены, что хотите удалить все записи тестов?')) {
      clearTestRecords();
      loadRecords();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Не завершён';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  return (
    <section className="container-balanced mt-10 mb-20">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              ⚠️ Записи тестов 
            </h1>
            <p className="text-sm text-muted">
              Всего записей: <span className="font-semibold">{records.length}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadRecords}
              disabled={loading}
              className="btn btn-ghost px-4 py-2 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={handleExport}
              disabled={records.length === 0}
              className="btn btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт JSON
            </button>
            <button
              onClick={handleClear}
              disabled={records.length === 0}
              className="btn btn-ghost px-4 py-2 flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Очистить
            </button>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>Записей тестов пока нет.</p>
            <p className="text-sm mt-2">Записи появятся после прохождения тестов.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-2 border-secondary/40 rounded-xl p-5 bg-base/50 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Тест #{records.length - index}
                      </h3>
                      {record.completed ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Завершён
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600 text-sm">
                          <XCircle className="w-4 h-4" />
                          Не завершён
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Тариф:</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {record.tariff}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Возрастная группа:</span>
                        <span>{record.ageGroup}</span>
                      </div>
                      {record.testType && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Тип теста:</span>
                          <span>{record.testType}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Длительность:</span>
                        <span>{getDuration(record.startTime, record.endTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 mt-0.5 text-muted" />
                    <div>
                      <div className="font-medium">Начало:</div>
                      <div className="text-muted">{formatDate(record.startTime)}</div>
                    </div>
                  </div>
                  {record.endTime && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 text-muted" />
                      <div>
                        <div className="font-medium">Завершение:</div>
                        <div className="text-muted">{formatDate(record.endTime)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {record.resultIndex && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-sm font-medium text-muted mb-1">Результат:</div>
                    <div className="text-2xl font-bold text-primary">{record.resultIndex}</div>
                  </div>
                )}

                <div className="border-t border-secondary/40 pt-4">
                  <div className="text-sm font-medium text-muted mb-3">
                    Ответы ({Object.keys(record.answers).length}):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.entries(record.answers)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([questionId, answer]) => (
                        <div
                          key={questionId}
                          className="px-3 py-2 bg-secondary/30 rounded-lg text-center"
                        >
                          <div className="text-xs font-medium text-muted mb-1">Q{questionId}</div>
                          <div className="text-2xl font-bold text-heading">{answer}</div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-4 text-xs text-muted">
                  ID: <code className="bg-secondary/30 px-1 py-0.5 rounded">{record.id}</code>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

