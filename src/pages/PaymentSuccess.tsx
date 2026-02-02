import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, User } from 'lucide-react';

/**
 * Страница успешной оплаты (Success Url).
 * Robokassa перенаправляет сюда пользователя после успешной оплаты.
 * Параметры приходят методом GET (стандарт для редиректов).
 */
export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const invId = searchParams.get('InvId');
  const outSum = searchParams.get('OutSum');

  return (
    <section className="container-balanced pt-6 lg:pt-8 min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto px-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <CheckCircle className="w-24 h-24 text-primary" aria-hidden />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl sm:text-4xl font-semibold text-heading mb-4"
        >
          Оплата прошла успешно
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-muted mb-6 leading-relaxed"
        >
          Спасибо за оплату. Ваш заказ принят в обработку.
          {invId != null && (
            <span className="block mt-2 text-sm">
              Номер заказа: <strong className="text-heading">{invId}</strong>
            </span>
          )}
          {outSum != null && (
            <span className="block text-sm">
              Сумма: <strong className="text-heading">{outSum}</strong> ₽
            </span>
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/result/vip"
            className="btn btn-primary px-6 py-3 text-center text-base font-bold rounded-xl transition-all duration-300 inline-flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Перейти к результату и отчёту
          </Link>
          <Link
            to="/account"
            className="btn border border-primary text-primary hover:bg-primary/10 px-6 py-3 text-center text-base font-bold rounded-xl transition-all duration-300 inline-flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            В личный кабинет
          </Link>
          <Link
            to="/"
            className="btn border border-primary text-primary hover:bg-primary/10 px-6 py-3 text-center text-base font-bold rounded-xl transition-all duration-300 inline-flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
