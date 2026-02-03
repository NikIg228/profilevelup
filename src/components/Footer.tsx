import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

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

const email = "support@profilevelup.com";
const mailto = `mailto:${email}?subject=${encodeURIComponent("Обращение в поддержку")}`;

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.3 }}
      className="mt-16 border-t border-secondary/30 bg-heading"
    >
      <div className="container-balanced py-3">
        {/* Основной контент футера */}
        <div className="grid gap-8 md:grid-cols-4 md:gap-6 lg:gap-10">
          {/* Блок 1: Логотип и описание */}
          <div className="px-8 md:px-0 md:col-span-1 flex flex-row items-center gap-3 md:flex-col md:space-y-4 md:items-center">
            <Link to="/" className="flex-shrink-0 md:inline-block md:flex md:justify-center">
              <img
                src="/logomain.png"
                alt="ProfiLevelUp"
                className="w-20 h-auto md:w-32 opacity-90 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </Link>
            <p className="text-sm text-section-bg/80 leading-relaxed flex-1 md:max-w-xs md:text-center">
            Система понимания себя и управление решениями.
            </p>
          </div>

          {/* Блок 2: Навигация */}
          <div className="hidden md:block md:col-span-1">
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
          <div className="md:col-span-1 flex flex-row gap-4 md:flex-col">
            {/* Документы - слева на mobile */}
            <div className="flex-1 md:flex-none">
              <h3 className="text-sm font-semibold text-section-bg mb-4">Документы</h3>
              <nav className="flex flex-col gap-3 mb-4 md:mb-0">
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
            </div>
            {/* Информация о компании - справа на mobile */}
            <div className="flex-1 md:flex-none">
              <div className="text-xs text-section-bg/60 space-y-1 leading-relaxed pt-2 md:border-t md:border-secondary/20">
                <div>ТОО «ProfiLevelUp»</div>
                <div>БИН 251140010905</div>
                <div>Казахстан, город Алматы, Наурызбайский р-н, мкр. Калкаман-2, ул. Казыбеков М. 100, почтовый индекс A30G2M8</div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя строка с копирайтом */}
        <div className="mt-2 pt-2 border-t border-secondary/30 text-center">
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
