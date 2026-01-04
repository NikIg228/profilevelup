import { useState } from 'react';
import { Mail, Send, HelpCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const socialLinks = [
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@profilevelup',
    icon: <img src="/soc_seti/tiktok.svg" alt="" className="w-8 h-8" aria-hidden="true" />,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/profilevelup',
    icon: <img src="/soc_seti/instagram.svg" alt="" className="w-8 h-8" aria-hidden="true" />,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@profilevelup',
    icon: <img src="/soc_seti/youtube.svg" alt="" className="w-8 h-8" aria-hidden="true" />,
  },
  {
    name: 'Telegram-канал',
    url: 'https://t.me/profilevelup',
    icon: <img src="/soc_seti/telegram.svg" alt="" className="w-8 h-8" aria-hidden="true" />,
  },
];

const faqItems = [
  {
    q: 'Этот тест — психологическая диагностика?',
    a: [
      'Нет.',
      'Это не клинический инструмент и не ставит “ярлыки”.',
      'Это образовательная методика, помогающая человеку понять свой естественный стиль мышления, поведения и выбора среды, где он раскрывается легче.',
    ],
  },
  {
    q: 'Это заменяет профориентацию?',
    a: [
      'Нет, и не должно заменять.',
      'Это — основа для осознанного выбора: человек узнаёт, в какой среде и формате деятельности ему комфортнее развиваться.',
      'После этого уже легче выбирать факультеты, сферы и профессии.',
    ],
  },
  {
    q: 'Не загоняет ли в рамки?',
    a: [
      'Нет.',
      'Мы не говорим “кем ребёнок должен стать”.',
      'Метод показывает склонности и естественные условия, где ему проще и спокойнее, а не итоговую профессию.',
    ],
  },
  {
    q: 'Почему это важно, если мир меняется и профессии исчезают?',
    a: [
      'Профессии меняются.',
      'А тип мышления, характер энергии, стиль обучения и принятия решений — остаются.',
      'Мы помогаем понять не «куда поступить», а кто ты в этом мире и как тебе лучше развиваться.',
      'Это актуально всегда.',
    ],
  },
  {
    q: 'Можно ли ошибиться?',
    a: [
      'Тест построен так, чтобы минимизировать случайные ответы.',
      'Но главное — это не “оценка”, а разговор с собой.',
      'Если ребёнок отвечал честно — результат отражает его настоящие склонности.',
    ],
  },
  {
    q: 'Подходит ли для взрослых?',
    a: [
      'Да.',
      'Метод универсальный — подростки понимают себя раньше, взрослым помогает переосмыслить карьеру и взаимоотношения.',
    ],
  },
  {
    q: 'Не навредит ли ребёнку?',
    a: [
      'Нет.',
      'Мы не оцениваем интеллект, не сравниваем детей и не говорим “правильно/неправильно”.',
      'Это про принятие себя, а не про давление.',
    ],
  },
  {
    q: 'Это коммерческий проект?',
    a: [
      'Да. Но ценность — не “продать тест”, а дать доступный инструмент самопонимания.',
      'Есть бесплатные материалы, а платный отчёт — расширенный вариант для тех, кому важно глубже.',
    ],
  },
  {
    q: 'Могу ли я пройти тест за ребёнка?',
    a: [
      'Нет.',
      'Тогда это будет про вас, а не про него 😊',
      'Но вы получите версию для родителей, чтобы лучше понимать своего ребёнка и находить общий язык.',
    ],
  },
  {
    q: 'А если результат не понравится?',
    a: [
      'Это не приговор.',
      'Это отражение того, что у человека сейчас естественно.',
      'Каждый растёт, меняется, развивается — но достоинство природы лучше знать, чем',
      'игнорировать.',
    ],
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="container-balanced mt-10 sm:mt-16 mb-20 flex flex-col gap-12">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Верхняя золотая полоса */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-60"></div>
        
        {/* Заголовок между полосами */}
        <div className="relative flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-semibold relative z-10">Поддержка</h1>
          {/* Нижняя золотая полоса */}
          <div className="w-16 h-0.5 bg-primary/40"></div>
        </div>
        
        {/* Подзаголовок с декоративными элементами */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
          <p className="text-muted pl-6 relative">
            Найдите ответы на популярные вопросы или свяжитесь с поддержкой — мы поможем разобраться с любыми сложностями.
          </p>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60">          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="card p-6 md:p-8 border border-transparent hover:border-primary/30 transition-all duration-300 relative overflow-hidden group">
          {/* Золотой акцент в углу */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10 grid gap-6">
            <p className="text-muted max-w-xl relative">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/30 rounded-full opacity-60"></div>
              <span className="pl-6">Есть вопросы или нужна поддержка?</span>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/30 rounded-full opacity-60"></div>
            </p>
            
            <div className="grid gap-3">
              <motion.a 
                href="mailto:support@profilevelup.com" 
                className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 group/contact"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover/contact:bg-primary group-hover/contact:text-white transition-colors duration-300">
                  <Mail className="w-6 h-6" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <div className="text-sm text-muted">Email</div>
                  <div className="text-muted font-medium">support@profilevelup.com</div>
                </div>
              </motion.a>
              
              <motion.a 
                href="https://t.me/ProfiLevelUpSupport" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 group/contact"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover/contact:bg-primary group-hover/contact:text-white transition-colors duration-300">
                  <Send className="w-6 h-6" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <div className="text-sm text-muted">Telegram</div>
                  <div className="text-muted font-medium">@ProfiLevelUpSupport</div>
                </div>
              </motion.a>
            </div>
            
            <div className="grid gap-3 pt-2">
              <div className="font-medium text-heading flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Соцсети
              </div>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-primary transition-all duration-300"
                    aria-label={link.name}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {link.icon}
                  </motion.a>
                ))}
              </div>
              <div className="text-base font-medium text-heading pl-1 mt-2">На всех площадках аккаунт называется @profilevelup</div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-secondary/40">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted">Ответы: <span className="font-medium text-heading">Пн–Пт, 10:00–19:00</span></span>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative"
      >
        {/* Верхняя золотая полоса */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-60"></div>
        
        {/* Заголовок между полосами */}
        <div className="relative flex flex-col items-center gap-2 mb-8">
          <h2 className="text-3xl font-semibold relative z-10">FAQ</h2>
          {/* Нижняя золотая полоса */}
          <div className="w-16 h-0.5 bg-primary/40"></div>
        </div>
        
        {/* Креативный дизайн FAQ */}
        <div className="grid gap-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card border border-transparent hover:border-primary/30 transition-all duration-300 relative overflow-visible group"
            >
              {/* Золотой акцент в углу */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* Левая золотая полоса */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary/40 transition-colors duration-300 pointer-events-none"></div>
              
              <div className="relative z-10">
                <button
                  className="w-full text-left p-5 md:p-6 flex items-start gap-4 group/button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      openFaq === index 
                        ? 'bg-primary text-white' 
                        : 'bg-primary/10 text-primary group-hover/button:bg-primary group-hover/button:text-white'
                    }`}>
                      <HelpCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-heading text-base md:text-lg group-hover/button:text-primary transition-colors duration-300">
                      {item.q}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        openFaq === index 
                          ? 'bg-primary text-white rotate-180' 
                          : 'bg-primary/10 text-primary group-hover/button:bg-primary group-hover/button:text-white'
                      }`}
                    >
                      <span className="text-xl">⌄</span>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Ответы - отдельный блок */}
              {openFaq === index && (
                <div className="px-5 md:px-6 pb-4 md:pb-6 pt-0 relative z-20 bg-card">
                  <div className="text-muted text-sm md:text-base leading-relaxed space-y-2 pl-14">
                    {Array.isArray(item.a) 
                      ? item.a.map((paragraph, pIndex) => (
                          <p key={pIndex} className="pl-4 relative text-ink/80">
                            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            {paragraph}
                          </p>
                        ))
                      : <p className="pl-4 relative text-ink/80">
                          <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                          {item.a}
                        </p>
                    }
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

