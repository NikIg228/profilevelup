export default function PrivacyPage() {
  return (
    <section className="container-balanced mt-10 mb-16">
      <div className="card p-6 md:p-8 grid gap-5">
        <div className="grid gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">Политика конфиденциальности</h1>
          <div className="text-muted">           
          </div>
          <p className="text-muted">
            Настоящая Политика конфиденциальности регулирует порядок обработки и защиты персональных данных пользователей сервиса
            ProfiLevelUp, расположенного на сайте <a href="https://profilevelup.com" className="text-primary underline">https://profilevelup.com</a> (далее — «Сервис»).
          </p>
          <p className="text-muted">Используя Сервис, вы подтверждаете, что прочитали и согласны с настоящей Политикой.</p>
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
      </div>
    </section>
  );
}
