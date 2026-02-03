import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const socialLinks = [
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@profilevelup',
    icon: '/soc_seti/tiktok.svg',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/profilevelup',
    icon: '/soc_seti/instagram.svg',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@profilevelup',
    icon: '/soc_seti/youtube.svg',
  },
  {
    name: 'Telegram',
    url: 'https://t.me/profilevelup',
    icon: '/soc_seti/telegram.svg',
  },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.3 }}
      className="mt-16 border-t border-secondary/30 bg-heading"
    >
      <div className="container-balanced py-12">
        {/* Основной контент футера */}
        <div className="grid gap-8 md:grid-cols-4 md:gap-6 lg:gap-10">
          {/* Блок 1: Логотип и описание */}
          <div className="md:col-span-1 space-y-4 flex flex-col items-center">
            <Link to="/" className="inline-block flex justify-center">
              <img
                src="/logomain.png"
                alt="ProfiLevelUp"
                className="w-32 h-auto opacity-90 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </Link>
            <p className="text-sm text-section-bg/80 leading-relaxed max-w-xs text-center">
            Профиль будущего — система понимания себя и управления решениями.
            </p>
          </div>

          {/* Блок 2: Навигация */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-section-bg mb-4">Навигация</h3>
            <nav className="flex flex-col gap-3">
              <Link
                to="/reviews"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                Отзывы
              </Link>
              <Link
                to="/about"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                О нас
              </Link>
              <Link
                to="/help"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                Поддержка
              </Link>
              <Link
                to="/account"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                Личный кабинет
              </Link>
            </nav>
          </div>

          {/* Блок 3: Соцсети с акцентом */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-section-bg mb-4">Мы в соцсетях</h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 text-primary hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-250 shadow-sm hover:shadow-lg"
                  aria-label={link.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={link.icon} alt="" className="w-7 h-7" aria-hidden="true" />
                </motion.a>
              ))}
            </div>
            <p className="text-xs text-section-bg/60 mt-3">Обновления навигации и новые материалы</p>
          </div>

          {/* Блок 4: Юридическая информация */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-section-bg mb-4">Документы</h3>
            <nav className="flex flex-col gap-3 mb-4">
              <Link
                to="/privacy"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                Политика конфиденциальности
              </Link>
              <Link
                to="/terms"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                Пользовательское соглашение
              </Link>
              <Link
                to="/public-offer"
                className="text-sm text-section-bg/80 hover:text-primary transition-colors w-fit"
              >
                Публичная оферта
              </Link>
            </nav>
            <div className="text-xs text-section-bg/60 space-y-1 leading-relaxed pt-2 border-t border-secondary/20">
              <div>ТОО «ProfiLevelUp»</div>
              <div>БИН 251140010905</div>
              <div>Казахстан, город Алматы, Наурызбайский р-н, мкр. Калкаман-2, ул. Казыбеков М. 100, почтовый индекс A30G2M8</div>
            </div>
          </div>
        </div>

        {/* Нижняя строка с копирайтом */}
        <div className="mt-8 pt-6 border-t border-secondary/30 text-center">
          <div className="space-y-1">
            <div className="text-sm text-section-bg font-medium">
              © 2026 ProfiLevelUp
            </div>         
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
