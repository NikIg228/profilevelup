# Оплата Robokassa — URL и настройка

## Полный цикл

1. **Инициация** — пользователь нажимает «Получить расширенный разбор» на странице результата VIP. Фронт вызывает `POST /api/payment/create` (бэкенд), получает `payment_url` и делает редирект на Robokassa.
2. **Оплата** — пользователь платит на сайте Robokassa.
3. **Result URL** — Robokassa шлёт callback на бэкенд `POST /api/payment/result`; бэкенд проверяет подпись и отвечает `OK<InvId>`.
4. **Success / Fail** — Robokassa перенаправляет пользователя на фронт: `/payment/success` или `/payment/fail`.

## Методы (GET/POST)

| URL | Метод | Причина |
|-----|--------|---------|
| **Result Url** | **POST** | Сервер→сервер, безопаснее для подписи |
| **Success Url** | **GET** | Редирект браузера, параметры в query |
| **Fail Url** | **GET** | Редирект браузера, параметры в query |

## Адреса в личном кабинете Robokassa

Подставьте свой домен вместо `https://profilevelup.com`. Если бэкенд на отдельном домене — Result Url указывайте на бэкенд.

### Result Url (callback от Robokassa)
- **URL:** `https://ваш-бэкенд.com/api/payment/result` (например `https://api.profilevelup.com/api/payment/result`)
- **Метод:** **POST** (рекомендуется). Поддерживается и GET.

### Success Url
- **URL:** `https://profilevelup.com/payment/success`
- **Метод:** **GET**

### Fail Url
- **URL:** `https://profilevelup.com/payment/fail`
- **Метод:** **GET**

## Переменные окружения бэкенда (.env)

В корне **pb_backend** создайте/дополните `.env`:

```env
# Robokassa — инициация платежа (ссылка на оплату)
ROBOKASSA_MERCHANT_LOGIN=ваш_логин_магазина
ROBOKASSA_PASSWORD1=пароль_1

# Robokassa — проверка callback Result URL
ROBOKASSA_PASSWORD2=пароль_2

# Тестовый режим: 1 — тест, 0 — бой (или true/false)
ROBOKASSA_IS_TEST=true

# Базовый URL фронта для SuccessUrl/FailUrl (опционально, иначе берутся из настроек магазина в Robokassa)
FRONTEND_BASE_URL=https://profilevelup.com

# URL страницы Robokassa (по умолчанию auth.robokassa.ru; для .kz при необходимости заменить)
# ROBOKASSA_BASE_URL=https://auth.robokassa.ru/Merchant/Index.aspx
```

Пароли №1 и №2 берутся из личного кабинета Robokassa (раздел магазина → технические настройки / тестовые платежи).

## Фронт

- Страницы результата оплаты: `/payment/success`, `/payment/fail`.
- Инициация: кнопка «Получить расширенный разбор» на `/result/vip` вызывает `POST /api/payment/create` и перенаправляет на `payment_url`.

## Проверка после выкладки

1. Выложить фронт и бэкенд на хостинг.
2. В Robokassa указать Result URL, Success URL, Fail URL на реальные адреса.
3. В `.env` бэкенда задать `ROBOKASSA_MERCHANT_LOGIN`, `ROBOKASSA_PASSWORD1`, `ROBOKASSA_PASSWORD2`, при необходимости `FRONTEND_BASE_URL`.
4. Убедиться, что Result URL доступен извне (Robokassa должна достучаться до бэкенда по HTTPS).
5. Пройти сценарий: результат VIP → «Получить расширенный разбор» → оплата (в тесте) → возврат на Success/Fail и срабатывание Result URL.
