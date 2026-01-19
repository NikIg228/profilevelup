import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <section className="container-balanced pt-6 lg:pt-8 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-6 md:p-8 grid gap-5"
      >
        <div className="grid gap-4 relative">
          {/* Верхняя золотая полоса */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-60"></div>
          
          {/* Заголовок между полосами */}
          <div className="relative flex flex-col items-center gap-2 mb-2">
            <h1 className="text-3xl font-semibold relative z-10">Политика конфиденциальности</h1>
            {/* Нижняя золотая полоса */}
            <div className="w-16 h-0.5 bg-primary/40"></div>
          </div>
          
          {/* Подзаголовок с декоративными элементами */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
            <div className="pl-6 relative">
              <p className="text-muted">
                Настоящая Политика конфиденциальности регулирует порядок обработки и защиты персональных данных пользователей сервиса
                ProfiLevelUp, расположенного на сайте <a href="https://profilevelup.com" className="text-primary underline">https://profilevelup.com</a> (далее — «Сервис»).
              </p>
              <p className="text-muted mt-2">Используя Сервис, вы подтверждаете, что прочитали и согласны с настоящей Политикой.</p>
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary/30 rounded-full opacity-60"></div>
          </div>
        </div>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">1. Какие данные мы собираем</h2>
          <p className="text-muted">Мы можем собирать следующие данные:</p>
          <ul className="list-disc list-inside text-muted">
            <li>Имя и/или псевдоним;</li>
            <li>Возраст / дата рождения (если указан);</li>
            <li>Пол;</li>
            <li>Контактный email и/или номер телефона (если указан);</li>
            <li>Ответы на вопросы тестов и опросов;</li>
            <li>Технические данные (IP-адрес, cookies, данные браузера — автоматически);</li>
            <li>Информацию, которую пользователь предоставляет самостоятельно.</li>
          </ul>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">2. Цель сбора данных</h2>
          <p className="text-muted">Мы используем данные только для:</p>
          <ul className="list-disc list-inside text-muted">
            <li>предоставления результатов тестов и аналитики;</li>
            <li>улучшения качества сервиса и персонализации;</li>
            <li>обратной связи и поддержки;</li>
            <li>рассылки полезных материалов, предложений, уведомлений (с согласия пользователя);</li>
            <li>аналитических и статистических целей.</li>
          </ul>
          <p className="text-muted">Мы не передаём личную информацию третьим лицам, за исключением случаев, предусмотренных законом.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">3. Отправка рассылок</h2>
          <p className="text-muted">
            Ставя галочку перед началом теста и/или оставляя контакты, пользователь даёт согласие на получение:
          </p>
          <ul className="list-disc list-inside text-muted">
            <li>результатов теста;</li>
            <li>образовательных материалов;</li>
            <li>уведомлений о сервисе;</li>
            <li>специальных предложений и новостей.</li>
          </ul>
          <p className="text-muted">Пользователь может отказаться от рассылки в любой момент по ссылке внутри письма.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">4. Хранение данных</h2>
          <p className="text-muted">
            Мы храним данные в безопасном виде и принимаем разумные меры защиты от несанкционированного доступа.
            Данные могут быть удалены пользователем по запросу.
          </p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">5. Cookies</h2>
          <p className="text-muted">Сервис может использовать файлы cookies для:</p>
          <ul className="list-disc list-inside text-muted">
            <li>улучшения работы сайта;</li>
            <li>аналитики поведения пользователей;</li>
            <li>персонализации контента.</li>
          </ul>
          <p className="text-muted">Пользователь может отключить cookies в настройках браузера.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">6. Передача третьим лицам</h2>
          <p className="text-muted">
            Мы не продаём и не передаём персональные данные без согласия пользователя.
            Исключения: требования законодательства Республики Казахстан.
          </p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">7. Права пользователя</h2>
          <p className="text-muted">Пользователь имеет право:</p>
          <ul className="list-disc list-inside text-muted">
            <li>запросить копию своих данных;</li>
            <li>потребовать исправления или удаления информации;</li>
            <li>отказаться от рассылок;</li>
            <li>отозвать согласие на обработку данных.</li>
          </ul>
          <p className="text-muted">
            Запросы направляются по адресу: <a href="mailto:support@profilevelup.com" className="text-primary underline">support@profilevelup.com</a>
          </p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">8. Изменения политики</h2>
          <p className="text-muted">Мы можем обновлять данную Политику. Актуальная версия всегда доступна на сайте.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">9. Контакты</h2>
          <p className="text-muted">
            Если у вас есть вопросы по Политике и защите данных, напишите нам:<br />
            📧 <a href="mailto:support@profilevelup.com" className="text-primary underline">support@profilevelup.com</a>
          </p>
        </section>
      </motion.div>
    </section>
  );
}
