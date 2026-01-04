import { motion } from 'framer-motion';
import { User, Briefcase, Target, Code, Globe, TrendingUp, Zap, Film } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  description: string[];
  icon: React.ReactNode;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Мирас Каратаев',
    role: 'Основатель, лицо компании',
    description: [
      '19 лет карьерного пути в разных сферах: финансы, банки, образование, нефтегаз, госкорпорации, предпринимательство',
      '8 лет — владелец ресторанного бизнеса',
      'Миссия: помочь людям не терять годы, пробуя "не своё"',
      'Автор концепции «Профиль будущего», главный популяризатор',
    ],
    icon: <User className="w-6 h-6" />,
  },
  {
    name: 'Каратаева Майра Нугмановна',
    role: 'CEO / Генеральный директор',
    description: [
      '45 лет педагогического опыта',
      'Глубокое понимание психологии и образования',
      'Контроль качества методологии и отчётов',
      'Экспертиза в работе с подростками и родителями',
    ],
    icon: <Briefcase className="w-6 h-6" />,
  },
  {
    name: 'Диас Кайрканов',
    role: 'Data Analyst, ML-направление',
    description: [
      'Аналитика данных тестирования',
      'Персонализация отчётов',
      'Оптимизация рекомендаций и профилей',
    ],
    icon: <Target className="w-6 h-6" />,
  },
  {
    name: 'Жорабек Юлдашев',
    role: 'Региональный партнёр – Узбекистан',
    description: [
      'Адаптация продукта под рынок Узбекистана',
      'Локализация контента',
      'Развитие дистрибуции и партнёрств',
    ],
    icon: <Globe className="w-6 h-6" />,
  },
  {
    name: 'Минжассаров Бектурган',
    role: 'Co-Founder / Коммерческий директор',
    description: [
      'Руководитель корпоративных продаж (B2B)',
      'Работа со школами и образовательными центрами',
      'Договоры, внедрение, сопровождение',
    ],
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    name: 'Галуза Никита',
    role: 'CTO – руководитель разработки',
    description: [
      'Full-stack разработка',
      'Архитектура платформы, тесты, отчёты',
      'Высоконагруженные веб-решения, QA',
    ],
    icon: <Code className="w-6 h-6" />,
  },
  {
    name: 'Бектемир Каратай',
    role: 'Амбассадор бренда, Gen-Z voice',
    description: [
      '23 года, ближе всех к целевой аудитории',
      'Коммуникация с подростками и студентами',
      'Формирует правильный тон и подачу для молодёжи',
    ],
    icon: <Zap className="w-6 h-6" />,
  },
  {
    name: 'Олег Маликов',
    role: 'Партнёр по маркетингу и контенту',
    description: [
      'Команда: 150+ специалистов (актеры, сценаристы, продюсеры, видеографы)',
      'Ведение соцсетей и рост бренда',
    ],
    icon: <Film className="w-6 h-6" />,
  },
];

export default function AboutPage() {
  return (
    <section className="container-balanced mt-10 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-12"
      >
        {/* Заголовок */}
        <header className="text-center max-w-3xl mx-auto relative">
          {/* Верхняя золотая полоса */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-60"></div>
          
          {/* Заголовок между полосами */}
          <div className="relative flex flex-col items-center gap-2 mb-4">
            <h1 className="text-3xl font-semibold relative z-10">О нас</h1>
            {/* Нижняя золотая полоса */}
            <div className="w-16 h-0.5 bg-primary/40"></div>
          </div>
          
          {/* Подзаголовок с декоративными элементами */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
            <p className="text-muted pl-6 relative leading-relaxed">
              Мы — команда, которая не по учебникам, а по жизни знает цену правильного выбора будущего.
            </p>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
          </div>
        </header>

        {/* Команда */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card p-6 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-primary/30 relative overflow-hidden group"
            >
              {/* Золотой акцент в углу */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Заголовок карточки */}
              <div className="flex items-start gap-3 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                  {member.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-heading mb-1 group-hover:text-primary transition-colors duration-300">{member.name}</h3>
                  <p className="text-sm font-medium text-primary">{member.role}</p>
                </div>
              </div>

              {/* Описание */}
              <ul className="space-y-2.5 relative z-10">
                {member.description.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted flex items-start gap-3">
                    <span className="text-primary mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span className="flex-1 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
