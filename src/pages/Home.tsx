import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check, FileText, HelpCircle, CheckSquare, Users, Star, GraduationCap, Briefcase, Target, Lightbulb, Heart, Sparkles, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import Modal from '../components/Modal';
import Select from '../components/Select';
import CountUp from '../components/CountUp';
import ReviewForm from '../components/ReviewForm';
import IntroOverlay from '../components/IntroOverlay';
import { getReviews } from '../utils/reviewsStorage';
import { useLenis } from '../contexts/LenisContext';
import { scrollLockManager } from '../utils/scrollLock';
import { useAutoSlider } from '../hooks/useAutoSlider';
import { useSwiperAutoSlider } from '../hooks/useSwiperAutoSlider';
import { logger } from '../utils/logger';

type FormErrorKey = 'name' | 'age' | 'gender' | 'testType' | 'email' | 'emailConfirm' | 'parentEmail' | 'parentEmailConfirm' | 'consent';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState<'free'|'pro'|null>(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', testType: '', email: '', emailConfirm: '', parentEmail: '', parentEmailConfirm: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  // Состояния для accordion-карточек на мобильных
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [premiumSlideIndex, setPremiumSlideIndex] = useState(0); // 0 - подросток, 1 - родитель
  
  // Ref для мобильной версии уровней навигации
  const levelsMobileRef = useRef<HTMLDivElement>(null);
  const SLIDE_COUNT = 3;
  
  // Определяем, мобильное ли устройство
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1023;
  });
  
  // Отслеживаем изменение размера окна
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1023);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Используем хук автопрокрутки для мобильной версии
  const { currentIndex, goToSlide, pause, isPaused } = useAutoSlider({
    enabled: isMobile,
    intervalMs: 2000,
    pauseMs: 20000,
    visibilityThreshold: 0.65,
    containerRef: levelsMobileRef,
    slideCount: SLIDE_COUNT,
  });
  
  // Обработчик раскрытия mobile-extra блока
  const handleMobileExtraToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget.closest('.card');
    if (card) {
      card.classList.toggle('is-open');
    }
  };
  
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();


  // Принудительный пересчёт layout при загрузке страницы для мобильных устройств
  useEffect(() => {
    // Флаг для предотвращения рекурсии
    let isResizing = false;
    const timers: NodeJS.Timeout[] = [];

    // Триггерим resize для пересчёта размеров всех компонентов
    const triggerResize = () => {
      if (isResizing) return;
      isResizing = true;
      window.dispatchEvent(new Event('resize'));
      const timer = setTimeout(() => {
        isResizing = false;
      }, 100);
      timers.push(timer);
    };

    // Выполняем после полной загрузки страницы
    if (document.readyState === 'complete') {
      timers.push(setTimeout(triggerResize, 100));
      timers.push(setTimeout(triggerResize, 300));
    } else {
      const loadHandler = () => {
        timers.push(setTimeout(triggerResize, 100));
        timers.push(setTimeout(triggerResize, 300));
      };
      window.addEventListener('load', loadHandler, { once: true });
    }

    // Также триггерим при изменении ориентации
    const handleOrientationChange = () => {
      // Увеличиваем задержку для корректного определения размеров после поворота
      timers.push(setTimeout(triggerResize, 200));
      timers.push(setTimeout(triggerResize, 400));
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Дополнительная обработка через resize для более точного определения
    const handleResize = () => {
      triggerResize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      // Очищаем все таймеры
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  const trimmedEmail = form.email.trim();
  const trimmedEmailConfirm = form.emailConfirm.trim();
  const trimmedParentEmail = form.parentEmail.trim();
  const trimmedParentEmailConfirm = form.parentEmailConfirm.trim();
  const isBasicTest = plan === 'free' || form.testType === 'Первичное понимание';
  const isPremiumTest = form.testType === 'Семейная навигация';
  const emailsMatch = trimmedEmail && trimmedEmailConfirm && trimmedEmail === trimmedEmailConfirm;
  const parentEmailsMatch = trimmedParentEmail && trimmedParentEmailConfirm && trimmedParentEmail === trimmedParentEmailConfirm;
  const isFormComplete = Boolean(
    form.name.trim() &&
    form.age.trim() &&
    form.gender &&
    form.testType &&
    trimmedEmail &&
    (isBasicTest || (trimmedEmailConfirm && emailsMatch)) &&
    (!isPremiumTest || (trimmedParentEmail && trimmedParentEmailConfirm && parentEmailsMatch)) &&
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

  const openFor = (p: 'free'|'pro'|null, testTypeValue?: string) => {
    setPlan(p);
    // Сбрасываем форму и ошибки при открытии
    setForm({ name: '', age: '', gender: '', testType: testTypeValue || '', email: '', emailConfirm: '', parentEmail: '', parentEmailConfirm: '', consent: false });
    setErrors({});
    setModalOpen(true);
  };

  // Функция для скролла к блоку "Уровни навигации"
  const scrollToFormats = () => {
    const formatsSection = document.getElementById('formats');
    if (formatsSection && lenis) {
      lenis.scrollTo(formatsSection, { offset: -80, duration: 1.2 });
    } else if (formatsSection) {
      formatsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // Быстрый переход к FREE тесту без заполнения формы
  const startTestQuick = () => {
    // Запрашиваем возраст у пользователя
    const ageInput = prompt('Введите возраст (от 12 до 70):');
    
    if (!ageInput) {
      return; // Пользователь отменил ввод
    }
    
    const ageNum = parseInt(ageInput.trim(), 10);
    
    // Валидация возраста для FREE теста
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
      alert('Возраст должен быть от 12 до 70 лет');
      return;
    }
    
    // Определяем возрастную группу для FREE теста
    let ageGroup: '12-17' | '18-20' | '21+';
    if (ageNum >= 12 && ageNum <= 17) {
      ageGroup = '12-17';
    } else if (ageNum >= 18 && ageNum <= 20) {
      ageGroup = '18-20';
    } else {
      ageGroup = '21+';
    }
    
    // Устанавливаем тестовые данные для FREE теста
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      plan: 'free',
      name: 'Тестовый пользователь',
      ageGroup: ageGroup,
      gender: 'male',
      testType: 'Первичное понимание',
      email: 'test@test.com'
    }));
    navigate('/test');
  };

  const startTestQuickExtended = () => {
    // Запрашиваем возраст у пользователя
    const ageInput = prompt('Введите возраст (от 12 до 70):');
    
    if (!ageInput) {
      return; // Пользователь отменил ввод
    }
    
    const ageNum = parseInt(ageInput.trim(), 10);
    
    // Валидация возраста для VIP теста
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
      alert('Возраст должен быть от 12 до 70 лет');
      return;
    }
    
    // Определяем возрастную группу для VIP теста
    let ageGroup: '12-17' | '18-20' | '21+';
    if (ageNum >= 12 && ageNum <= 17) {
      ageGroup = '12-17';
    } else if (ageNum >= 18 && ageNum <= 20) {
      ageGroup = '18-20';
    } else {
      ageGroup = '21+';
    }
    
    // Устанавливаем тестовые данные для EXTENDED теста
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      plan: 'extended',
      name: 'Тестовый пользователь',
      ageGroup: ageGroup,
      gender: 'male',
      testType: 'Персональный разбор',
      email: 'test@test.com'
    }));
    navigate('/test');
  };

  const startTestQuickPremium = () => {
    // Запрашиваем возраст у пользователя
    const ageInput = prompt('Введите возраст (от 12 до 70):');
    
    if (!ageInput) {
      return; // Пользователь отменил ввод
    }
    
    const ageNum = parseInt(ageInput.trim(), 10);
    
    // Валидация возраста для VIP теста
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 70) {
      alert('Возраст должен быть от 12 до 70 лет');
      return;
    }
    
    // Определяем возрастную группу для VIP теста
    let ageGroup: '12-17' | '18-20' | '21+';
    if (ageNum >= 12 && ageNum <= 17) {
      ageGroup = '12-17';
    } else if (ageNum >= 18 && ageNum <= 20) {
      ageGroup = '18-20';
    } else {
      ageGroup = '21+';
    }
    
    // Устанавливаем тестовые данные для PREMIUM теста
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      plan: 'premium',
      name: 'Тестовый пользователь',
      ageGroup: ageGroup,
      gender: 'male',
      testType: 'Семейная навигация',
      email: 'test@test.com'
    }));
    navigate('/test');
  };
  // END TEMPORARY TESTING

  const startTest = () => {
    const emailValue = form.email.trim();
    const emailConfirmValue = form.emailConfirm.trim();
    const parentEmailValue = form.parentEmail.trim();
    const parentEmailConfirmValue = form.parentEmailConfirm.trim();
    const isBasicTest = plan === 'free' || form.testType === 'Первичное понимание';
    const isPremiumTest = form.testType === 'Семейная навигация';
    const newErrors: Partial<Record<FormErrorKey, string>> = {};

    if (!form.name.trim()) newErrors.name = 'Укажите имя';
    
    // Валидация возраста (10-70)
    if (!form.age.trim()) {
      newErrors.age = 'Укажите возраст';
    } else {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 45) {
        newErrors.age = 'Возраст должен быть от 13 до 45 лет';
      }
    }
    
    if (!form.gender) newErrors.gender = 'Выберите пол';
    if (!form.testType) newErrors.testType = 'Выберите навигацию';
    
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
    
    // Email родителя только для Premium теста
    if (isPremiumTest) {
      if (!parentEmailValue) {
        newErrors.parentEmail = 'Укажите email родителя';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmailValue)) {
        newErrors.parentEmail = 'Введите корректный email';
      }
      
      if (!parentEmailConfirmValue) {
        newErrors.parentEmailConfirm = 'Повторите email родителя';
      } else if (parentEmailConfirmValue !== parentEmailValue) {
        newErrors.parentEmailConfirm = 'Email родителя не совпадает';
      }
    }
    
    if (!form.consent) newErrors.consent = 'Необходимо подтвердить согласие';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Определяем plan на основе testType
    let finalPlan: 'free' | 'extended' | 'premium';
    if (form.testType === 'Первичное понимание') {
      finalPlan = 'free';
    } else if (form.testType === 'Персональный разбор') {
      finalPlan = 'extended';
    } else if (form.testType === 'Семейная навигация') {
      finalPlan = 'premium';
    } else {
      // Fallback: используем plan из state или по умолчанию 'free'
      finalPlan = plan === 'pro' ? 'extended' : 'free';
    }
    
    // Преобразуем возраст в возрастную группу
    const ageNum = parseInt(form.age, 10);
    let ageGroup: string;
    
    // Для всех тестов (FREE, EXTENDED, PREMIUM) используем одинаковые возрастные группы
    if (ageNum >= 12 && ageNum <= 17) {
      ageGroup = '12-17';
    } else if (ageNum >= 18 && ageNum <= 20) {
      ageGroup = '18-20';
    } else {
      ageGroup = '21+';
    }
    
    const { emailConfirm, parentEmailConfirm, age, ...formWithoutConfirm } = form;
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      ...formWithoutConfirm, 
      email: emailValue, 
      parentEmail: isPremiumTest ? parentEmailValue : undefined,
      ageGroup, // Сохраняем возрастную группу вместо возраста
      plan: finalPlan 
    }));
    navigate('/test');
  };

  return (
    <div>
      {/* Hero */}
      <section 
        id="hero"
        data-section="hero"
        className="hero-section relative md:h-auto md:min-h-0 lg:min-h-[80vh] flex flex-col items-center justify-start lg:pt-8 bg-transparent"
      >

        {/* Мобильная версия - Full Viewport Hero */}
        <div className="lg:hidden w-full md:h-auto md:min-h-0 flex flex-col relative z-10">
          {/* Action-Oriented Hero */}
          <div className="flex flex-col items-center px-4 relative hero-mobile-content">
              {/* Фон с логотипом для мобильной версии */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-10 hero-mobile-logo"
                style={{
                  backgroundImage: 'url(/logomain.png)',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center top',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              
              {/* Абстрактный эмоциональный фон - мягкое пятно с градиентом */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(
                      156% 78% at 50% 20%,
                      rgba(201, 162, 77, 0.12),
                      transparent 60%
                    )
                  `
                }}
              />
              
              {/* Лёгкий шум/текстура для глубины */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  backgroundSize: '260px 260px'
                }}
              />

              {/* Контент - вертикально центрирован с ограничением ширины */}
              <div className="relative z-10 w-full max-w-[680px] mx-auto flex flex-col items-center px-4">
                {/* Заголовок - такой же как на desktop */}
                <motion.h1
                  className="text-3xl sm:text-4xl font-semibold text-heading text-center leading-tight mb-4"
                  style={{ textWrap: 'balance' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                >
                  <span className="block">Характер — это система.</span>
                  <span className="block">Когда понимаешь систему, начинаешь управлять.</span>
                </motion.h1>

                {/* Описание - такое же как на desktop */}
                <motion.p
                  className="text-base sm:text-lg text-muted text-center leading-relaxed mb-8 max-w-[560px]"
                  style={{ textWrap: 'balance' }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                >
                  Навигационная система для понимания мышления, решений и поведения в реальной жизни.
                </motion.p>

                {/* Primary CTA - две кнопки */}
                <motion.div
                  className="w-full flex flex-col gap-4 hero-cta-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                >
                  <div className="flex flex-col w-full hero-primary-buttons">
                    <div className="flex gap-2 w-full hero-buttons-row">
                      <button 
                        className="btn btn-primary w-full px-4 py-3 text-center text-sm font-semibold rounded-lg transition-all duration-300 min-h-[44px] shadow-md hover:shadow-lg hero-primary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFor('free');
                        }}
                      >
                        Начать с первичного понимания
                      </button>
                    </div>
                    <span className="text-xs text-muted mt-1.5 text-center hero-free-label">Бесплатно</span>
                  </div>
                  
                  <div className="flex flex-col w-full hero-secondary-buttons">
                    <button 
                      className="btn btn-ghost px-4 py-3 text-center text-sm font-semibold rounded-lg transition-all duration-300 w-full min-h-[44px] hero-ghost-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToFormats();
                      }}
                    >
                     Уровни навигации
                    </button>
                    <span className="text-xs text-muted mt-1.5 text-center hero-format-label">Выбери формат, который подходит под твою задачу</span>
                  </div>
                  
                </motion.div>
              </div>
            </div>
        </div>

        {/* Desktop версия */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start w-full container-balanced relative z-10 pt-4 lg:pt-6">
          {/* Решение */}
          <div className="w-full">
            <div className="relative w-full">
              <div className="grid lg:grid-cols-2 items-center gap-8 w-full">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4">
                  <span className="block">Характер — это система.</span>
                  <span className="block">Когда понимаешь систему, начинаешь управлять.</span>
                </h1>
                <p className="mt-4 text-muted text-lg mb-6">
            Навигационная система для понимания мышления, решений и поведения в реальной жизни.
            </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col">
                    <button 
                      className="btn btn-primary px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" 
                      onClick={() => openFor('free')}
                    >
                      Начать с первичного понимания
                    </button>
                    <span className="text-sm text-muted mt-1 text-center">Бесплатно</span>
                  </div>
                  <div className="flex flex-col">
                    <button 
                      className="btn btn-ghost px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" 
                      onClick={scrollToFormats}
                    >
                      Уровни навигации
                    </button>
                    <span className="text-sm text-muted mt-1 text-center">Выбери формат, который подходит под твою задачу</span>
                  </div>
            </div>
              </motion.div>
              <div className="flex items-center justify-center relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="rounded-2xl overflow-visible flex items-center justify-center">
                    <img 
                      src="/LOGO W TEXT AND BG HERO.png" 
                      alt="Логотип PROFILEVELUP" 
                      className="w-[91%] h-[91%] max-w-[520px] max-h-[520px] object-contain" 
                      loading="lazy" 
                    />
          </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Остальной контент */}
      <>
      {/* Визуальное разделение между Hero и следующей секцией - только на мобильных */}
      <div className="lg:hidden relative">
        {/* Мягкий градиентный переход для четкого окончания hero */}
        <div className="h-12 bg-gradient-to-b from-base via-base/97 to-base" />
        {/* Тонкая декоративная линия */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>

      {/* Formats */}
          <section id="formats" className="container-balanced pt-2 pb-8 md:pt-6 lg:pt-4 lg:pb-12">
            <div className="relative mb-4 sm:mb-5 lg:mb-6">
              {/* Заголовок */}
              <div className="relative flex flex-col items-center lg:items-start">
                <h2 className="text-2xl sm:text-3xl font-semibold text-heading relative z-10">Уровни навигации</h2>
                {/* Подзаголовок скрыт на мобильных, так как он теперь в каждой карточке Swiper */}
                <p className="hidden lg:block text-sm sm:text-base text-muted mt-2">От первого понимания — к глубокой работе с собой и отношениями</p>
              </div>
            </div>
            
            {/* Декоративные метки над карточками - Desktop */}
            <div className="hidden lg:grid grid-cols-3 gap-6 mb-3">
              <div className="flex flex-col items-center">
                <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
                <div className="text-sm font-semibold text-primary">Старт</div>
                <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
                <div className="text-sm font-semibold text-primary">Глубина</div>
                <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
                <div className="text-sm font-semibold text-primary">Семья</div>
                <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
              </div>
            </div>
            
            {/* Desktop версия - grid */}
            <div className="levels-desktop hidden lg:grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Первичное понимание */}
          <div 
            className={`card flex flex-col shadow-md bg-white order-1 transition-all duration-300
            ${expandedCard === 'basic' ? 'shadow-lg bg-base/30' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:cursor-pointer`}
            onClick={() => openFor('free', 'Первичное понимание')}
          >
            {/* Desktop версия - ТОЛЬКО для desktop */}
            <div className="hidden lg:flex flex-col h-full justify-between group">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/basic.png"
                    alt="Иконка тарифа Basic"
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 relative">
                    <h3 className="text-xl font-semibold text-heading mb-1">Первичное понимание</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                    Бесплатно
                  </span>
                </div>
                <p className="text-sm text-muted mb-4 leading-relaxed">
                  Точка входа в систему навигации.<br/>
                  Помогает увидеть свой базовый стиль мышления и решений — без ярлыков и оценок.
                </p>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Понимание, как ты обычно думаешь и принимаешь решения</li>
                    <li>Где твои сильные стороны сейчас</li>
                    <li>В каких форматах тебе легче действовать и развиваться</li>
                    <li>Подходит ли тебе этот формат глубокой навигации</li>
                  </ul>
                </div>
                <p className="text-sm text-muted italic mb-8">
                  Это не мотивация и не психология.<br/>
                  Это первая карта: где ты сейчас и как ты устроен.
                </p>
              </div>
              <div className="mt-auto">
                <button
                  className="w-full px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('free', 'Первичное понимание');
                  }}
                >
                   Получить первичное понимание
                </button>
              </div>
            </div>

          </div>

          {/* Персональный разбор */}
          <div 
            className={`card flex flex-col border-2 border-primary/20 rounded-2xl shadow-md bg-gradient-to-b from-primary/5 to-white order-2 transition-all duration-300 relative
            ${expandedCard === 'extended' ? 'shadow-lg bg-base/30' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:hover:border-primary/40 lg:cursor-pointer`}
            onClick={() => openFor('pro', 'Персональный разбор')}
          >
            {/* Desktop версия */}
            <div className="hidden lg:flex flex-col h-full justify-between group">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/vip.png"
                    alt="Иконка тарифа VIP"
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 relative">
                    <h3 className="text-xl font-semibold text-heading mb-1">Персональный разбор</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                    14 990 ₸
                  </span>
                </div>
                <p className="text-sm text-muted mb-4 leading-relaxed">
                  Персональная инструкция к твоему характеру, мышлению и стилю жизни.
                </p>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Как ты думаешь, выбираешь и реагируешь</li>
                    <li>Где твоя настоящая сила и где ты теряешь энергию</li>
                    <li>Почему одни среды тебя усиливают, а другие выжигают</li>
                    <li>В каких форматах тебе легче добиваться результата</li>
                    <li>Как выстраивать решения, обучение, работу и отношения под свой стиль</li>
                  </ul>
                </div>
                <p className="text-sm text-muted italic mb-8">
                  Это не типология и не приговор.<br/>
                  Это навигационная система под твою реальную жизнь.
                </p>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  openFor('pro', 'Персональный разбор');
                }}
              >
                 Получить персональный разбор
              </button>
            </div>

            {/* Старая мобильная версия - accordion (ПОЛНОСТЬЮ СКРЫТА, используется только новый свайпер) */}
            <div 
              className="hidden"
              aria-hidden="true"
              style={{ display: 'none !important' }}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('button')) return;
                const subtitle = e.currentTarget.querySelector('.subtitle-tooltip') as HTMLElement;
                if (subtitle) {
                  subtitle.classList.toggle('opacity-100');
                  subtitle.classList.toggle('opacity-0');
                }
              }}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <img src="/komu/vip.png" alt="Иконка тарифа VIP" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="lazy" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Название + цена в одной строке */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 relative">
                      <div className="subtitle-tooltip absolute bottom-full left-0 mb-2 opacity-0 transition-all duration-300 z-30 pointer-events-none">
                        <div className="bg-white border-2 border-primary/30 rounded-xl shadow-2xl px-4 py-3 min-w-[240px] max-w-[280px] relative">
                          <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/30 rotate-45"></div>
                          <p className="text-sm font-medium text-heading leading-relaxed">
                            Глубокое понимание себя и своих особенностей
                          </p>
                        </div>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-heading">
                        Персональный разбор
                      </h3>
                    </div>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white font-bold text-sm sm:text-base rounded-lg whitespace-nowrap flex-shrink-0 shadow-md">
                      14 990 ₸
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA с анимированной стрелкой */}
              <button
                onClick={() => setExpandedCard(expandedCard === 'extended' ? null : 'extended')}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
              >
                <span className="text-sm font-semibold">Подробнее</span>
                <motion.div
                  animate={{ rotate: expandedCard === 'extended' ? 90 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              </button>

              {/* Развернутое состояние - полный список */}
              <motion.div
                initial={false}
                animate={{
                  maxHeight: expandedCard === 'extended' ? 1500 : 0,
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
                    <li>Расширенный тест</li>
                    <li>Персональный навигационный отчёт (5–6 страниц, PDF)</li>
                    <li>Как ты думаешь, принимаешь решения и реагируешь</li>
                    <li>Твои сильные стороны и зоны роста</li>
                    <li>Среды и форматы, где тебе легче быть собой</li>
                    <li>Рекомендации по развитию и взаимодействию с другими</li>
                  </ul>
                </div>
              </motion.div>

              {/* CTA кнопка - единственный главный CTA */}
              {expandedCard === 'extended' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('pro', 'Персональный разбор');
                  }}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Получить личный разбор
                </button>
              )}
            </div>
          </div>

          {/* Семейная навигация */}
          <div 
            className={`card flex flex-col rounded-2xl shadow-xl bg-card-recommend order-3 transition-all duration-300 relative
            ${expandedCard === 'premium' ? 'shadow-lg' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-2xl lg:hover:-translate-y-1 lg:cursor-pointer lg:border-2 lg:border-primary lg:hover:border-primary-hover`}
            onClick={() => openFor('pro', 'Семейная навигация')}
          >
            {/* Баннер сверху - только для mobile */}
            <div className="lg:hidden absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1.5 rounded-lg shadow-md z-10">
              <p className="text-xs font-semibold whitespace-nowrap">Для родителей</p>
            </div>
            
            {/* Desktop версия */}
            <div className="hidden lg:flex flex-col h-full justify-between group">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/PREMIUM .png"
                    alt="Иконка тарифа Premium"
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 relative">
                    <h3 className="text-xl font-semibold text-heading mb-1">Семейная навигация</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                    34 990 ₸
                  </span>
                </div>
                
                <p className="text-sm text-muted mb-4 leading-relaxed italic">
                  Чтобы подросток понял себя, а родитель — понял своего ребёнка
                </p>

                {/* Слайдер с переключателями */}
                <div className="mt-4">
                  {/* Кнопки переключения */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumSlideIndex(0);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        premiumSlideIndex === 0
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary/10 text-heading hover:bg-primary/20'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Подросток
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumSlideIndex(1);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        premiumSlideIndex === 1
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary/10 text-heading hover:bg-primary/20'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      Родитель
                    </button>
                  </div>

                  {/* Контейнер слайдера */}
                  <div className="relative overflow-hidden rounded-lg">
                    <motion.div
                      className="flex"
                      animate={{ x: `-${premiumSlideIndex * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      {/* Слайд 1: Что получает подросток */}
                      <div className="min-w-full bg-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Что получает подросток
                        </h4>
                        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                          <li>Понимание своего характера, сильных сторон и особенностей</li>
                          <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                          <li>Как он думает, принимает решения и реагирует на давление</li>
                          <li>Навигационный компас вместо оценок и ярлыков</li>
                        </ul>
                      </div>

                      {/* Слайд 2: Что получает родитель */}
                      <div className="min-w-full bg-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" />
                          Что получает родитель
                        </h4>
                        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                          <li>Персональную карту психологии ребёнка</li>
                          <li>Как ребёнок думает, чувствует и воспринимает мир</li>
                          <li>Как с ним лучше общаться без конфликтов</li>
                          <li>Какие слова поддерживают, а какие вызывают сопротивление</li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                <p className="text-sm text-muted mt-4 italic mb-8">
                  Это не про «воспитание».<br/>
                  Это про язык понимания.
                </p>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  openFor('pro', 'Семейная навигация');
                }}
              >
                 Начать семейную навигацию
              </button>
            </div>

            {/* Старая мобильная версия - accordion (ПОЛНОСТЬЮ СКРЫТА, используется только новый свайпер) */}
            <div 
              className="hidden"
              aria-hidden="true"
              style={{ display: 'none !important' }}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('button')) return;
                const subtitle = e.currentTarget.querySelector('.subtitle-tooltip') as HTMLElement;
                if (subtitle) {
                  subtitle.classList.toggle('opacity-100');
                  subtitle.classList.toggle('opacity-0');
                }
              }}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-lg flex items-center justify-center">
                  <img src="/komu/PREMIUM .png" alt="Иконка тарифа Premium" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="lazy" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Название + цена в одной строке */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 relative">
                      <div className="subtitle-tooltip absolute bottom-full left-0 mb-2 opacity-0 transition-all duration-300 z-30 pointer-events-none">
                        <div className="bg-white border-2 border-primary/30 rounded-xl shadow-2xl px-4 py-3 min-w-[240px] max-w-[280px] relative">
                          <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/30 rotate-45"></div>
                          <p className="text-sm font-medium text-heading leading-relaxed">
                            Чтобы подросток понял себя, а родитель — понял своего ребёнка
                          </p>
                        </div>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-heading">
                        Семейная навигация
                      </h3>
                    </div>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white font-bold text-sm sm:text-base rounded-lg whitespace-nowrap flex-shrink-0 shadow-md">
                      34 990 ₸
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA с анимированной стрелкой */}
              <button
                onClick={() => setExpandedCard(expandedCard === 'premium' ? null : 'premium')}
                className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
              >
                <span className="text-sm font-semibold">Подробнее</span>
                <motion.div
                  animate={{ rotate: expandedCard === 'premium' ? 90 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              </button>

              {/* Развернутое состояние - слайдер */}
              <motion.div
                initial={false}
                animate={{
                  maxHeight: expandedCard === 'premium' ? 2000 : 0,
                  opacity: expandedCard === 'premium' ? 1 : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ overflow: 'hidden' }}
              >
                <div className="pt-3 pb-2">
                  {/* Кнопки переключения для мобильной версии */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumSlideIndex(0);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        premiumSlideIndex === 0
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary/10 text-heading hover:bg-primary/20'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Подросток
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumSlideIndex(1);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        premiumSlideIndex === 1
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary/10 text-heading hover:bg-primary/20'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Родитель
                    </button>
                  </div>

                  {/* Контейнер слайдера для мобильной версии */}
                  <div className="relative overflow-hidden rounded-lg">
                    <motion.div
                      className="flex"
                      animate={{ x: `-${premiumSlideIndex * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      {/* Слайд 1: Что получает подросток */}
                      <div className="min-w-full bg-primary/10 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Что получает подросток
                        </h4>
                        <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                          <li>Расширенный тест</li>
                          <li>Личный навигационный отчёт</li>
                          <li>Понимание своего характера, сильных сторон и особенностей</li>
                          <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                          <li>Навигационный «компас», а не оценка и не приговор</li>
                        </ul>
                      </div>

                      {/* Слайд 2: Что получает родитель */}
                      <div className="min-w-full bg-primary/10 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" />
                          Что получает родитель
                        </h4>
                        <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                          <li>Отдельный персональный отчёт о ребёнке (PDF)</li>
                          <li>Как ребёнок чувствует, думает и воспринимает мир</li>
                          <li>Как с ним лучше общаться, чтобы поддерживать, а не давить</li>
                          <li>Какие слова и подходы мотивируют, а какие вызывают сопротивление</li>
                          <li>На что можно опираться в диалоге, а где лучше снизить давление</li>
                  </ul>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* CTA кнопка - единственный главный CTA */}
              {expandedCard === 'premium' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('pro', 'Семейная навигация');
                  }}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Начать семейную навигацию
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile версия - CSS Scroll Snap */}
        <div ref={levelsMobileRef} className="levels-mobile lg:hidden w-full">
          <div className="levels-mobile-scroll">
            {/* Карточка 1: Первичное понимание */}
            <div className="level-card-snap">
              {/* Декоративная метка над карточкой */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
                <div className="text-sm font-semibold text-primary">Старт</div>
                <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
              </div>
              <div 
                className="level-card-mobile bg-white rounded-2xl shadow-md p-6 flex flex-col h-full w-full cursor-pointer"
                onClick={() => openFor('free', 'Первичное понимание')}
              >
                {/* Иллюстрация */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/komu/basic.png"
                    alt="Иконка тарифа Basic"
                    className="h-32 opacity-90 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                
                {/* Заголовок и цена */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-heading flex-1">Первичное понимание</h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                    Бесплатно
                  </span>
                </div>
                
                {/* Описание */}
                <p className="text-sm text-muted mb-4 leading-relaxed">
                  Точка входа в систему навигации.<br/>
                  Помогает увидеть свой базовый стиль мышления и решений — без ярлыков и оценок.
                </p>
                
                {/* Список пунктов */}
                <div className="mb-4 flex-1">
                  <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Понимание, как ты обычно думаешь и принимаешь решения</li>
                    <li>Где твои сильные стороны сейчас</li>
                    <li>В каких форматах тебе легче действовать и развиваться</li>
                    <li>Подходит ли тебе этот формат глубокой навигации</li>
                  </ul>
                </div>
                
                <p className="text-sm text-muted italic mb-4">
                  Это не мотивация и не психология.<br/>
                  Это первая карта: где ты сейчас и как ты устроен.
                </p>
                
                {/* Кнопка */}
                <button
                  className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('free', 'Первичное понимание');
                  }}
                >
                   Получить первичное понимание
                </button>
              </div>
            </div>

            {/* Карточка 2: Персональный разбор */}
            <div className="level-card-snap">
              {/* Декоративная метка над карточкой */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
                <div className="text-sm font-semibold text-primary">Глубина</div>
                <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
              </div>
              <div 
                className="level-card-mobile bg-white rounded-2xl shadow-md border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-white p-6 flex flex-col h-full w-full cursor-pointer"
                onClick={() => openFor('pro', 'Персональный разбор')}
              >
                {/* Иллюстрация */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/komu/vip.png"
                    alt="Иконка тарифа VIP"
                    className="h-32 opacity-90 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                
                {/* Заголовок и цена */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-heading flex-1">Персональный разбор</h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                    14 990 ₸
                  </span>
                </div>
                
                {/* Описание */}
                <p className="text-sm text-muted mb-4 leading-relaxed">
                  Персональная инструкция к твоему характеру, мышлению и стилю жизни.
                </p>
                
                {/* Список пунктов */}
                <div className="mb-4 flex-1">
                  <p className="text-sm font-semibold text-heading mb-2">Ты получаешь:</p>
                  <ul className="text-sm text-muted space-y-2 list-disc list-inside">
                    <li>Как ты думаешь, выбираешь и реагируешь</li>
                    <li>Где твоя настоящая сила и где ты теряешь энергию</li>
                    <li>Почему одни среды тебя усиливают, а другие выжигают</li>
                    <li>В каких форматах тебе легче добиваться результата</li>
                    <li>Как выстраивать решения, обучение, работу и отношения под свой стиль</li>
                  </ul>
                </div>
                
                <p className="text-sm text-muted italic mb-4">
                  Это не типология и не приговор.<br/>
                  Это навигационная система под твою реальную жизнь.
                </p>
                
                {/* Кнопка */}
                <button
                  className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('pro', 'Персональный разбор');
                  }}
                >
                   Получить персональный разбор
                </button>
              </div>
            </div>

            {/* Карточка 3: Семейная навигация */}
            <div className="level-card-snap">
              {/* Декоративная метка над карточкой */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-0.5 bg-primary/40 mb-2"></div>
                <div className="text-sm font-semibold text-primary">Семья</div>
                <div className="w-16 h-0.5 bg-primary/40 mt-2"></div>
              </div>
              <div 
                className="level-card-mobile bg-white rounded-2xl shadow-xl bg-card-recommend p-6 flex flex-col h-full relative border-2 border-primary w-full cursor-pointer"
                onClick={() => openFor('pro', 'Семейная навигация')}
              >
                {/* Иллюстрация */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/komu/PREMIUM .png"
                    alt="Иконка тарифа Premium"
                    className="h-32 opacity-90 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </div>
                
                {/* Заголовок и цена */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-heading flex-1">Семейная навигация</h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                    34 990 ₸
                  </span>
                </div>
                
                {/* Подзаголовок */}
                <p className="text-sm text-muted mb-4 leading-relaxed italic">
                  Чтобы подросток понял себя, а родитель — понял своего ребёнка
                </p>
                
                {/* Слайдер с переключателями */}
                <div className="mb-6 flex-1">
                  {/* Кнопки переключения */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumSlideIndex(0);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        premiumSlideIndex === 0
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary/10 text-heading hover:bg-primary/20'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Подросток
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPremiumSlideIndex(1);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        premiumSlideIndex === 1
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-primary/10 text-heading hover:bg-primary/20'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      Родитель
                    </button>
                  </div>

                  {/* Контейнер слайдера */}
                  <div className="relative overflow-hidden rounded-lg">
                    <motion.div
                      className="flex"
                      animate={{ x: `-${premiumSlideIndex * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      {/* Слайд 1: Что получает подросток */}
                      <div className="min-w-full bg-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Что получает подросток
                        </h4>
                        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                          <li>Понимание своего характера, сильных сторон и особенностей</li>
                          <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                          <li>Как он думает, принимает решения и реагирует на давление</li>
                          <li>Навигационный компас вместо оценок и ярлыков</li>
                        </ul>
                      </div>

                      {/* Слайд 2: Что получает родитель */}
                      <div className="min-w-full bg-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" />
                          Что получает родитель
                        </h4>
                        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                          <li>Персональную карту психологии ребёнка</li>
                          <li>Как ребёнок думает, чувствует и воспринимает мир</li>
                          <li>Как с ним лучше общаться без конфликтов</li>
                          <li>Какие слова поддерживают, а какие вызывают сопротивление</li>
                          <li>Как быть опорой, а не источником давления</li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                <p className="text-sm text-muted italic mb-4">
                  Это не про «воспитание».<br/>
                  Это про язык понимания.
                </p>
                
                {/* Кнопка */}
                <button
                  className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('pro', 'Семейная навигация');
                  }}
                >
                   Начать семейную навигацию
                </button>
              </div>
            </div>
          </div>
          
          {/* Пагинация для мобильной версии */}
          <div className="levels-pagination">
            {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  goToSlide(index);
                  pause();
                }}
                className={`levels-pagination-bullet ${
                  currentIndex === index ? 'levels-pagination-bullet-active' : ''
                } ${isPaused && currentIndex === index ? 'paused' : ''}`}
                aria-label={`Перейти к слайду ${index + 1}`}
              />
            ))}
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
        <div className="relative mb-4 sm:mb-6">
          {/* Верхняя золотая полоса */}
          <div className="absolute -top-3 sm:-top-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-20 sm:w-24 h-0.5 sm:h-1 bg-primary rounded-full opacity-60"></div>
          
          {/* Заголовок между полосами */}
          <div className="relative flex flex-col items-center lg:items-start gap-1.5 sm:gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold relative z-10">Кому подойдёт</h2>
            {/* Нижняя золотая полоса */}
            <div className="w-12 sm:w-16 h-0.5 bg-primary/40"></div>
          </div>
        </div>
        <WhoForCards />
      </section>

      {/* anchors удалены по просьбе пользователя */}
      </>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm({ name: '', age: '', gender: '', testType: '', email: '', emailConfirm: '', parentEmail: '', parentEmailConfirm: '', consent: false });
          setErrors({});
        }}
        hideScrollbar={Object.keys(errors).length === 0}
      >
        <h3 className="text-xl font-semibold mb-4">Перед началом — немного о Вас</h3>
        <div className="grid gap-3">
          <div className="space-y-1">
            <input
              type="text"
              id="form-name"
              name="name"
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
              id="form-age"
              name="age"
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
              id="form-gender"
              name="gender"
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
              id="form-email"
              name="email"
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
                id="form-email-confirm"
                name="emailConfirm"
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
          {isPremiumTest && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-heading mb-1 text-center">
                Email родителя для получения отчёта
              </label>
              <input
                type="email"
                id="form-parent-email"
                name="parentEmail"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                  errors.parentEmail 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-black/10 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Email родителя"
                value={form.parentEmail}
                onChange={(e) => {
                  setForm({ ...form, parentEmail: e.target.value });
                  clearError('parentEmail');
                }}
                onBlur={() => {
                  const parentEmailValue = form.parentEmail.trim();
                  if (!parentEmailValue) {
                    setErrors(prev => ({ ...prev, parentEmail: 'Укажите email родителя' }));
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmailValue)) {
                    setErrors(prev => ({ ...prev, parentEmail: 'Введите корректный email' }));
                  }
                }}
                aria-invalid={Boolean(errors.parentEmail)}
              />
              {errors.parentEmail && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.parentEmail}
                </motion.p>
              )}
            </div>
          )}
          {isPremiumTest && (
            <div className="space-y-1">
              <input
                type="email"
                id="form-parent-email-confirm"
                name="parentEmailConfirm"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all ${
                  errors.parentEmailConfirm 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-black/10 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                placeholder="Подтвердите email родителя"
                value={form.parentEmailConfirm}
                onChange={(e) => {
                  setForm({ ...form, parentEmailConfirm: e.target.value });
                  clearError('parentEmailConfirm');
                }}
                onBlur={() => {
                  const parentEmailValue = form.parentEmail.trim();
                  const parentEmailConfirmValue = form.parentEmailConfirm.trim();
                  if (!parentEmailConfirmValue) {
                    setErrors(prev => ({ ...prev, parentEmailConfirm: 'Повторите email родителя' }));
                  } else if (parentEmailConfirmValue !== parentEmailValue) {
                    setErrors(prev => ({ ...prev, parentEmailConfirm: 'Email родителя не совпадает' }));
                  }
                }}
                aria-invalid={Boolean(errors.parentEmailConfirm)}
              />
              {errors.parentEmailConfirm && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.parentEmailConfirm}
                </motion.p>
              )}
            </div>
          )}
          {/* Селектор показывается только если форма открыта через кнопку "Начать" в hero (plan === null) */}
          {plan === null && (
            <div className="space-y-1">
              <Select
                id="form-test-type"
                name="testType"
                value={form.testType}
                onChange={(v) => {
                  setForm({ ...form, testType: v });
                  clearError('testType');
                }}
                placeholder="Вид навигации"
                options={[
                  { value: 'Первичное понимание', label: 'Первичное понимание — Бесплатно' },
                  { value: 'Персональный разбор', label: 'Персональный разбор — 14 990 ₸' },
                  { value: 'Семейная навигация', label: 'Семейная навигация — 34 990 ₸' },
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
                id="form-consent"
                name="consent"
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
                </Link>
                ,{' '}
                <Link to="/public-offer" className="text-heading font-bold hover:underline">
                  Публичной офертой
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
          {/* TEMPORARY TESTING: Кнопки для быстрого тестирования */}
          {plan === 'free' && form.testType === 'Первичное понимание' && (
            <button
              type="button"
              className="px-5 py-3 transition border-2 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-lg font-semibold"
              onClick={startTestQuick}
            >
               Тест 
            </button>
          )}
          {plan === 'pro' && form.testType === 'Персональный разбор' && (
            <button
              type="button"
              className="px-5 py-3 transition border-2 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-lg font-semibold"
              onClick={startTestQuickExtended}
            >
               Тест 
            </button>
          )}
          {plan === 'pro' && form.testType === 'Семейная навигация' && (
            <button
              type="button"
              className="px-5 py-3 transition border-2 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-lg font-semibold"
              onClick={startTestQuickPremium}
            >
               Тест 
            </button>
          )}
          {/* END TEMPORARY TESTING */}
          <button
            type="button"
            className={`btn btn-primary px-5 py-3 transition ${
              isFormComplete ? '' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={startTest}
          >
            Начать   
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
        
        // Пауза автопереключения при свайпе
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 4000);
        
        if (deltaX > 0) {
          // Свайп вправо - предыдущий отзыв
          setDirection(-1);
          setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
        } else {
          // Свайп влево - следующий отзыв
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
    // currentIndex не нужен в зависимостях, так как используется функциональная форма setState
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
      <div className="relative mb-4 sm:mb-6">
        {/* Верхняя золотая полоса */}
        <div className="absolute -top-3 sm:-top-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-20 sm:w-24 h-0.5 sm:h-1 bg-primary rounded-full opacity-60"></div>
        
        {/* Заголовок между полосами */}
        <div className="relative flex flex-col items-center lg:items-start gap-1.5 sm:gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold relative z-10">Отзывы</h2>
          {/* Нижняя золотая полоса */}
          <div className="w-12 sm:w-16 h-0.5 bg-primary/40"></div>
        </div>
      </div>
      
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Контейнер слайдера с относительным позиционированием для стрелок */}
        <div className="relative sm:px-12 md:px-16">
        {/* Стрелка влево - только на desktop */}
        <button
          onClick={goToPrev}
            className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 z-10 bg-card rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:bg-primary hover:text-white text-heading border border-secondary"
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
              className="bg-white rounded-xl shadow-soft p-4 sm:p-6 md:p-8 min-h-[200px] sm:min-h-0 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'pan-x pinch-zoom', color: '#2B2B2B' }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-heading">{reviews[currentIndex].name.split(' ')[0]}</h3>
                  {(reviews[currentIndex].age || reviews[currentIndex].testType) && (
                    <div className="text-xs text-muted mt-0.5">
                      {reviews[currentIndex].age && <span>{reviews[currentIndex].age} лет</span>}
                      {reviews[currentIndex].age && reviews[currentIndex].testType && <span> • </span>}
                      {reviews[currentIndex].testType && <span>{reviews[currentIndex].testType}</span>}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-none" style={{ color: '#2B2B2B' }}>{reviews[currentIndex].text}</p>
            </motion.div>
          )}
        </div>

        {/* Стрелка вправо - только на desktop */}
        <button
          onClick={goToNext}
            className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 z-10 bg-card rounded-full p-2 shadow-md hover:shadow-lg transition-all hover:bg-primary hover:text-white text-heading border border-secondary"
          aria-label="Следующий отзыв"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        </div>

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
  const swiperRef = useRef<SwiperType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const SLIDE_COUNT = 4; // Ученикам, Студентам, Родителям, Взрослым
  
  // Определяем, мобильное ли устройство
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1023;
  });
  
  // Отслеживаем изменение размера окна
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1023);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Используем хук автопрокрутки для мобильной версии
  const { isPaused } = useSwiperAutoSlider({
    enabled: isMobile,
    intervalMs: 2000,
    pauseMs: 20000,
    visibilityThreshold: 0.65,
    containerRef,
    swiperRef,
    slideCount: SLIDE_COUNT,
  });

  // Обновление класса пагинации при паузе и смене слайда
  useEffect(() => {
    if (!swiperRef.current?.pagination?.el) return;

    const updatePagination = () => {
      const paginationEl = swiperRef.current?.pagination?.el;
      if (!paginationEl) return;

      // Убираем класс paused со всех буллетов
      const bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');
      bullets.forEach((bullet) => {
        (bullet as HTMLElement).classList.remove('paused');
      });

      const activeBullet = paginationEl.querySelector('.swiper-pagination-bullet-active') as HTMLElement;
      if (activeBullet) {
        if (isPaused) {
          activeBullet.classList.add('paused');
        } else {
          // Перезапускаем анимацию прогресса
          activeBullet.style.animation = 'none';
          setTimeout(() => {
            activeBullet.style.animation = '';
          }, 10);
        }
      }
    };

    updatePagination();

    // Обновляем при смене слайда
    const swiper = swiperRef.current;
    if (swiper) {
      swiper.on('slideChangeTransitionEnd', updatePagination);
      return () => {
        swiper.off('slideChangeTransitionEnd', updatePagination);
      };
    }
  }, [isPaused, swiperRef]);

  // Принудительный пересчёт layout при монтировании компонента
  useEffect(() => {
    // Обновляем Swiper после монтирования с задержкой
    const updateSwiper = () => {
      if (swiperRef.current) {
        try {
          // Проверяем, что Swiper полностью инициализирован
          if (swiperRef.current.el && swiperRef.current.wrapperEl) {
            const elRect = swiperRef.current.el.getBoundingClientRect();
            if (elRect.width > 0) {
              swiperRef.current.update();
              // Проверяем наличие слайдов перед обновлением
              if (swiperRef.current.slides && swiperRef.current.slides.length > 0) {
                swiperRef.current.updateSlides();
                swiperRef.current.updateSlidesClasses();
              }
            }
          }
        } catch (error) {
          logger.warn('Swiper update error:', error);
        }
      }
    };

    // Обновляем с задержками для надёжности
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(updateSwiper, 500));
    timers.push(setTimeout(updateSwiper, 1000));

    // Также обновляем при изменении ориентации
    const handleOrientationChange = () => {
      const timer = setTimeout(updateSwiper, 300);
      timers.push(timer);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return (
    <>
      {/* Desktop версия - grid */}
      <div ref={ref} className="hidden md:grid mt-6 grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
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
            alt="Иллюстрация для учеников старших классов"
            className="h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-blue-400/60" />
          <Sparkles className="absolute top-2 left-1 sm:top-4 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-blue-300/50" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Ученикам старших классов</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
          Ты стоишь на этапе, где закладывается твоя будущая траектория.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Ошибки здесь стоят дорого, а правильные решения дают преимущество на годы вперёд.
        </p>
        
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает:</p>
          <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
            <li>понять, как ты думаешь и принимаешь решения</li>
            <li>увидеть свои реальные сильные стороны, а не оценки в дневнике</li>
            <li>выбрать направление, где ты будешь расти быстрее других</li>
            <li>не идти «куда все», а строить собственную стратегию</li>
          </ul>
        </div>
        
        <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
          Это не про выбор профессии.<br/>
          Это про выбор правильной траектории.
        </p>
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Будущее начинается с понимания того, как ты устроен."</p>
          </div>
        </div>
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
            alt="Иллюстрация для студентов"
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top relative z-10"
            loading="lazy"
          />
          {/* Элементы роста - только на desktop */}
          <Sparkles className="hidden sm:block absolute bottom-2 right-2 w-4 h-4 text-emerald-400/50 z-10" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Студентам</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
          Университет — это не путь.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Это среда. И каждый в ней раскрывается по-разному.
        </p>
        
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает:</p>
          <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
            <li>понять, в каком формате ты раскрываешься сильнее всего</li>
            <li>выстроить свой карьерный трек, а не плыть по программе</li>
            <li>увидеть, где твои реальные точки роста</li>
            <li>перестать тратить годы на «не своё»</li>
          </ul>
        </div>
        
        <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
          Это не про диплом.<br/>
          Это про капитал мышления и решений.
        </p>
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Карьера строится не из предметов. Она строится из мышления."</p>
          </div>
        </div>
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
            alt="Иллюстрация для родителей"
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-amber-400/50" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Родителям подростков</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
          Подростковый возраст — это не кризис.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Это этап формирования характера, мышления и будущей траектории.
        </p>
        
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает родителям:</p>
          <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
            <li>понять, как ребёнок думает и принимает решения</li>
            <li>увидеть его реальные сильные стороны</li>
            <li>выстроить язык общения без конфликтов</li>
            <li>создать среду, в которой ребёнок раскрывается, а не ломается</li>
          </ul>
        </div>
        
        <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
          Это не про контроль.<br/>
          Это про настройку системы развития.
        </p>
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Сильный характер формируется в правильно настроенной среде."</p>
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
            alt="Иллюстрация для взрослых"
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-primary/40" />
          <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-primary/30" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Взрослым</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
          Взрослая жизнь — это не про «найти себя».
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Это про управление своей траекторией.
        </p>
        
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-semibold text-heading mb-2">Профиль будущего помогает:</p>
          <ul className="text-xs sm:text-sm text-muted space-y-1.5 sm:space-y-2 list-disc list-inside">
            <li>понять, где твоя энергия естественна</li>
            <li>увидеть, почему ты упираешься в потолок</li>
            <li>перестроить карьеру без хаоса и резких шагов</li>
            <li>вернуть ощущение контроля над своей жизнью</li>
          </ul>
        </div>
        
        <p className="text-xs sm:text-sm text-muted italic mb-3 sm:mb-4 text-center">
          Это не про мотивацию.<br/>
          Это про стратегию.
        </p>
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Когда понимаешь, как устроена твоя система — начинаешь управлять."</p>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Mobile версия - Swiper с авто-свайпом */}
      <div className="md:hidden mt-6">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet !bg-primary/30 !w-2 !h-2 !rounded-full',
            bulletActiveClass: 'swiper-pagination-bullet-active !bg-primary !w-6',
          }}
          // Настройки для мобильных touch-событий - только горизонтальная прокрутка
          touchEventsTarget="container"
          allowTouchMove={true}
          simulateTouch={true}
          touchRatio={1}
          touchAngle={15}
          threshold={10}
          longSwipesRatio={0.5}
          longSwipesMs={300}
          resistance={true}
          resistanceRatio={0.85}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onInit={(swiper) => {
            // Swiper полностью инициализирован, обновляем только при необходимости
            setTimeout(() => {
              try {
                if (swiper && swiper.el && swiper.wrapperEl) {
                  // Проверяем, что элементы имеют размеры
                  const elRect = swiper.el.getBoundingClientRect();
                  if (elRect.width > 0) {
                    // Обновляем только если нужно, Swiper сам управляет размерами при инициализации
                    swiper.update();
                    if (swiper.slides && swiper.slides.length > 0) {
                      swiper.updateSlides();
                      swiper.updateSlidesClasses();
                    }
                  }
                }
              } catch (error) {
                logger.warn('Swiper init update error:', error);
              }
            }, 300);
          }}
          className="!pb-12"
          style={{ touchAction: 'pan-x' }}
          direction="horizontal"
        >
          {/* Карточка 1: Ученикам старших классов */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              {/* Иллюстрация */}
              <div className="flex items-start justify-center h-[180px] mb-3 relative">
                <img
                  src="/komu/okushylar.png"
                  alt="Иллюстрация для учеников старших классов"
                  className="h-[180px] w-auto object-contain object-top"
                  loading="lazy"
                />
                {/* Элементы роста */}
                <Sparkles className="absolute top-1 right-1 w-4 h-4 text-blue-400/60" />
                <Sparkles className="absolute top-2 left-1 w-3 h-3 text-blue-300/50" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Ученикам старших классов</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Ты стоишь на этапе, где закладывается твоя будущая траектория.
                <br />
                <br />
                Ошибки здесь стоят дорого, а правильные решения дают преимущество на годы вперёд.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, как ты думаешь и принимаешь решения</li>
                  <li>увидеть свои реальные сильные стороны, а не оценки в дневнике</li>
                  <li>выбрать направление, где ты будешь расти быстрее других</li>
                  <li>не идти «куда все», а строить собственную стратегию</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про выбор профессии.<br/>
                Это про выбор правильной траектории.
              </p>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Будущее начинается с понимания того, как ты устроен."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>

          {/* Карточка 2: Студентам */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              {/* Иллюстрация */}
              <div className="flex items-start justify-center h-[140px] mb-3 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-emerald-200/30 blur-xl rounded-full w-20 h-20 transform translate-x-1 translate-y-1"></div>
                </div>
                <img
                  src="/komu/students.png"
                  alt="Иллюстрация для студентов"
                  className="h-[140px] w-auto object-contain object-top relative z-10"
                  loading="lazy"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Студентам</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Университет — это не путь.
                <br />
                <br />
                Это среда. И каждый в ней раскрывается по-разному.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, в каком формате ты раскрываешься сильнее всего</li>
                  <li>выстроить свой карьерный трек, а не плыть по программе</li>
                  <li>увидеть, где твои реальные точки роста</li>
                  <li>перестать тратить годы на «не своё»</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про диплом.<br/>
                Это про капитал мышления и решений.
              </p>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Карьера строится не из предметов. Она строится из мышления."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>

          {/* Карточка 3: Родителям подростков */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              {/* Иллюстрация */}
              <div className="flex items-start justify-center h-[140px] mb-3 relative">
                <img
                  src="/komu/parents.png"
                  alt="Иллюстрация для родителей"
                  className="h-[140px] w-auto object-contain object-top"
                  loading="lazy"
                />
                {/* Элементы роста */}
                <Sparkles className="absolute top-1 left-1 w-3 h-3 text-amber-400/50" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Родителям подростков</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Подростковый возраст — это не кризис.
                <br />
                <br />
                Это этап формирования характера, мышления и будущей траектории.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает родителям:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, как ребёнок думает и принимает решения</li>
                  <li>увидеть его реальные сильные стороны</li>
                  <li>выстроить язык общения без конфликтов</li>
                  <li>создать среду, в которой ребёнок раскрывается, а не ломается</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про контроль.<br/>
                Это про настройку системы развития.
              </p>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Сильный характер формируется в правильно настроенной среде."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>

          {/* Карточка 4: Взрослым */}
          <SwiperSlide>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card pt-4 px-4 pb-4 bg-base border border-secondary/40 rounded-xl overflow-hidden relative flex flex-col h-full"
            >
              {/* Иллюстрация */}
              <div className="flex items-start justify-center h-[140px] mb-3 relative">
                <img
                  src="/komu/vzroslym.png"
                  alt="Иллюстрация для взрослых"
                  className="h-[140px] w-auto object-contain object-top"
                  loading="lazy"
                />
                {/* Элементы роста */}
                <Sparkles className="absolute bottom-1 right-1 w-4 h-4 text-primary/40" />
                <Sparkles className="absolute top-1 left-1 w-3 h-3 text-primary/30" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Взрослым</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Взрослая жизнь — это не про «найти себя».
                <br />
                <br />
                Это про управление своей траекторией.
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-semibold text-heading mb-2">Профиль будущего помогает:</p>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>понять, где твоя энергия естественна</li>
                  <li>увидеть, почему ты упираешься в потолок</li>
                  <li>перестроить карьеру без хаоса и резких шагов</li>
                  <li>вернуть ощущение контроля над своей жизнью</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted italic mb-3 text-center">
                Это не про мотивацию.<br/>
                Это про стратегию.
              </p>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Когда понимаешь, как устроена твоя система — начинаешь управлять."</p>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        </Swiper>
      </div>
    </>
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
