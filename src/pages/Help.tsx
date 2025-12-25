import { Mail, Send } from 'lucide-react';
import Accordion from '../components/Accordion';

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
  return (
    <div className="container-balanced mt-10 sm:mt-16 mb-20 flex flex-col gap-12">
      <section className="fade-section">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Помощь</h1>
        <p className="mt-4 text-muted text-lg max-w-2xl">
          Найдите ответы на популярные вопросы или свяжитесь с поддержкой — мы поможем разобраться с любыми сложностями.
        </p>
      </section>

      <section className="fade-section">
        <div className="card p-6 md:p-8 border border-secondary/40 grid gap-4">
          <h2 className="text-2xl font-semibold">Контакты</h2>
          <p className="text-muted max-w-xl">
            Есть вопросы или нужна поддержка?
          </p>
          <div className="grid gap-2 text-muted text-sm">
            <a href="mailto:support@profilevelup.com" className="flex items-center gap-2 text-primary hover:underline w-fit">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>Email: support@profilevelup.com</span>
            </a>
            <a href="https://t.me/ProfiLevelUpSupport" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline w-fit">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Send className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>Telegram: @ProfiLevelUpSupport</span>
            </a>
          </div>
          <div className="grid gap-2 text-muted">
            <div className="font-medium">Соцсети:</div>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
            <div className="text-xs text-muted">На всех площадках аккаунт называется @profilevelup</div>
          </div>
          <div className="text-sm text-muted">🕒 Ответы: Пн–Пт, 10:00–19:00</div>
        </div>
      </section>

      <section className="fade-section">
        <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
        <Accordion items={faqItems} />
      </section>
    </div>
  );
}

