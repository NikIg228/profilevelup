import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import VideoPlayer from '../components/VideoPlayer';
import ReviewForm from '../components/ReviewForm';
import { getReviews } from '../utils/reviewsStorage';
import type { VideoItem } from '../hooks/useVideoController';

type FormErrorKey = 'name' | 'age' | 'gender' | 'testType' | 'email' | 'emailConfirm' | 'parentEmail' | 'parentEmailConfirm' | 'consent';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plan, setPlan] = useState<'free'|'pro'|null>(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', testType: '', email: '', emailConfirm: '', parentEmail: '', parentEmailConfirm: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  // Состояния для accordion-карточек на мобильных
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [premiumSlideIndex, setPremiumSlideIndex] = useState(0); // 0 - подросток, 1 - родитель
  
  // Обработчик раскрытия mobile-extra блока
  const handleMobileExtraToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget.closest('.card');
    if (card) {
      card.classList.toggle('is-open');
    }
  };
  
  const navigate = useNavigate();

  // Состояния для Hero анимации
  // Проверяем, была ли уже показана анимация при первом заходе на сайт
  const hasSeenAnimation = typeof window !== 'undefined' && localStorage.getItem('heroAnimationSeen') === 'true';
  
  const [heroStage, setHeroStage] = useState<'pain' | 'transition' | 'solution' | 'complete'>(() => {
    // Если анимация уже была показана, сразу показываем финальный контент
    return hasSeenAnimation ? 'solution' : 'pain';
  });
  const [currentPainIndex, setCurrentPainIndex] = useState(-1); // -1 означает задержку перед первой фразой
  const [animationSkipped, setAnimationSkipped] = useState(hasSeenAnimation);
  const [showDarkOverlay, setShowDarkOverlay] = useState(false);
  const [maskRadius, setMaskRadius] = useState(0);
  const [logoPosition, setLogoPosition] = useState({ x: '75%', y: '50%' }); // Desktop по умолчанию
  const logoRef = useRef<HTMLImageElement>(null);
  
  const painPhrases = [
    'Выбери нормальную профессию!',
    'На этом денег не заработаешь!',
    'Какие таланты? Главное — диплом!'
  ];

  // Блокировка скролла во время анимации боли
  useEffect(() => {
    if (heroStage === 'pain' || heroStage === 'transition') {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [heroStage]);

  // Получение позиции существующего логотипа в hero (мобильная и desktop версии)
  useLayoutEffect(() => {
    if (heroStage === 'solution' && logoRef.current && !animationSkipped) {
      const logo = logoRef.current;
      const rect = logo.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Вычисляем позицию в процентах от viewport
      const xPercent = ((rect.left + rect.width / 2) / viewportWidth) * 100;
      const yPercent = ((rect.top + rect.height / 2) / viewportHeight) * 100;
      
      setLogoPosition({ 
        x: `${xPercent}%`, 
        y: `${yPercent}%` 
      });
    }
  }, [heroStage, animationSkipped]);

  // Эффект "выход из тени" - затемнение с расширяющимся светом из лого
  useLayoutEffect(() => {
    if (heroStage === 'solution' && !animationSkipped && logoRef.current) {
      // Небольшая задержка, чтобы убедиться, что логотип в DOM
      const timer = setTimeout(() => {
        setShowDarkOverlay(true);
        setMaskRadius(0);
        
        // Анимация расширения mask с плавным easing
        const startTime = Date.now();
        const duration = 2000;
        const keyframes = [0, 0.1, 0.3, 0.6, 1];
        const radiusValues = [0, 5, 25, 60, 150];
        
        const easeOut = (t: number) => {
          return 1 - Math.pow(1 - t, 3);
        };
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOut(progress);
          
          // Интерполяция между ключевыми кадрами
          let radius = 0;
          if (easedProgress <= keyframes[0]) {
            radius = radiusValues[0];
          } else if (easedProgress >= keyframes[keyframes.length - 1]) {
            radius = radiusValues[radiusValues.length - 1];
          } else {
            for (let i = 0; i < keyframes.length - 1; i++) {
              if (easedProgress >= keyframes[i] && easedProgress <= keyframes[i + 1]) {
                const localProgress = (easedProgress - keyframes[i]) / (keyframes[i + 1] - keyframes[i]);
                radius = radiusValues[i] + (radiusValues[i + 1] - radiusValues[i]) * localProgress;
                break;
              }
            }
          }
          
          setMaskRadius(radius);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setTimeout(() => {
              setShowDarkOverlay(false);
              setMaskRadius(0);
            }, 100);
          }
        };
        
        requestAnimationFrame(animate);
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      setShowDarkOverlay(false);
      setMaskRadius(0);
    }
  }, [heroStage, animationSkipped, logoPosition]);

  // Принудительный пересчёт layout при загрузке страницы для мобильных устройств
  useEffect(() => {
    // Флаг для предотвращения рекурсии
    let isResizing = false;

    // Триггерим resize для пересчёта размеров всех компонентов
    const triggerResize = () => {
      if (isResizing) return;
      isResizing = true;
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => {
        isResizing = false;
      }, 100);
    };

    // Выполняем после полной загрузки страницы
    if (document.readyState === 'complete') {
      setTimeout(triggerResize, 100);
      setTimeout(triggerResize, 300);
    } else {
      window.addEventListener('load', () => {
        setTimeout(triggerResize, 100);
        setTimeout(triggerResize, 300);
      }, { once: true });
    }

    // Также триггерим при изменении ориентации
    const handleOrientationChange = () => {
      setTimeout(triggerResize, 200);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Задержка перед первой фразой (2 секунды)
  useEffect(() => {
    if (animationSkipped || heroStage !== 'pain' || currentPainIndex !== -1) return;
    
    const initialDelay = setTimeout(() => {
      setCurrentPainIndex(0);
    }, 2000); // 2 секунды задержка перед первой фразой
    
    return () => clearTimeout(initialDelay);
  }, [currentPainIndex, heroStage, animationSkipped]);

  // Управление анимацией фраз боли
  useEffect(() => {
    if (animationSkipped || heroStage !== 'pain' || currentPainIndex < 0) return;

    if (currentPainIndex < painPhrases.length) {
      // Каждая фраза показывается 2 сек + интервал 0.8 сек = 2.8 сек
      const showTimer = setTimeout(() => {
        if (currentPainIndex === painPhrases.length - 1) {
          // Последняя фраза - переход к следующей стадии
          setTimeout(() => {
            setHeroStage('transition');
            setTimeout(() => {
              setHeroStage('solution');
              // Сохраняем, что анимация была показана
              localStorage.setItem('heroAnimationSeen', 'true');
            }, 33);
          }, 27);
        } else {
          setCurrentPainIndex(prev => prev + 1);
        }
      }, 2800); // 2 сек показ + 0.8 сек интервал

      return () => clearTimeout(showTimer);
    }
  }, [currentPainIndex, heroStage, animationSkipped, painPhrases.length]);

  // Пропуск анимации по тапу
  const skipAnimation = () => {
    if (heroStage === 'pain' || heroStage === 'transition') {
      setAnimationSkipped(true);
      setHeroStage('solution');
      // Сохраняем, что анимация была показана (даже если пропущена)
      localStorage.setItem('heroAnimationSeen', 'true');
    }
  };

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
  const trimmedParentEmail = form.parentEmail.trim();
  const trimmedParentEmailConfirm = form.parentEmailConfirm.trim();
  const isBasicTest = plan === 'free' || form.testType === 'Базовый';
  const isPremiumTest = form.testType === 'Premium' || form.testType === 'Подросток и родитель';
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

  const openFor = (p: 'free'|'pro', testTypeValue?: string) => {
    setPlan(p);
    // Сбрасываем форму и ошибки при открытии
    setForm({ name: '', age: '', gender: '', testType: testTypeValue || '', email: '', emailConfirm: '', parentEmail: '', parentEmailConfirm: '', consent: false });
    setErrors({});
    setModalOpen(true);
  };
  // TEMPORARY TESTING: Быстрый переход к тесту без заполнения формы
  const startTestQuick = () => {
    // Запрашиваем возраст у пользователя
    const ageInput = prompt('Введите возраст (от 13 до 45):');
    
    if (!ageInput) {
      return; // Пользователь отменил ввод
    }
    
    const ageNum = parseInt(ageInput.trim(), 10);
    
    // Валидация возраста
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 45) {
      alert('Возраст должен быть от 13 до 45 лет');
      return;
    }
    
    // Определяем возрастную группу
    let ageGroup: '13-17' | '18-24' | '25-34' | '35-45';
    if (ageNum >= 13 && ageNum <= 17) {
      ageGroup = '13-17';
    } else if (ageNum >= 18 && ageNum <= 24) {
      ageGroup = '18-24';
    } else if (ageNum >= 25 && ageNum <= 34) {
      ageGroup = '25-34';
    } else {
      ageGroup = '35-45';
    }
    
    // Устанавливаем тестовые данные для FREE теста
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      plan: 'free',
      name: 'Тестовый пользователь',
      age: ageGroup,
      gender: 'male',
      testType: 'Первичное понимание',
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
    const isBasicTest = plan === 'free' || form.testType === 'Базовый';
    const isPremiumTest = form.testType === 'Premium' || form.testType === 'Подросток и родитель';
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
    const { emailConfirm, parentEmailConfirm, ...formWithoutConfirm } = form;
    sessionStorage.setItem('profi.user', JSON.stringify({ 
      ...formWithoutConfirm, 
      email: emailValue, 
      parentEmail: isPremiumTest ? parentEmailValue : undefined,
      plan 
    }));
    navigate('/test');
  };

  return (
    <div>
      {/* Overlay затемнения с расширяющимся светом из лого */}
      {showDarkOverlay && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[10000]"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            maskImage: `radial-gradient(circle at ${logoPosition.x} ${logoPosition.y}, transparent 0%, transparent ${maskRadius}%, black ${maskRadius}%)`,
            WebkitMaskImage: `radial-gradient(circle at ${logoPosition.x} ${logoPosition.y}, transparent 0%, transparent ${maskRadius}%, black ${maskRadius}%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.1, 1], ease: 'easeOut' }}
          onAnimationComplete={() => setShowDarkOverlay(false)}
        />
      )}

      {/* Hero */}
      <section 
        className={`hero-section ${heroStage === 'pain' || heroStage === 'transition' ? 'fixed' : 'relative'} inset-0 ${heroStage === 'pain' || heroStage === 'transition' ? 'z-[9999]' : 'z-0'} min-h-[100vh] lg:min-h-[80vh] flex flex-col items-center ${heroStage === 'solution' ? 'justify-start lg:pt-8' : 'justify-center'} overflow-hidden transition-all duration-1000 ${
          heroStage === 'pain' || heroStage === 'transition' 
            ? 'bg-gray-900' 
            : 'bg-base'
        }`}
        onClick={skipAnimation}
        style={{ 
          cursor: heroStage === 'pain' || heroStage === 'transition' ? 'pointer' : 'default',
        }}
      >
        {/* Фоновый узор нейросети (только на светлом фоне) */}
        {heroStage === 'solution' && (
          <div 
            className="absolute inset-0 opacity-[0.05] lg:opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}

        {/* Мобильная версия */}
        <div className="lg:hidden w-full flex flex-col items-center justify-center px-4 py-2 relative z-10">
          {/* Стадия 1: Фразы боли */}
          {heroStage === 'pain' && currentPainIndex >= 0 && (
            <motion.div
              key={currentPainIndex}
              className="text-center px-4"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.7, 1, 1, 0.8],
              }}
              transition={{
                duration: 2.8,
                times: [0, 0.179, 0.714, 1], // pop-in 0.5 сек, показ 2 сек, fade-out 0.8 сек
                ease: [0.34, 1.56, 0.64, 1], // pop-in
              }}
            >
              <motion.h2
                className="text-2xl sm:text-3xl font-bold text-white leading-relaxed"
                animate={{
                  x: [0, -4, 4, -3, 3, -2, 2, -1, 1, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.15,
                  ease: 'easeInOut',
                }}
              >
                {painPhrases[currentPainIndex]}
              </motion.h2>
            </motion.div>
          )}
          
          {/* Подсказка о пропуске - внизу экрана, еле заметная */}
          {heroStage === 'pain' && currentPainIndex >= 0 && (
            <motion.p
              className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/20 text-center pointer-events-none z-[10000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              Нажмите, чтобы пропустить
            </motion.p>
          )}

          {/* Переход: затемнение и переход к свету */}
          {heroStage === 'transition' && (
            <motion.div
              className="absolute inset-0 bg-gray-900 z-[100]"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
          )}

          {/* Стадия 2: Решение */}
          {heroStage === 'solution' && (
            <div className="relative w-full flex flex-col items-center">
              {/* Логотип в центре */}
              <motion.div
                className="flex items-center justify-center mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <div className="rounded-2xl overflow-visible flex items-center justify-center">
                  <img 
                    ref={logoRef}
                    src="/logo-hero-mobile.png" 
                    alt="Логотип Профиль будущего" 
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain" 
                    loading="lazy" 
                  />
                </div>
              </motion.div>

              <motion.div
                className="text-center px-4"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
              >
                <h1 className="text-2xl sm:text-3xl font-semibold text-heading leading-relaxed">
                  <span className="block">Узнай себя глубже —</span>
                  <span className="block">и выбирай путь, который подходит именно тебе.</span>
            </h1>
              </motion.div>

              {/* CTA кнопки */}
              <motion.div
                className="flex justify-center gap-3 mt-4"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.6,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <button 
                  className="btn btn-primary px-5 py-3 text-center text-base sm:text-lg font-bold rounded-xl transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFor('free');
                  }}
                >
                  Начать
                </button>
                <Link 
                  to="/details" 
                  className="btn btn-ghost px-5 py-3 text-center text-base sm:text-lg font-bold rounded-xl transition-all duration-300"
                >
                  Подробнее
                </Link>
              </motion.div>

            </div>
          )}
        </div>

        {/* Desktop версия */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-start w-full container-balanced relative z-10 pt-4 lg:pt-6">
          {/* Стадия 1: Фразы боли */}
          {heroStage === 'pain' && currentPainIndex >= 0 && (
            <motion.div
              key={currentPainIndex}
              className="text-center px-4"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.7, 1, 1, 0.8],
              }}
              transition={{
                duration: 2.8,
                times: [0, 0.179, 0.714, 1], // pop-in 0.5 сек, показ 2 сек, fade-out 0.8 сек
                ease: [0.34, 1.56, 0.64, 1], // pop-in
              }}
            >
              <motion.h2
                className="text-4xl lg:text-5xl font-bold text-white leading-relaxed"
                animate={{
                  x: [0, -4, 4, -3, 3, -2, 2, -1, 1, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.15,
                  ease: 'easeInOut',
                }}
              >
                {painPhrases[currentPainIndex]}
              </motion.h2>
            </motion.div>
          )}
          
          {/* Подсказка о пропуске - внизу экрана, еле заметная */}
          {heroStage === 'pain' && currentPainIndex >= 0 && (
            <motion.p
              className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/20 text-center pointer-events-none z-[10000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              Нажмите, чтобы пропустить
            </motion.p>
          )}

          {/* Переход: затемнение и переход к свету */}
          {heroStage === 'transition' && (
            <motion.div
              className="absolute inset-0 bg-gray-900"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          )}

          {/* Стадия 2: Решение */}
          {heroStage === 'solution' && (
            <div className="relative w-full">
              <div className="grid lg:grid-cols-2 items-center gap-8 w-full">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-4">
                  <span className="block">Узнай себя глубже —</span>
                  <span className="block">и выбирай путь, который подходит именно тебе.</span>
                </h1>
                <p className="mt-4 text-muted text-lg mb-6">
            Короткий тест, который помогает увидеть свои сильные стороны и роли, в которых тебе естественно и комфортно быть собой.
            </p>
                <div className="flex gap-3">
                  <button className="btn btn-primary px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300" onClick={() => openFor('free')}>
                    Начать    
                  </button>
                  <Link to="/details" className="btn btn-ghost px-5 py-3 text-center text-base font-bold rounded-xl transition-all duration-300">
                    Подробнее
                  </Link>
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
                      ref={logoRef}
                      src="/logomain.png" 
                      alt="Логотип Профиль будущего" 
                      className="w-[91%] h-[91%] max-w-[520px] max-h-[520px] object-contain" 
                      loading="lazy" 
                    />
          </div>
                </motion.div>
            </div>
          </div>

            </div>
          )}
        </div>
      </section>

      {/* Остальной контент - показывается только после анимации */}
      {(heroStage === 'solution' || animationSkipped) && (
        <>
      {/* Formats */}
          <section id="formats" className="container-balanced mt-12 lg:mt-16">
            <div className="relative mb-6 sm:mb-8 lg:mb-12">
              {/* Верхняя золотая полоса */}
              <div className="absolute -top-3 sm:-top-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-20 sm:w-24 h-0.5 sm:h-1 bg-primary rounded-full opacity-60"></div>
              
              {/* Заголовок между полосами */}
              <div className="relative flex flex-col items-center lg:items-start">
                <h2 className="text-2xl sm:text-3xl font-semibold text-heading relative z-10">Уровни навигации</h2>
                {/* Нижняя золотая полоса */}
                <div className="w-12 sm:w-16 h-0.5 bg-primary/40 mt-2 mb-2"></div>
                {/* Подзаголовок скрыт на мобильных, так как он теперь в каждой карточке Swiper */}
                <p className="hidden lg:block text-sm sm:text-base text-muted">От первого понимания — к глубокой работе с собой и отношениями</p>
              </div>
            </div>
            
            {/* Desktop версия - grid */}
            <div className="levels-desktop hidden lg:grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Первичное понимание */}
          <div className={`card flex flex-col shadow-md bg-white order-1 transition-all duration-300
            ${expandedCard === 'basic' ? 'shadow-lg bg-base/30' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:cursor-pointer`}>
            {/* Desktop версия - ТОЛЬКО для desktop */}
            <div className="hidden lg:flex flex-col h-full justify-between group">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/basic.png"
                    alt=""
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 relative">
                    <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 pointer-events-none">
                      <div className="bg-white border-2 border-primary/30 rounded-xl shadow-2xl px-4 py-3 min-w-[280px] max-w-[320px] relative">
                        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/30 rotate-45"></div>
                        <p className="text-sm font-medium text-heading leading-relaxed">
                          Мягкий вход, чтобы увидеть себя со стороны
                        </p>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-heading mb-1">Первичное понимание</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                    Бесплатно
                  </span>
                </div>
                <ul className="mt-6 text-sm text-muted space-y-2 list-disc list-inside">
                  <li>Короткий вводный тест</li>
                  <li>Первичное понимание своего стиля мышления и действий</li>
                  <li>Краткий навигационный ориентир (1 страница)</li>
                  <li>Помогает почувствовать, откликается ли тебе этот формат</li>
                </ul>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={() => openFor('free', 'Первичное понимание')}
              >
                Начать
              </button>
            </div>

          </div>

          {/* Личный разбор */}
          <div className={`card flex flex-col border-2 border-primary/20 rounded-2xl shadow-md bg-gradient-to-b from-primary/5 to-white order-2 transition-all duration-300 relative
            ${expandedCard === 'extended' ? 'shadow-lg bg-base/30' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-xl lg:hover:-translate-y-1 lg:hover:border-primary/40 lg:cursor-pointer`}>
            {/* Desktop версия */}
            <div className="hidden lg:flex flex-col h-full justify-between group">
              <div>
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img
                    src="/komu/vip.png"
                    alt=""
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 relative">
                    <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 pointer-events-none">
                      <div className="bg-white border-2 border-primary/30 rounded-xl shadow-2xl px-4 py-3 min-w-[280px] max-w-[320px] relative">
                        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/30 rotate-45"></div>
                        <p className="text-sm font-medium text-heading leading-relaxed">
                          Глубокое понимание себя и своих особенностей
                        </p>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-heading mb-1">Личный разбор</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                    14 990 ₸
                  </span>
                </div>
                <div className="mt-6 text-sm text-muted space-y-2 border-l-2 border-primary/30 pl-4">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Расширенный тест</li>
                    <li>Персональный навигационный отчёт (5–6 страниц, PDF)</li>
                    <li>Как ты думаешь, принимаешь решения и реагируешь</li>
                    <li>Твои сильные стороны и зоны роста</li>
                    <li>Среды и форматы, где тебе легче быть собой</li>
                    <li>Рекомендации по развитию и взаимодействию с другими</li>
                  </ul>
                </div>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={() => openFor('pro', 'Личный разбор')}
              >
                Получить личный разбор
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
                  <img src="/komu/vip.png" alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="lazy" />
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
                        Личный разбор
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
                  onClick={() => openFor('pro', 'Личный разбор')}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Получить личный разбор
                </button>
              )}
            </div>
          </div>

          {/* Подросток и родитель */}
          <div className={`card flex flex-col rounded-2xl shadow-xl bg-card-recommend order-3 transition-all duration-300 relative
            ${expandedCard === 'premium' ? 'shadow-lg' : ''}
            lg:h-full lg:min-h-[500px] lg:p-8 lg:hover:shadow-2xl lg:hover:-translate-y-1 lg:cursor-pointer lg:border-2 lg:border-primary lg:hover:border-primary-hover`}>
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
                    alt=""
                    className="h-[156px] opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 relative">
                    <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 pointer-events-none">
                      <div className="bg-white border-2 border-primary/30 rounded-xl shadow-2xl px-4 py-3 min-w-[280px] max-w-[320px] relative">
                        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/30 rotate-45"></div>
                        <p className="text-sm font-medium text-heading leading-relaxed">
                          Чтобы подросток понял себя, а родитель — понял своего ребёнка
                        </p>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-heading mb-1">Подросток и родитель</h3>
                  </div>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-base font-semibold rounded-lg whitespace-nowrap">
                    34 990 ₸
                  </span>
                </div>

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
                          <li>Расширенный тест</li>
                          <li>Личный навигационный отчёт</li>
                          <li>Понимание своего характера, сильных сторон и особенностей</li>
                          <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                          <li>Навигационный «компас», а не оценка и не приговор</li>
                  </ul>
                      </div>

                      {/* Слайд 2: Что получает родитель */}
                      <div className="min-w-full bg-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" />
                          Что получает родитель
                        </h4>
                        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                          <li>Отдельный персональный отчёт о ребёнке (PDF)</li>
                          <li>Как ребёнок чувствует, думает и воспринимает мир</li>
                          <li>Как с ним лучше общаться, чтобы поддерживать, а не давить</li>
                          <li>Какие слова и подходы мотивируют, а какие вызывают сопротивление</li>
            
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
              <button
                className="mt-auto px-6 py-3 border border-primary rounded-xl bg-base text-primary font-semibold transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-md"
                onClick={() => openFor('pro', 'Подросток и родитель')}
              >
                Начать навигацию
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
                  <img src="/komu/PREMIUM .png" alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="lazy" />
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
                        Подросток и родитель
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
                  onClick={() => openFor('pro', 'Подросток и родитель')}
                  className="w-full mt-3 px-6 py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                >
                  Начать навигацию
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile версия - CSS Scroll Snap */}
        <div className="levels-mobile lg:hidden w-full">
          <div className="levels-mobile-scroll">
            {/* Карточка 1: Первичное понимание */}
            <div className="level-card-snap">
              <div className="level-card-mobile bg-white rounded-2xl shadow-md p-6 flex flex-col h-full w-full">
                {/* Иллюстрация */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/komu/basic.png"
                    alt=""
                    className="h-32 opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                
                {/* Заголовок и цена */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-heading flex-1">Первичное понимание</h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                    Бесплатно
                  </span>
                </div>
                
                {/* Подзаголовок */}
                <p className="text-base font-medium text-heading mb-4 px-3 py-2 bg-primary/10 rounded-lg border-l-4 border-primary">Мягкий вход, чтобы увидеть себя со стороны</p>
                
                {/* Список пунктов */}
                <ul className="text-sm text-muted space-y-2 list-disc list-inside mb-6 flex-1">
                  <li>Короткий вводный тест</li>
                  <li>Первичное понимание своего стиля мышления и действий</li>
                  <li>Краткий навигационный ориентир (1 страница)</li>
                  <li>Помогает почувствовать, откликается ли тебе этот формат</li>
                </ul>
                
                {/* Кнопка */}
                <button
                  className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                  onClick={() => openFor('free', 'Первичное понимание')}
                >
                  Начать
                </button>
              </div>
            </div>

            {/* Карточка 2: Личный разбор */}
            <div className="level-card-snap">
              <div className="level-card-mobile bg-white rounded-2xl shadow-md border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-white p-6 flex flex-col h-full w-full">
                {/* Иллюстрация */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/komu/vip.png"
                    alt=""
                    className="h-32 opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                
                {/* Заголовок и цена */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-heading flex-1">Личный разбор</h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                    14 990 ₸
                  </span>
                </div>
                
                {/* Подзаголовок */}
                <p className="text-base font-medium text-heading mb-4 px-3 py-2 bg-primary/10 rounded-lg border-l-4 border-primary">Глубокое понимание себя и своих особенностей</p>
                
                {/* Список пунктов */}
                <ul className="text-sm text-muted space-y-2 list-disc list-inside border-l-2 border-primary/30 pl-4 mb-6 flex-1">
                  <li>Расширенный тест</li>
                  <li>Персональный навигационный отчёт (5–6 страниц, PDF)</li>
                  <li>Как ты думаешь, принимаешь решения и реагируешь</li>
                  <li>Твои сильные стороны и зоны роста</li>
                  <li>Среды и форматы, где тебе легче быть собой</li>
                  <li>Рекомендации по развитию и взаимодействию с другими</li>
                </ul>
                
                {/* Кнопка */}
                <button
                  className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                  onClick={() => openFor('pro', 'Личный разбор')}
                >
                  Получить личный разбор
                </button>
              </div>
            </div>

            {/* Карточка 3: Подросток и родитель */}
            <div className="level-card-snap">
              <div className="level-card-mobile bg-white rounded-2xl shadow-xl bg-card-recommend p-6 flex flex-col h-full relative border-2 border-primary w-full">
                {/* Иллюстрация */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/komu/PREMIUM .png"
                    alt=""
                    className="h-32 opacity-90 object-contain"
                    loading="lazy"
                  />
                </div>
                
                {/* Заголовок и цена */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-heading flex-1">Подросток и родитель</h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0">
                    34 990 ₸
                  </span>
                </div>
                
                {/* Подзаголовок */}
                <p className="text-base font-medium text-heading mb-4 px-3 py-2 bg-primary/10 rounded-lg border-l-4 border-primary">Чтобы подросток понял себя, а родитель — понял своего ребёнка</p>
                
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
                          <li>Расширенный тест</li>
                          <li>Личный навигационный отчёт</li>
                          <li>Понимание своего характера, сильных сторон и особенностей</li>
                          <li>В каких условиях ему легче учиться, общаться и развиваться</li>
                          <li>Навигационный «компас», а не оценка и не приговор</li>
                        </ul>
                      </div>

                      {/* Слайд 2: Что получает родитель */}
                      <div className="min-w-full bg-primary/5 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" />
                          Что получает родитель
                        </h4>
                        <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
                          <li>Отдельный персональный отчёт о ребёнке (PDF)</li>
                          <li>Как ребёнок чувствует, думает и воспринимает мир</li>
                          <li>Как с ним лучше общаться, чтобы поддерживать, а не давить</li>
                          <li>Какие слова и подходы мотивируют, а какие вызывают сопротивление</li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Кнопка */}
                <button
                  className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-xl transition-all duration-300 hover:bg-primary/90 hover:shadow-md mt-auto"
                  onClick={() => openFor('pro', 'Подросток и родитель')}
                >
                  Начать навигацию
                </button>
              </div>
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
      )}

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
          {!form.testType && (
            <div className="space-y-1">
              <Select
                id="form-test-type"
                name="testType"
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
          {/* TEMPORARY TESTING: Кнопка для быстрого тестирования */}
          {plan === 'free' && form.testType === 'Первичное понимание' && (
            <button
              type="button"
              className="px-5 py-3 transition border-2 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-lg font-semibold"
              onClick={startTestQuick}
            >
              🧪 Тест (пропустить форму)
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
  }, [reviews.length, currentIndex]);

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
                  <h3 className="text-base sm:text-lg font-semibold text-heading">{reviews[currentIndex].name.split(' ')[0]}</h3>
                <span className="text-xs text-muted">{reviews[currentIndex].date}</span>
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
  const [isPaused, setIsPaused] = useState(false);

  // Обработчик тапа для паузы
  const handleTouchStart = () => {
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.pause();
      setIsPaused(true);
    }
  };

  // Возобновление автоплея через 5 секунд после паузы
  useEffect(() => {
    if (isPaused) {
      const timer = setTimeout(() => {
        if (swiperRef.current?.autoplay) {
          swiperRef.current.autoplay.resume();
          setIsPaused(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isPaused]);

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
          console.warn('Swiper update error:', error);
        }
      }
    };

    // Обновляем с задержками для надёжности
    const timer1 = setTimeout(updateSwiper, 500);
    const timer2 = setTimeout(updateSwiper, 1000);

    // Также обновляем при изменении ориентации
    const handleOrientationChange = () => {
      setTimeout(updateSwiper, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
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
            alt=""
            className="h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 text-blue-400/60" />
          <Sparkles className="absolute top-2 left-1 sm:top-4 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-blue-300/50" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Ученикам старших классов</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
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
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Выбор направления — это не про правильность, а про соответствие себе"</p>
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
            alt=""
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top relative z-10"
            loading="lazy"
          />
          {/* Элементы роста - только на desktop */}
          <Sparkles className="hidden sm:block absolute bottom-2 right-2 w-4 h-4 text-emerald-400/50 z-10" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Студентам</h3>
        
        {/* Desktop: полный текст */}
        <p className="hidden sm:block text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
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
        
        {/* Плашка снизу */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-secondary/40">
          <div className="bg-primary/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-center">
            <p className="text-xs sm:text-sm text-primary font-medium italic">"Практика показывает, кто ты на самом деле, а не диплом"</p>
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
            alt=""
            className="h-[140px] sm:h-[180px] w-auto object-contain object-top"
            loading="lazy"
          />
          {/* Элементы роста */}
          <Sparkles className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 text-amber-400/50" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-heading mb-2 sm:mb-3 text-center">Родителям подростков</h3>
        
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-3 sm:mb-4 text-center">
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

      {/* Mobile версия - Swiper с авто-свайпом */}
      <div className="md:hidden mt-6">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet !bg-primary/30 !w-2 !h-2 !rounded-full',
            bulletActiveClass: 'swiper-pagination-bullet-active !bg-primary !w-6',
          }}
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
                console.warn('Swiper init update error:', error);
              }
            }, 300);
          }}
          onTouchStart={handleTouchStart}
          className="!pb-12"
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
                  alt=""
                  className="h-[180px] w-auto object-contain object-top"
                  loading="lazy"
                />
                {/* Элементы роста */}
                <Sparkles className="absolute top-1 right-1 w-4 h-4 text-blue-400/60" />
                <Sparkles className="absolute top-2 left-1 w-3 h-3 text-blue-300/50" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Ученикам старших классов</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Когда ты стоишь на пороге выбора — важно увидеть себя не через оценки, а через склонности.
                <br />
                <br />
                Здесь ты находишь направление, в котором чувствуешь себя естественно.
              </p>
              
              <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                <li>понять своё направление перед выбором вуза</li>
                <li>сверить интересы с реальными склонностями</li>
                <li>выбрать среду, где учёба будет естественной</li>
              </ul>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Выбор направления — это не про правильность, а про соответствие себе"</p>
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
                  alt=""
                  className="h-[140px] w-auto object-contain object-top relative z-10"
                  loading="lazy"
                />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Студентам</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                В университете нет "правильного пути" — есть твой формат, твой темп роста.
                <br />
                <br />
                Наш профиль показывает, как раскрыться в реальной практике.
              </p>
              
              <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                <li>уточнить специализацию и карьерный трек</li>
                <li>понять, в какой практике вы раскроетесь лучше</li>
                <li>скорректировать учебную траекторию</li>
              </ul>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Практика показывает, кто ты на самом деле, а не диплом"</p>
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
                  alt=""
                  className="h-[140px] w-auto object-contain object-top"
                  loading="lazy"
                />
                {/* Элементы роста */}
                <Sparkles className="absolute top-1 left-1 w-3 h-3 text-amber-400/50" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Родителям подростков</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Подростковый возраст — это поиск своего голоса.
                <br />
                <br />
                Профиль помогает родителям увидеть сильные стороны ребёнка и говорить с ним на одном языке.
              </p>
              
              <ul className="text-xs text-muted space-y-1.5 mb-3 list-disc list-inside">
                <li>глубже понять характер и мышление ребёнка</li>
                <li>увидеть, как с ним говорить и мотивировать</li>
                <li>найти баланс между поддержкой и свободой</li>
              </ul>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Поддержка семьи — основа роста"</p>
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
                  alt=""
                  className="h-[140px] w-auto object-contain object-top"
                  loading="lazy"
                />
                {/* Элементы роста */}
                <Sparkles className="absolute bottom-1 right-1 w-4 h-4 text-primary/40" />
                <Sparkles className="absolute top-1 left-1 w-3 h-3 text-primary/30" />
              </div>
              
              <h3 className="text-lg font-semibold text-heading mb-2 text-center">Взрослым</h3>
              
              <p className="text-xs text-muted leading-relaxed mb-3 text-center">
                Порой мы оказываемся "не на своём месте" не потому, что ошиблись,
                а потому что пришло время обновиться.
                <br />
                <br />
                Профиль помогает взрослому увидеть, где его энергия естественна.
              </p>
              
              <ul className="text-xs text-muted space-y-1.5 mb-3 list-disc list-inside">
                <li>переосмыслить профессию, если "не на своём месте"</li>
                <li>понять, где комфортнее реализовывать себя</li>
                <li>восстановить ясность в том, чего вы хотите</li>
              </ul>
              
              {/* Плашка снизу */}
              <div className="mt-auto pt-3 border-t border-secondary/40">
                <div className="bg-primary/5 rounded-full px-3 py-1.5 text-center">
                  <p className="text-xs text-primary font-medium italic">"Обновление — это не отказ от прошлого, а возврат к себе"</p>
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
