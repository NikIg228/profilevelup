# Задачи к демо для инвесторов (2 часа)

**Цель:** Реализовать к 10:00 завтра рабочий функционал: БД пользователей, рассылка на email родителю, приём оплаты (Робокасса), промокоды в админке. Сервер PDF не трогаем — только аудит и рекомендации по усилению.

---

## Текущее состояние

| Задача | Статус | Где |
|--------|--------|-----|
| Supabase (регистрация/авторизация) | Частично готово | `prof_oprosnik_v2`: клиент, формы входа/регистрации, Account, useAuthStore |
| SendGrid (письма родителю) | Не реализовано | — |
| Робокасса | Только текст в Публичной оферте | Интеграции нет |
| Промокоды в админке | Нет | Админка есть (модерация отзывов) |
| PDF-сервер | Работает | Только аудит, без правок |

---

## 1. База пользователей (Supabase)

### Что уже есть
- `@supabase/supabase-js` в проекте.
- `src/lib/supabase.ts` — клиент с проверкой anon key.
- `src/stores/useAuthStore.ts` — вход, регистрация, выход, сброс пароля, подгрузка профиля из `profiles`.
- Формы: LoginForm, RegisterForm, ForgotPasswordForm; страница Account.

### Что доделать за 15–20 мин
1. **Supabase Dashboard**
   - Создать проект (если ещё нет).
   - Authentication → Providers: Email включён; при необходимости отключить "Confirm email" для демо или настроить Redirect URL.
   - В Settings → API скопировать URL и anon key.

