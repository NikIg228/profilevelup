export default function TermsPage() {
  return (
    <section className="container-balanced mt-10 mb-16">
      <div className="card p-6 md:p-8 grid gap-5">
        <div className="grid gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold"> Пользовательское соглашение</h1>
          <div className="text-muted">
          </div>
          <p className="text-muted">
            Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует условия использования онлайн-сервиса
            ProfiLevelUp (далее — «Сервис»).
          </p>
        </div>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">1. Общие положения</h2>
          <p className="text-muted">1.1. Сервис предоставляет доступ к профориентационным тестам, результатам анализа и рекомендациям.</p>
          <p className="text-muted">1.2. Использование Сервиса означает принятие Пользователем условий данного Соглашения.</p>
          <p className="text-muted">1.3. Сервис может обновляться, дополняться и изменяться без уведомления. Актуальная версия доступна на сайте.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">2. Регистрация и доступ</h2>
          <p className="text-muted">2.1. Для получения некоторых материалов и результатов тестирования может потребоваться ввод контактных данных.</p>
          <p className="text-muted">2.2. Пользователь обязуется предоставлять достоверную информацию.</p>
          <p className="text-muted">2.3. Владелец Сервиса вправе ограничить доступ при нарушении правил.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">3. Права и обязанности Пользователя</h2>
          <div>
            <p className="font-medium">Пользователь обязуется:</p>
            <ul className="list-disc list-inside text-muted">
              <li>использовать Сервис только в личных целях;</li>
              <li>не совершать действий, приводящих к нарушению работы сервиса;</li>
              <li>не копировать и не распространять материалы без разрешения правообладателя;</li>
              <li>уважительно взаимодействовать с поддержкой и другими пользователями.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Пользователю запрещено:</p>
            <ul className="list-disc list-inside text-muted">
              <li>использовать результаты и материалы Сервиса в коммерческих целях без согласия владельца;</li>
              <li>размещать вредоносный контент или нарушать законы РК.</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">4. Права и обязанности Сервиса</h2>
          <div>
            <p className="font-medium">Сервис вправе:</p>
            <ul className="list-disc list-inside text-muted">
              <li>сохранять и обрабатывать данные, предоставленные пользователем;</li>
              <li>направлять информационные материалы и уведомления (при согласии пользователя);</li>
              <li>временно ограничивать доступ для технических работ.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Сервис обязуется:</p>
            <ul className="list-disc list-inside text-muted">
              <li>обеспечивать безопасность хранения персональных данных;</li>
              <li>предоставлять услуги в рамках заявленных возможностей.</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">5. Результаты тестирования</h2>
          <p className="text-muted">5.1. Информация, полученная при тестировании, носит аналитический и рекомендательный характер, не является диагнозом или профессиональным заключением.</p>
          <p className="text-muted">5.2. Пользователь самостоятельно несет ответственность за принятие решений на основе результатов.</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">6. Ограничение ответственности</h2>
          <ul className="list-disc list-inside text-muted">
            <li>Сервис не несёт ответственность за технические сбои, вызванные третьими сторонами;</li>
            <li>решения и действия пользователя, основанные на результатах тестирования;</li>
            <li>точность данных, введённых пользователем.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
