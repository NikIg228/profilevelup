import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, FileText, HelpCircle, CheckSquare, Users, Star, GraduationCap, Briefcase, Target, Lightbulb, Heart, Sparkles, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import Modal from '../components/Modal';
import AutoSlider from '../components/AutoSlider';
import Select from '../components/Select';
import CountUp from '../components/CountUp';
import VideoPlayer from '../components/VideoPlayer';
import ReviewForm from '../components/ReviewForm';
import { getReviews } from '../utils/reviewsStorage';
import type { VideoItem } from '../hooks/useVideoController';

type FormErrorKey = 'name' | 'age' | 'gender' | 'testType' | 'email' | 'emailConfirm' | 'consent';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState<'free'|'pro'|null>(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', testType: '', email: '', emailConfirm: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  // Состояния для accordion-карточек на мобильных
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const videoItems: VideoItem[] = [
    { id: '1', src: '/video_otzyvy/1Аиша.mov', title: 'Аиша' },
    { id: '2', src: '/video_otzyvy/2Инкар.mov', title: 'Инкар' },
    { id: '3', src: '/video_otzyvy/3Дима.mp4', title: 'Дима' },
    { id: '4', src: '/video_otzyvy/4Индира.mp4', title: 'Индира' },
    { id: '5', src: '/video_otzyvy/5Альбина.mov', title: 'Альбина' },
    { id: '6', src: '/video_otzyvy/6ноунейм.mp4', title: 'Отзыв' },
    { id: '7', src: '/video_otzyvy/7ноунейм.mp4', title: 'Отзыв' },
  ];

  const handleVideoClick = (index: number) => {
    setCurrentVideoIndex(index);
    setVideoModalOpen(true);
  };

  const trimmedEmail = form.email.trim();
  const trimmedEmailConfirm = form.emailConfirm.trim();
  const isBasicTest = plan === 'free' || form.testType === 'Базовый';
  const emailsMatch = trimmedEmail && trimmedEmailConfirm && trimmedEmail === trimmedEmailConfirm;
  const isFormComplete = Boolean(
    form.name.trim() &&
    form.age.trim() &&
    form.gender &&
    form.testType &&
    trimmedEmail &&
    (isBasicTest || (trimmedEmailConfirm && emailsMatch)) &&
    form.consent
  );

  const clearError = (field: FormErrorKey) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const openFor = (p: 'free'|'pro', testTypeValue?: string) => {
    setPlan(p);
    // Сбрасываем форму и ошибки при открытии
    setForm({ name: '', age: '', gender: '', testType: testTypeValue || '', email: '', emailConfirm: '', consent: false });
    setErrors({});
    setModalOpen(true);
  };
  const startTest = () => {
    const emailValue = form.email.trim();
    const emailConfirmValue = form.emailConfirm.trim();
    const isBasicTest = plan === 'free' || form.testType === 'Базовый';
    const newErrors: Partial<Record<FormErrorKey, string>> = {};

    if (!form.name.trim()) newErrors.name = 'Укажите имя';
    
    // Валидация возраста (10-70)
    if (!form.age.trim()) {
      newErrors.age = 'Укажите возраст';
    } else {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 70) {
        newErrors.age = 'Возраст должен быть от 10 до 70 лет';
      }
    }
    
    if (!form.gender) newErrors.gender = 'Выберите пол';
    if (!form.testType) newErrors.testType = 'Выберите вид теста';
    
    if (!emailValue) {
      newErrors.email = 'Укажите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = 'Введите корректный email';
    }
    
    // Подтверждение email только для платных тестов
    if (!isBasicTest) {
      if (!emailConfirmValue) {
        newErrors.emailConfirm = 'Повторите email';
      } else if (emailConfirmValue !== emailValue) {
        newErrors.emailConfirm = 'Email не совпадает';
      }
    }
    
    if (!form.consent) newErrors.consent = 'Необходимо подтвердить согласие';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const { emailConfirm, ...formWithoutConfirm } = form;
    sessionStorage.setItem('profi.user', JSON.stringify({ ...formWithoutConfirm, email: emailValue, plan }));
    navigate('/test');
  };

  return (
    <div>
      {/* Hero */}
      <section className="container-balanced -mt-8 sm:-mt-12">
        <div className="grid lg:grid-cols-2 items-center gap-8">
          <div className="fade-section">
            {/* Мобильная версия: заголовок в 2 строки */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
              <span className="block lg:inline">Твой путь начинается</span>
              <span className="block lg:inline lg:ml-1">с понимания себя</span>
            </h1>
            {/* Мобильная версия: подзаголовок короче */}
            <p className="mt-4 text-muted text-base sm:text-lg">
            Короткий тест, который помогает увидеть
            <span className="hidden sm:inline"> свои сильные стороны</span>
            <span className="hidden md:inline"> и роли, в которых тебе естественно и комфортно быть собой.</span>
            </p>
            <div className="mt-6 flex gap-3 flex-col sm:flex-row">
              <button className="btn btn-primary px-5 py-3 w-full sm:w-auto min-h-[48px] sm:min-h-0" onClick={() => openFor('free')}>Начать бесплатное тестирование</button>
              <Link to="/details" className="btn btn-ghost px-5 py-3 w-full sm:w-auto min-h-[48px] sm:min-h-0 text-center">Подробнее</Link>
            </div>
          </div>
          {/* Мобильная версия: иллюстрация меньше (на 20-30%) и ниже */}
          <div className="lg:hidden fade-section order-first lg:order-none">
            <div className="rounded-2xl overflow-visible aspect-square mb-4 flex items-center justify-center p-4">
              <img src="/logomain.png" alt="Логотип Профиль будущего" className="w-[90%] h-[90%] object-contain" loading="lazy" />
            </div>
          </div>
          <div className="hidden lg:block fade-section">
            <div className="rounded-2xl overflow-visible aspect-square flex items-center justify-center p-6">
              <img src="/logomain.png" alt="Логотип Профиль будущего" className="w-[120%] h-[120%] object-contain" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Formats */}
      <section id="formats" className="container-balanced mt-4 lg:mt-8">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Базовый */}
          <div className={`card flex flex-col shadow-md bg-white order-1 transition-all duration-300
            ${expandedCard === 'basic' ? 'border-2 border-primary shadow-lg bg-base/30' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:group lg:cursor-pointer`}>
            {/* Desktop версия */}
            <div className="hidden lg:flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/basic.png"
                    alt=""
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-heading">Базовый</h3>
                  <span className="px-4 py-1.5 bg-primary text-white font-bold text-lg rounded-lg shadow-md whitespace-nowrap">
                    Бесплатно
                  </span>
                </div>
                <ul className="mt-6 text-sm text-muted space-y-2 list-disc list-inside">
                  <li>Короткий вводный тест</li>
                  <li>Первичное понимание своего стиля мышления и действий</li>
                  <li>Краткое описание твоего стиля мышления и поведения</li>
                  <li>Помогает понять, откликается ли тебе этот формат</li>
                </ul>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={() => openFor('free', 'Базовый')}
              >
                Начать
              </button>
            </div>

            {/* Мобильная версия - accordion */}
            <div className={`lg:hidden p-3 sm:p-4 transition-all duration-300 ${expandedCard === 'basic' ? 'bg-base/50' : ''}`}>
              {/* Свернутое состояние */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <img src="/komu/basic.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Название + цена в одной строке */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-heading">Базовый</h3>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white font-bold text-sm sm:text-base rounded-lg whitespace-nowrap flex-shrink-0 shadow-md">
                      Бесплатно
                    </span>
                  </div>
                  {/* Подзаголовок = 1 строка смысла */}
                  <p className="text-sm text-muted">Мягкий формат для начала</p>
                </div>
              </div>

              {/* CTA с анимированной стрелкой */}
              <button
                onClick={() => setExpandedCard(expandedCard === 'basic' ? null : 'basic')}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary/10 rounded-xl hover:bg-secondary/20 transition-colors"
              >
                <span className="text-sm font-medium text-heading">Подробнее</span>
                <motion.div
                  animate={{ rotate: expandedCard === 'basic' ? 90 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
                </motion.div>
              </button>

              {/* Развернутое состояние - сразу список без заголовка */}
              <motion.div
                initial={false}
                animate={{
                  maxHeight: expandedCard === 'basic' ? 1000 : 0,
                  opacity: expandedCard === 'basic' ? 1 : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ overflow: 'hidden' }}
              >
                <div className="pt-3 pb-2">
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Короткий вводный тест</li>
                    <li>Первичное понимание своего стиля мышления и действий</li>
                    <li>Краткое описание твоего стиля мышления и поведения</li>
                    <li>Помогает понять, откликается ли тебе этот формат</li>
                  </ul>
                </div>
              </motion.div>

              {/* CTA кнопка - единственный главный CTA */}
              {expandedCard === 'basic' && (
                <button
                  onClick={() => openFor('free', 'Базовый')}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Начать тест
                </button>
              )}
            </div>
          </div>

          {/* Расширенный */}
          <div className={`card flex flex-col border-2 border-primary/20 rounded-2xl shadow-md bg-gradient-to-b from-primary/5 to-white order-2 transition-all duration-300 relative
            ${expandedCard === 'extended' ? 'border-2 border-primary shadow-lg bg-base/30' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:hover:border-primary/40 lg:group lg:cursor-pointer`}>
            {/* Desktop версия */}
            <div className="hidden lg:flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/vip.png"
                    alt=""
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-heading">Расширенный</h3>
                  <span className="px-4 py-1.5 bg-primary text-white font-bold text-lg rounded-lg shadow-md whitespace-nowrap">
                    6 990 тг
                  </span>
                </div>
                <div className="mt-6 text-sm text-muted space-y-2 border-l-2 border-primary/30 pl-4">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Персональный профиль, отражающий твой текущий этап жизни</li>
                    <li>Индивидуальный отчёт с разбором и рекомендациями (PDF)</li>
                    <li>Сильные стороны и зоны роста</li>
                    <li>Профессии и направления, где тебе легче быть собой</li>
                    <li>Формат и условия работы, в которых ты раскрываешься естественно</li>
                    <li>Рекомендации по развитию и взаимодействию с другими</li>
                  </ul>
                </div>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={() => openFor('pro', 'Расширенный')}
              >
                Начать
              </button>
            </div>

            {/* Мобильная версия - accordion */}
            <div className={`lg:hidden p-3 sm:p-4 transition-all duration-300 ${expandedCard === 'extended' ? 'bg-base/50' : ''}`}>
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <img src="/komu/vip.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Название + цена в одной строке */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-heading">Расширенный</h3>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white font-bold text-sm sm:text-base rounded-lg whitespace-nowrap flex-shrink-0 shadow-md">
                      6 990 тг
                    </span>
                  </div>
                  {/* Подзаголовок = 1 строка смысла */}
                  <p className="text-sm text-muted">Понимание себя в деталях</p>
                </div>
              </div>

              {/* CTA с анимированной стрелкой */}
              <button
                onClick={() => setExpandedCard(expandedCard === 'extended' ? null : 'extended')}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary/10 rounded-xl hover:bg-secondary/20 transition-colors"
              >
                <span className="text-sm font-medium text-heading">Подробнее</span>
                <motion.div
                  animate={{ rotate: expandedCard === 'extended' ? 90 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
                </motion.div>
              </button>

              {/* Развернутое состояние - сразу список без заголовка */}
              <motion.div
                initial={false}
                animate={{
                  maxHeight: expandedCard === 'extended' ? 1000 : 0,
                  opacity: expandedCard === 'extended' ? 1 : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ overflow: 'hidden' }}
              >
                <div className="pt-3 pb-2">
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Персональный профиль</li>
                    <li>Подробный PDF-отчёт</li>
                    <li>Сильные стороны</li>
                    <li>Подходящие профессии</li>
                    <li>Рекомендации по развитию</li>
                  </ul>
                </div>
              </motion.div>

              {/* CTA кнопка - единственный главный CTA */}
              {expandedCard === 'extended' && (
                <button
                  onClick={() => openFor('pro', 'Расширенный')}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Начать тест
                </button>
              )}
            </div>
          </div>

          {/* Premium */}
          <div className={`card flex flex-col rounded-2xl shadow-xl bg-card-recommend order-3 transition-all duration-300 relative
            ${expandedCard === 'premium' ? 'border-2 border-primary shadow-lg' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-2xl lg:hover:-translate-y-1 lg:group lg:cursor-pointer lg:border-2 lg:border-primary lg:hover:border-primary-hover`}>
            {/* Баннер сверху */}
            <div className="absolute -top-3 lg:-top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg shadow-md z-10">
              <p className="text-xs lg:text-sm font-semibold whitespace-nowrap">Для родителей</p>
            </div>
            
            {/* Desktop версия */}
            <div className="hidden lg:flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/PREMIUM .png"
                    alt=""
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-heading">Premium</h3>
                  <span className="px-4 py-1.5 bg-primary text-white font-bold text-lg rounded-lg shadow-md whitespace-nowrap">
                    14 990 тг
                  </span>
                </div>
                <div className="mt-6 text-sm text-muted space-y-2">
                  <p className="mb-2 px-3 py-2 bg-primary/10 rounded-lg text-ink font-medium border-l-2 border-primary">Ребёнок проходит расширенный тест и получает свой персональный отчёт.</p>
                  <p className="mb-2 px-3 py-2 bg-primary/10 rounded-lg text-ink font-medium border-l-2 border-primary">Родитель получает отдельный отчёт с рекомендациями по взаимодействию.</p>
                  <ul className="list-disc list-inside space-y-1 mb-8">
                    <li>Персональный отчёт для ребёнка — без изменений</li>
                    <li>Отдельный отчёт для родителя, который приходит на e-mail</li>
                    <li>Как общаться с ребёнком так, чтобы мотивировать, а не загонять в угол</li>
                    <li>Какие слова и подходы работают, а какие вызывают сопротивление</li>
                    <li>На что можно опираться в диалоге, а где лучше не давить</li>
                  </ul>
                </div>
              </div>
              <button
                className="mt-auto mt-6 px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={() => openFor('pro', 'Premium')}
              >
                Начать
              </button>
            </div>

            {/* Мобильная версия - accordion */}
            <div className={`lg:hidden p-3 sm:p-4 bg-primary/5 transition-all duration-300 ${expandedCard === 'premium' ? 'bg-primary/10 border-2 border-primary shadow-lg' : ''}`}>
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <img src="/komu/PREMIUM .png" alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Название + цена в одной строке */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-heading">Premium для родителей</h3>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white font-bold text-sm sm:text-base rounded-lg whitespace-nowrap flex-shrink-0 shadow-md">
                      14 990 тг
                    </span>
                  </div>
                  {/* Подзаголовок с акцентом */}
                  <p className="text-sm text-muted font-medium">Помогает понять ребёнка и выстроить доверительный диалог</p>
                </div>
              </div>

              {/* CTA с анимированной стрелкой */}
              <button
                onClick={() => setExpandedCard(expandedCard === 'premium' ? null : 'premium')}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary/10 rounded-xl hover:bg-secondary/20 transition-colors"
              >
                <span className="text-sm font-medium text-heading">Подробнее</span>
                <motion.div
                  animate={{ rotate: expandedCard === 'premium' ? 90 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
                </motion.div>
              </button>

              {/* Развернутое состояние - сразу список без заголовка */}
              <motion.div
                initial={false}
                animate={{
                  maxHeight: expandedCard === 'premium' ? 1000 : 0,
                  opacity: expandedCard === 'premium' ? 1 : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ overflow: 'hidden' }}
              >
                <div className="pt-3 pb-2">
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Персональный отчёт для ребёнка</li>
                    <li>Отдельный отчёт для родителя на e-mail</li>
                    <li>Как общаться с ребёнком так, чтобы мотивировать</li>
                    <li>Какие слова и подходы работают</li>
                    <li>На что можно опираться в диалоге</li>
                  </ul>
                </div>
              </motion.div>

              {/* CTA кнопка - единственный главный CTA */}
              {expandedCard === 'premium' && (
                <button
                  onClick={() => openFor('pro', 'Premium')}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Начать тест
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof - Trust cards */}
      <section className="container-balanced mt-12 lg:mt-16">
        {/* Desktop: 3 колонки */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4">
          <div className="card p-5 md:p-6 border border-secondary/40 flex items-start gap-3">
            <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div className="text-lg md:text-xl font-semibold text-heading">
              <CountUp
                from={0}
                to={8200}
                separator=" "
                direction="up"
                duration={2}
                className="inline text-ink"
              />+ человек прошли тест
            </div>
          </div>
          <div className="card p-5 md:p-6 border border-secondary/40 flex items-start gap-3">
            <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div className="text-lg md:text-xl font-semibold text-heading">
              <CountUp
                from={0}
                to={92}
                separator=""
                direction="up"
                duration={2}
                className="inline text-ink"
              /><span className="text-ink">%</span> говорят: "Я понял(а) себя лучше"
            </div>
          </div>
          <div className="card p-5 md:p-6 border border-secondary/40 flex items-start gap-3">
            <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div className="text-lg md:text-xl font-semibold text-heading">
              <CountUp
                from={0}
                to={78}
                separator=""
                direction="up"
                duration={2}
                className="inline text-ink"
              /><span className="text-ink">%</span> родителей отмечают, что ребёнок стал увереннее
            </div>
          </div>
        </div>

        {/* Mobile: вертикальный список trust-cards */}
        <div className="sm:hidden space-y-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div className="text-base font-semibold text-heading">
              <CountUp
                from={0}
                to={8200}
                separator=" "
                direction="up"
                duration={2}
                className="inline text-ink"
              />+ человек
              <div className="text-sm font-normal text-muted mt-0.5">прошли тест</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div className="text-base font-semibold text-heading">
              <CountUp
                from={0}
                to={92}
                separator=""
                direction="up"
                duration={2}
                className="inline text-ink"
              /><span className="text-ink">%</span>
              <div className="text-sm font-normal text-muted mt-0.5">говорят: «Я понял(а) себя лучше»</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div className="text-base font-semibold text-heading">
              <CountUp
                from={0}
                to={78}
                separator=""
                direction="up"
                duration={2}
                className="inline text-ink"
              /><span className="text-ink">%</span> родителей
              <div className="text-sm font-normal text-muted mt-0.5">отмечают рост уверенности</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* Who for */}
      <section className="container-balanced mt-12 lg:mt-16">
        <h2 className="text-2xl font-semibold">Кому подойдёт</h2>
        <WhoForCards />
      </section>

      {/* anchors удалены по просьбе пользователя */}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm({ name: '', age: '', gender: '', testType: '', email: '', emailConfirm: '', consent: false });
          setErrors({});
        }}
        hideScrollbar={Object.keys(errors).length === 0}
      >
        <h3 className="text-xl font-semibold mb-4">Перед началом — немного о Вас</h3>
        <div className="grid gap-3">
          <div className="space-y-1">
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-black/10 focus:border-primary'
              } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="Имя"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                clearError('name');
              }}
              onBlur={() => {
                if (!form.name.trim()) {
                  setErrors(prev => ({ ...prev, name: 'Укажите имя' }));
                }
              }}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </motion.p>
            )}
          </div>
          <div className="space-y-1">
            <input
              type="text"
              className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                errors.age 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-black/10 focus:border-primary'
              } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="Возраст"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => {
                setForm({ ...form, age: e.target.value });
                clearError('age');
              }}
              onBlur={() => {
                if (!form.age.trim()) {
                  setErrors(prev => ({ ...prev, age: 'Укажите возраст' }));
                } else {
                  const ageNum = parseInt(form.age, 10);
                  if (isNaN(ageNum) || ageNum < 10 || ageNum > 70) {
                    setErrors(prev => ({ ...prev, age: 'Возраст должен быть от 10 до 70 лет' }));
                  }
                }
              }}
              aria-invalid={Boolean(errors.age)}
            />
            {errors.age && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.age}
              </motion.p>
            )}
          </div>
          <div className="space-y-1">
            <Select
              value={form.gender}
              onChange={(v) => {
                setForm({ ...form, gender: v });
                clearError('gender');
              }}
              placeholder="Ваш пол"
              options={[
                { value: 'Мужской', label: 'Мужской' },
                { value: 'Женский', label: 'Женский' },
              ]}
              error={Boolean(errors.gender)}
            />
            {errors.gender && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.gender}
              </motion.p>
            )}
          </div>
          <div className="space-y-1">
            <input
              type="email"
              className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                errors.email 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-black/10 focus:border-primary'
              } focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="Email (обязательно)"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                clearError('email');
              }}
              onBlur={() => {
                const emailValue = form.email.trim();
                if (!emailValue) {
                  setErrors(prev => ({ ...prev, email: 'Укажите email' }));
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
                  setErrors(prev => ({ ...prev, email: 'Введите корректный email' }));
                }
              }}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </motion.p>
            )}
          </div>
          {!isBasicTest && (
            <div className="space-y-1">
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                  errors.emailConfirm 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-black/10 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Подтвердите email"
                value={form.emailConfirm}
                onChange={(e) => {
                  setForm({ ...form, emailConfirm: e.target.value });
                  clearError('emailConfirm');
                }}
                onBlur={() => {
                  const emailValue = form.email.trim();
                  const emailConfirmValue = form.emailConfirm.trim();
                  if (!emailConfirmValue) {
                    setErrors(prev => ({ ...prev, emailConfirm: 'Повторите email' }));
                  } else if (emailConfirmValue !== emailValue) {
                    setErrors(prev => ({ ...prev, emailConfirm: 'Email не совпадает' }));
                  }
                }}
                aria-invalid={Boolean(errors.emailConfirm)}
              />
              {errors.emailConfirm && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.emailConfirm}
                </motion.p>
              )}
            </div>
          )}
          {!form.testType && (
            <div className="space-y-1">
              <Select
                value={form.testType}
                onChange={(v) => {
                  setForm({ ...form, testType: v });
                  clearError('testType');
                }}
                placeholder="Вид теста"
                options={[
                  { value: 'Базовый', label: 'Базовый' },
                  { value: 'Расширенный', label: 'Расширенный' },
                  { value: 'Premium', label: 'Premium' },
                ]}
                error={Boolean(errors.testType)}
              />
              {errors.testType && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.testType}
                </motion.p>
              )}
            </div>
          )}
          <div className="space-y-1 text-xs text-muted">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => {
                  setForm({ ...form, consent: e.target.checked });
                  clearError('consent');
                }}
                className={`mt-0.5 h-4 w-4 rounded border border-black/20 transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.consent ? 'border-red-500' : ''}`}
                aria-invalid={Boolean(errors.consent)}
              />
              <span>
                Настоящим Вы соглашаетесь с{' '}
                <Link to="/privacy" className="text-heading font-bold hover:underline">
                  Политикой конфиденциальности
                </Link>
                ,{' '}
                <Link to="/terms" className="text-heading font-bold hover:underline">
                  Пользовательским соглашением
                </Link>{' '}
                и <span className="text-heading font-bold">получением рассылок</span>.<br />
              </span>
            </label>
            {errors.consent && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.consent}
              </motion.p>
            )}
          </div>
          <button
            type="button"
            className={`btn btn-primary px-5 py-3 transition ${
              isFormComplete ? '' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={startTest}
          >
            Начать бесплатное тестирование
          </button>
        </div>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <h3 className="text-xl font-semibold mb-4">Пример расширенного отчёта</h3>
        <div className="grid gap-3">
          <div className="card p-4 border border-secondary/40"><div className="text-sm text-muted">Сферы</div><div className="mt-2 font-medium">Технологии и аналитика • Коммуникации</div></div>
          <div className="card p-4 border border-secondary/40"><div className="text-sm text-muted">Сильные стороны</div><div className="mt-2 font-medium">Системное мышление, усидчивость, эмпатия</div></div>
          <div className="card p-4 border border-secondary/40"><div className="text-sm text-muted">Первые шаги</div><div className="mt-2 font-medium">Мини-проект по данным • Введение в UX • Волонтёрство</div></div>
        </div>
      </Modal>
    </div>
  );
}



function ReviewsSection() {
  const [reviews, setReviews] = useState(getReviews());
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 для вперед, -1 для назад

  // Для swipe на мобильных
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 50;

  // Загрузка отзывов при изменении
  useEffect(() => {
    setReviews(getReviews());
  }, [reviewFormOpen]);

  // Автоматическое переключение каждые 4 секунды (зацикленное)
  useEffect(() => {
    if (isPaused || reviews.length === 0) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, reviews.length]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Обработчики для swipe на мобильных
  useEffect(() => {
    if (reviews.length === 0) return;
    
    const cardElement = cardRef.current;
    if (!cardElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current !== null && touchStartY.current !== null) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = Math.abs(touchEndY - touchStartY.current);
      const absDeltaX = Math.abs(deltaX);

      if (absDeltaX > deltaY && absDeltaX > SWIPE_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
        
        if (deltaX > 0) {
          setDirection(-1);
          setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
        } else {
          setDirection(1);
          setCurrentIndex((prev) => (prev + 1) % reviews.length);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    cardElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    cardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    cardElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      cardElement.removeEventListener('touchstart', handleTouchStart);
      cardElement.removeEventListener('touchmove', handleTouchMove);
      cardElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <section className="container-balanced mt-12 lg:mt-16">
        <h2 className="text-2xl font-semibold mb-6">Отзывы</h2>
        <div className="card p-8 text-center">
          <p className="text-muted mb-6">Пока нет отзывов</p>
          <button
            onClick={() => setReviewFormOpen(true)}
            className="px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
          >
            Оставить отзыв
          </button>
        </div>
        <ReviewForm
          open={reviewFormOpen}
          onClose={() => setReviewFormOpen(false)}
          onSuccess={() => {
            setReviews(getReviews());
            setCurrentIndex(0);
          }}
        />
      </section>
    );
  }

  return (
    <section className="container-balanced mt-12 lg:mt-16">
      <h2 className="text-2xl font-semibold mb-6">Отзывы</h2>
      
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Стрелка влево - только на desktop */}
        <button
          onClick={goToPrev}
          className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-card rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:bg-primary hover:text-white text-heading border border-secondary"
          aria-label="Предыдущий отзыв"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Слайдер */}
        <div className="overflow-hidden">
          {reviews.length > 0 && reviews[currentIndex] && (
            <motion.div
              key={currentIndex}
              ref={cardRef}
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="card p-4 sm:p-6 md:p-8 min-h-[200px] sm:min-h-0"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-heading">{reviews[currentIndex].name}</h3>
                <span className="text-xs text-muted">{reviews[currentIndex].date}</span>
              </div>
              <p className="text-sm sm:text-base text-ink leading-relaxed line-clamp-3 sm:line-clamp-none">{reviews[currentIndex].text}</p>
            </motion.div>
          )}
        </div>

        {/* Стрелка вправо - только на desktop */}
        <button
          onClick={goToNext}
          className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-card rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:bg-primary hover:text-white text-heading border border-secondary"
          aria-label="Следующий отзыв"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Индикаторы */}
        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-secondary hover:bg-primary/50'
              }`}
              aria-label={`Перейти к отзыву ${index + 1}`}
            />
          ))}
        </div>

        {/* Кнопка "Оставить отзыв" - на всю ширину на мобильных */}
        <div className="flex justify-center mt-6 sm:mt-8">
          <button
            onClick={() => setReviewFormOpen(true)}
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] sm:min-h-0 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
          >
            Оставить отзыв
          </button>
        </div>
      </div>

      <ReviewForm
        open={reviewFormOpen}
        onClose={() => setReviewFormOpen(false)}
        onSuccess={() => {
          setReviews(getReviews());
          setCurrentIndex(0);
        }}
      />
    </section>
  );
}

