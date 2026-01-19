import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <section className="container-balanced pt-6 lg:pt-8 min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        {/* Иконка 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <AlertCircle className="w-24 h-24 text-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-primary">404</span>
            </div>
          </div>
        </motion.div>

        {/* Заголовок */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-heading mb-4"
        >
          Страница не найдена
        </motion.h1>

        {/* Описание */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-muted mb-8 leading-relaxed"
        >
          К сожалению, запрашиваемая страница не существует или была перемещена.
          <br />
          Возможно, вы перешли по неверной ссылке или страница была удалена.
        </motion.p>

        {/* Кнопка возврата */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link
            to="/"
            className="btn btn-primary px-6 py-3 text-center text-base font-bold rounded-xl transition-all duration-300 inline-flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Вернуться на главную
          </Link>
        </motion.div>

        {/* Дополнительные ссылки */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm"
        >
          <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
            Главная
          </Link>
          <span className="text-muted">•</span>
          <Link to="/about" className="text-primary hover:text-primary/80 transition-colors">
            О нас
          </Link>
          <span className="text-muted">•</span>
          <Link to="/reviews" className="text-primary hover:text-primary/80 transition-colors">
            Отзывы
          </Link>
          <span className="text-muted">•</span>
          <Link to="/help" className="text-primary hover:text-primary/80 transition-colors">
            Поддержка
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