2. **Переменные окружения (frontend)**
   - В корне `prof_oprosnik_v2` в `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

3. **Таблица `profiles` (если ещё нет)**
   - SQL Editor в Supabase:
   ```sql
   create table if not exists public.profiles (
     id uuid references auth.users on delete cascade primary key,
     email text,
     full_name text,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   -- RLS
   alter table public.profiles enable row level security;
   create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
   create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
   ```
   - Триггер создания профиля при регистрации (если ещё нет в коде/доках):
   ```sql
   create or replace function public.handle_new_user()
   returns trigger as $$
   begin
     insert into public.profiles (id, email, full_name)
     values (new.id, new.email, new.raw_user_meta_data->>'full_name');
     return new;
   end;
   $$ language plpgsql security definer;
   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();
   ```

4. **Проверка**
   - Регистрация нового пользователя, вход, страница Account — всё без ошибок.

---

## 2. SendGrid — рассылка писем родителю

### Идея
После успешной генерации отчёта (или по готовности ссылки на PDF) отправлять родителю на email письмо со ссылкой на отчёт (или текстом «отчёт готов»).

### Где делать
- Логичнее всего в **pb_backend**: после генерации PDF вызывать отправку письма (например, в `report_service` или в endpoint после `generate_pdf_reports`). Тогда фронт не хранит API-ключ SendGrid.

### Шаги (25–35 мин)

1. **SendGrid**
   - Регистрация на sendgrid.com, создание API Key (Rest API Key, полный доступ или только Mail Send).
   - Один отправитель (Sender) верифицировать (email или домен).

2. **Backend (pb_backend)**
   - Установка: `pip install sendgrid`.
   - В `.env` бэкенда: `SENDGRID_API_KEY=SG.xxx`, `SENDGRID_FROM_EMAIL=no-reply@yourdomain.com`, `SENDGRID_FROM_NAME=ProfiLevelUp`.
   - Сервис отправки, например `app/services/email_service.py`:
     - Функция `send_report_ready_to_parent(parent_email: str, child_name: str, report_link_or_text: str)`.
     - Использовать SendGrid Python SDK, шаблон — простой HTML/текст: «Отчёт по тесту для [child_name] готов. Ссылка: …».
   - В месте, где отчёт уже сгенерирован (например в `report_service` или в API после успешной генерации), вызвать эту функцию, передавая `parent_email` из payload (если тариф premium/extended и поле есть). Ошибки отправки логировать, не падать весь запрос.

3. **Фронт**
   - Ничего не обязательно: родительский email уже уходит в payload с теста. Если бэкенд будет отдавать `emailStatus: 'sent'/'failed'`, можно показывать «Письмо отправлено на email родителя» на экране результата.

### MVP за 2 часа
- Минимум: один вызов SendGrid из бэкенда с фиксированным тестовым письмом из endpoint (например GET `/v1/reports/test-email?to=parent@example.com`) для проверки. Затем подвязать вызов к реальному сценарию «отчёт сгенерирован → отправить родителю».

---

## 3. Робокасса — приём оплаты

### Идея
Пользователь выбирает тариф (например Premium), нажимает «Оплатить» → редирект на Робокассу с подписанным запросом → после оплаты Робокасса редиректит на Success URL (и опционально шлёт Result URL на сервер).

### Шаги (30–40 мин)

1. **Робокасса**
   - Регистрация на robokassa.ru (тестовый режим для демо).
   - В личном кабинете: магазин, пароль #1 и пароль #2, Result URL (например `https://your-backend.com/v1/payments/result`), Success URL (например `https://yoursite.com/payment/success`), Fail URL.

2. **Backend (pb_backend)**
   - Endpoint для формирования платежа, например `POST /v1/payments/create`:
     - Тело: `{ "tariff": "premium" | "extended", "testId": "...", "userId": "...", "email": "...", "amount": 990 }` (amount можно считать на бэкенде по тарифу).
     - Считаем подпись по правилам Робокассы (MerchantLogin:OutSum:InvId:Password1, MD5).
     - Ответ: `{ "paymentUrl": "https://auth.robokassa.ru/Merchant/Index.aspx?..." }`.
   - Переменные: `ROBOKASSA_LOGIN`, `ROBOKASSA_PASSWORD1`, `ROBOKASSA_PASSWORD2`, `ROBOKASSA_TEST=1` для теста.
   - Result URL (GET или POST): принять запрос от Робокассы, проверить подпись (Password2), обновить заказ в БД (если заказы храним) или просто логировать. Ответ Робокассе: `OK<InvId>`.

3. **Frontend (prof_oprosnik_v2)**
   - Страница/модалка «Оплатить» для выбранного тарифа (например после выбора Premium на главной или перед стартом теста).
   - Вызов `POST /v1/payments/create` с тарифом и при необходимости testId/userId/email.
   - Редирект на `paymentUrl`.
   - Страницы ` /payment/success` и `/payment/fail` с текстом «Оплата прошла» / «Оплата не прошла».

4. **Связь оплаты и доступа**
   - Минимум для демо: после Success редиректа считать, что пользователь «оплатил» (можно записать в Supabase таблицу `purchases` или в профиль флаг/тариф). При входе в платный тест проверять наличие такой записи.

### MVP за 2 часа
- Backend: один endpoint формирования `paymentUrl` с подписью; простой Result handler с проверкой подписи.
- Frontend: кнопка «Оплатить» → запрос к бэку → редирект на Робокассу; страницы success/fail.

---

## 4. Промокоды в админке

### Идея
В админ-панели — раздел «Промокоды». Создание кода (название, скидка % или фикс, срок действия, лимит использований). При вводе промокода на сайте (на шаге оплаты/выбора тарифа) — применение скидки.

### Шаги (25–35 мин)

1. **Supabase**
   - Таблица `promo_codes`:
   ```sql
   create table public.promo_codes (
     id uuid default gen_random_uuid() primary key,
     code text unique not null,
     discount_percent int check (discount_percent >= 0 and discount_percent <= 100),
     discount_fixed int check (discount_fixed >= 0),
     valid_from timestamptz default now(),
     valid_until timestamptz,
     max_uses int,
     used_count int default 0,
     created_at timestamptz default now()
   );
   alter table public.promo_codes enable row level security;
   -- Политика: только админы (через service role или отдельная роль). Для чтения с фронта — отдельная политика "select for authenticated" или проверка кода через Edge Function / backend.
   ```
   - Для проверки кода с фронта без выдачи прав на всю таблицу лучше: либо RPC `check_promo_code(code text)`, либо backend endpoint.

2. **Backend (опционально, но предпочтительно)**
   - `GET /v1/promo/validate?code=SUMMER20` или `POST /v1/promo/validate` с телом `{ "code": "SUMMER20" }`.
   - Ответ: `{ "valid": true, "discount_percent": 20 }` или `{ "valid": false }`. Так не светим логику и лимиты на клиенте.

3. **Админка (prof_oprosnik_v2)**
   - В `Admin.tsx` добавить вкладку/секцию «Промокоды».
   - Форма: код (текст), тип скидки (% или фикс), значение, дата окончания, макс. использований.
   - Сохранение в Supabase: через клиент с правами (если админ логинится через Supabase — отдельная роль и политика) или через backend `POST /v1/promo` (только для админов по API key / сессии).
   - Список созданных промокодов (таблица).

4. **Фронт при оплате/выборе тарифа**
   - Поле ввода промокода, кнопка «Применить».
   - Вызов `GET /v1/promo/validate?code=...` (или Supabase RPC).
   - При `valid: true` показать скидку и пересчитать сумму; передавать код в запрос создания платежа. Backend при создании платежа пересчитывает сумму с учётом промокода и при успешной оплате увеличивает `used_count`.

### MVP за 2 часа
- Таблица в Supabase, ручное добавление промокодов через SQL или простую форму в админке (запись через Supabase с ограниченными правами).
- Один endpoint валидации промокода на бэкенде.
- На фронте: поле промокода на шаге перед оплатой, применение скидки к сумме и передача кода в запрос создания платежа.

---

## 5. Аудит PDF-сервера (без правок, только отчёт)

Провести быстрый аудит и зафиксировать слабые места и рекомендации.

### Что проверить
- **Авторизация:** Есть ли проверка JWT/API key на `POST /v1/reports`? Если нет — любой может слать запросы и генерировать PDF.
- **Rate limiting:** Нет лимитов по IP/ключу — риск DDoS и перегрузки.
- **Размер тела:** Ограничение на размер payload (и лимит в FastAPI) — иначе большие запросы могут положить сервер.
- **Валидация payload:** Жёсткая валидация через Pydantic и validator — хорошо; проверить, что нет инъекций в путях (moduleId и т.д.).
- **Секреты:** Все секреты (пути к модулям, ключи) только из env, не захардкожены.
- **Логирование:** Не логировать личные данные (email, ФИО) в открытом виде; только jobId и статусы.
- **Таймауты:** Конвертация DOCX→PDF с таймаутом, чтобы зависший процесс не копил воркеры.
- **Очередь:** Сейчас генерация синхронная в запросе; при большом наплыве лучше очередь (Redis + worker) и статус по jobId.

### Итог аудита
- Краткий список: что уже ок, что критично усилить до продакшена (авторизация, лимиты, таймауты), что улучшить позже (очередь, логи).

---

## Порядок работ на 2 часа

| Очередь | Задача | Время |
|--------|--------|-------|
| 1 | Supabase: .env, таблица profiles, триггер, проверка входа/регистрации | 15–20 мин |
| 2 | SendGrid: ключ, сервис на бэке, вызов после генерации отчёта (или тестовый endpoint) | 25–30 мин |
| 3 | Робокасса: endpoint создания платежа + Result, кнопка и success/fail на фронте | 30–40 мин |
| 4 | Промокоды: таблица Supabase, endpoint validate, форма в админке, применение на шаге оплаты | 25–35 мин |
| 5 | Аудит PDF: пройтись по пунктам, записать в тот же или отдельный MD | 10–15 мин |

Итого укладываемся в 2 часа при фокусе на MVP: всё работает по сценарию «регистрация → выбор тарифа → промокод → оплата → письмо родителю», без глубокой доработки дизайна и краевых случаев.

---

## Чек-лист перед демо

- [ ] Регистрация и вход работают (Supabase).
- [ ] После «оплаты» в тестовом режиме Робокассы пользователь попадает на success и видит подтверждение.
- [ ] Промокод вводится перед оплатой, скидка отображается и учитывается в сумме.
- [ ] После генерации отчёта (или по тестовому запросу) на email родителя приходит письмо (SendGrid).
- [ ] В админке можно создать новый промокод и он появляется в списке.
- [ ] Аудит PDF зафиксирован в документе, критичные пункты помечены.

Удачи на демо.