function WhoForCards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
      {/* 1. Ученикам старших классов */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
      >
        {/* Иллюстрация */}
        <div className="flex items-start justify-center h-[180px] mb-3 sm:mb-4 relative">
          <img
            src="/komu/okushylar.png"
            alt=""
            className="h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-blue-400/60" />
          <Sparkles className="absolute top-2 left-1 sm:top-4 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-blue-300/50" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3">Ученикам старших классов</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4">
          Когда ты стоишь на пороге выбора — важно увидеть себя не через оценки, а через склонности.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Здесь ты находишь направление, в котором чувствуешь себя естественно.
        </p>
        
        <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
          <li>понять своё направление перед выбором вуза</li>
          <li>сверить интересы с реальными склонностями</li>
          <li>выбрать среду, где учёба будет естественной</li>
        </ul>
      </motion.div>

      {/* 2. Студентам */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
      >
        {/* Иллюстрация */}
        <div className="flex items-start justify-center h-[140px] sm:h-[180px] mb-3 sm:mb-4 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-emerald-200/30 blur-xl rounded-full w-20 h-20 sm:w-32 sm:h-32 transform translate-x-1 translate-y-1 sm:translate-x-2 sm:translate-y-2"></div>
          </div>
          <img
            src="/komu/students.png"
            alt=""
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top relative z-10"
            loading="lazy"
          />
          {/* Элементы роста - только на desktop */}
          <Sparkles className="hidden sm:block absolute bottom-2 right-2 w-4 h-4 text-emerald-400/50 z-10" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3">Студентам</h3>
        
        {/* Desktop: полный текст */}
        <p className="hidden sm:block text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4">
          В университете нет "правильного пути" — есть твой формат, твой темп роста.
          <br />
          <br />
          Наш профиль показывает, как раскрыться в реальной практике.
        </p>
        
        {/* Mobile: только буллеты */}
        <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
          <li>уточнить специализацию и карьерный трек</li>
          <li>понять, в какой практике вы раскроетесь лучше</li>
          <li>скорректировать учебную траекторию</li>
        </ul>
      </motion.div>

      {/* 3. Родителям подростков */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
      >
        {/* Иллюстрация */}
        <div className="flex items-start justify-center h-[140px] sm:h-[180px] mb-3 sm:mb-4 relative">
          <img
            src="/komu/parents.png"
            alt=""
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-amber-400/50" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3">Родителям подростков</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4">
          Подростковый возраст — это поиск своего голоса.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Профиль помогает родителям увидеть сильные стороны ребёнка и говорить с ним на одном языке.
        </p>
        
        <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 list-disc list-inside">
          <li>глубже понять характер и мышление ребёнка</li>
          <li>увидеть, как с ним говорить и мотивировать</li>
          <li>найти баланс между поддержкой и свободой</li>
        </ul>
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Поддержка семьи — основа роста"</p>
          </div>
        </div>
      </motion.div>

      {/* 4. Взрослым */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 bg-base border border-secondary/40 rounded-xl sm:rounded-2xl overflow-hidden relative flex flex-col"
      >
        {/* Иллюстрация */}
        <div className="flex items-start justify-center h-[140px] sm:h-[180px] mb-3 sm:mb-4 relative">
          <img
            src="/komu/vzroslym.png"
            alt=""
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-primary/40" />
          <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-primary/30" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Взрослым</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
          Порой мы оказываемся "не на своём месте" не потому, что ошиблись,
          а потому что пришло время обновиться.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Профиль помогает взрослому увидеть, где его энергия естественна.
        </p>
        
        <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 list-disc list-inside">
          <li>переосмыслить профессию, если "не на своём месте"</li>
          <li>понять, где комфортнее реализовывать себя</li>
          <li>восстановить ясность в том, чего вы хотите</li>
        </ul>
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Обновление — это не отказ от прошлого, а возврат к себе"</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FormIcon() {
  return <FileText className="w-7 h-7 text-secondary" strokeWidth={1.5} />;
}
function QuestionsIcon() {
  return <HelpCircle className="w-7 h-7 text-secondary" strokeWidth={1.5} />;
}
function ResultIcon() {
  return <CheckSquare className="w-7 h-7 text-secondary" strokeWidth={1.5} />;
}
function UsersIcon() {
  return <Users className="w-7 h-7 text-secondary" strokeWidth={1.5} />;
}
function StarIcon() {
  return <Star className="w-7 h-7 text-secondary" strokeWidth={1.5} />;
}
