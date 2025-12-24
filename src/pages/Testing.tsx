import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import { generateTestPDF } from '../utils/generatePDF';

type Q = { id: string; text: string; options: { value: string; label: string }[] };

const FREE_QUESTIONS: Q[] = [
  { id: 'q1', text: 'Что приносит вам больше удовольствия?', options: [
    { value: 'people', label: 'Помогать людям и общаться' },
    { value: 'tech', label: 'Разбираться в технологиях' },
    { value: 'create', label: 'Создавать что-то новое' },
  ]},
  { id: 'q2', text: 'Какой формат задач вам ближе?', options: [
    { value: 'structured', label: 'Чёткие инструкции и правила' },
    { value: 'mixed', label: 'Смешанный формат' },
    { value: 'open', label: 'Творческие и открытые задачи' },
  ]},
  { id: 'q3', text: 'Какая среда вам комфортнее?', options: [
    { value: 'team', label: 'Командная работа' },
    { value: 'solo', label: 'Индивидуальная работа' },
    { value: 'flex', label: 'Гибридный формат' },
  ]},
  { id: 'q4', text: 'Как относитесь к анализу данных?', options: [
    { value: 'love', label: 'Нравится' },
    { value: 'neutral', label: 'Нейтрально' },
    { value: 'avoid', label: 'Избегаю' },
  ]},
  { id: 'q5', text: 'Что вас мотивирует?', options: [
    { value: 'impact', label: 'Польза и влияние' },
    { value: 'growth', label: 'Развитие и новые навыки' },
    { value: 'stability', label: 'Стабильность' },
  ]},
];

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

  const total = user.plan === 'pro' ? 12 : FREE_QUESTIONS.length; // укороченный pro для макета
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const currentQuestion = FREE_QUESTIONS[step - 1];

  useEffect(() => {
    if (step > total) setDone(true);
  }, [step, total]);

  const onSelect = (val: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const summary = Object.values(answers);
      const votes = {
        people: summary.filter(v => v === 'people').length,
        tech: summary.filter(v => v === 'tech' || v === 'structured' || v === 'love').length,
        create: summary.filter(v => v === 'create' || v === 'open').length,
      };
      const top = Object.entries(votes).sort((a,b) => b[1]-a[1])[0]?.[0] ?? 'mixed';
      const brief = top === 'people' ? 'Коммуникации и сервис' : top === 'tech' ? 'Технологии и аналитика' : 'Креативные индустрии';

      await generateTestPDF({
        name: user.name || 'Пользователь',
        age: user.age || 'Не указан',
        gender: user.gender || 'Не указан',
        testType: user.testType || (user.plan === 'pro' ? 'Расширенный тест' : 'Базовый тест'),
        direction: brief,
        votes,
        answers,
        date: new Date().toLocaleDateString('ru-RU', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    } catch (error) {
      console.error('Ошибка при генерации PDF:', error);
      alert('Произошла ошибка при генерации PDF. Попробуйте ещё раз.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (done) {
    const summary = Object.values(answers);
    const votes = {
      people: summary.filter(v => v === 'people').length,
      tech: summary.filter(v => v === 'tech' || v === 'structured' || v === 'love').length,
      create: summary.filter(v => v === 'create' || v === 'open').length,
    };
    const top = Object.entries(votes).sort((a,b) => b[1]-a[1])[0]?.[0] ?? 'mixed';
    const brief = top === 'people' ? 'Коммуникации и сервис' : top === 'tech' ? 'Технологии и аналитика' : 'Креативные индустрии';
    const totalVotes = votes.people + votes.tech + votes.create;

    return (
      <section className="container-balanced mt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-6"
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
            <p className="text-sm text-muted mb-1">Ваше направление</p>
            <p className="text-2xl font-bold text-primary">{brief}</p>
          </motion.div>
          
          {/* Детализация результатов */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-6 p-4 bg-base rounded-lg border border-secondary/40"
          >
            <h2 className="font-semibold mb-3">Детализация результатов:</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted">Коммуникации и сервис</span>
                  <span className="text-sm font-medium">{votes.people} ({totalVotes > 0 ? Math.round((votes.people / totalVotes) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalVotes > 0 ? (votes.people / totalVotes) * 100 : 0}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                    className="bg-blue-500 h-2 rounded-full"
                  ></motion.div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted">Технологии и аналитика</span>
                  <span className="text-sm font-medium">{votes.tech} ({totalVotes > 0 ? Math.round((votes.tech / totalVotes) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalVotes > 0 ? (votes.tech / totalVotes) * 100 : 0}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                    className="bg-primary h-2 rounded-full"
                  ></motion.div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted">Креативные индустрии</span>
                  <span className="text-sm font-medium">{votes.create} ({totalVotes > 0 ? Math.round((votes.create / totalVotes) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalVotes > 0 ? (votes.create / totalVotes) * 100 : 0}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                    className="bg-purple-500 h-2 rounded-full"
                  ></motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Кнопка скачивания PDF */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="mt-6"
          >
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="btn btn-primary w-full sm:w-auto px-5 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Генерация PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Скачать отчёт в PDF
                </>
              )}
            </button>
          </motion.div>

          {user.plan === 'free' ? (
            <div className="mt-6 grid gap-3">
              <p className="text-muted">Это краткий результат на основе упрощённого теста.</p>
              <p className="text-muted">Хотите получить полный отчёт с персональными рекомендациями?</p>
              <a href="/" className="btn btn-ghost w-fit px-5 py-3">Перейти к расширенной версии</a>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              <p className="text-muted">Полный отчёт с детальными рекомендациями доступен в скачанном PDF файле.</p>
              {user.email && (
                <p className="text-sm text-muted">Мы также отправим вам полный отчёт на email: <span className="font-medium">{user.email}</span></p>
              )}
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="container-balanced mt-10">
      <h1 className="text-2xl font-semibold">Пройди тест и узнай, какая профессия тебе подходит</h1>
      <div className="mt-6">
        <ProgressBar current={step} total={total} />
      </div>
      {currentQuestion && (
        <div className="mt-6">
          <QuestionCard
            question={currentQuestion.text}
            options={currentQuestion.options}
            value={answers[currentQuestion.id]}
            onChange={onSelect}
          />
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          className="btn px-5 py-3 w-full"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >Назад</button>
        <button
          className="btn btn-primary px-5 py-3 w-full"
          onClick={() => setStep((s) => s + 1)}
          disabled={!currentQuestion || !answers[currentQuestion.id]}
        >Далее</button>
      </div>
    </section>
  );
}


