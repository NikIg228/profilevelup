# ProfiLevelUp — обзор проекта

Краткое техническое описание системы: фронт (опросник + результаты) и бэкенд (генерация PDF-отчётов).

---

## Что это

**ProfiLevelUp** — сервис профориентационного тестирования с тремя тарифами:

- **FREE** — короткий тест, один текстовый отчёт (модуль .docx без шаблона).
- **EXTENDED** — расширенный тест, отчёт с метриками и осями, модуль вставляется в `template_main.docx`.
- **PREMIUM** — то же, что EXTENDED, плюс отдельный упрощённый отчёт для родителя на `parent.email`.

Фронт собирает ответы, считает профиль и метрики, формирует **payload_v1** и может отправлять его на бэкенд. Бэкенд валидирует payload, подбирает модули по тарифу/возрасту/полу/профилю, собирает .docx, конвертирует в PDF и отдаёт/отправляет отчёты.

---

## Структура workspace

- **prof_oprosnik_v2** — фронтенд (React + Vite + TypeScript).
- **pb_backend** — бэкенд/ресурсы: правила, примеры payload, модули .docx, скрипт генерации .docx (пока без полноценного API/PDF/email).

---

## Фронтенд (prof_oprosnik_v2)

### Стек

- React 18, React Router 6, Vite 7, TypeScript, Tailwind, Zustand, Zod, Supabase, Framer Motion, GSAP, Swiper.

### Маршруты

- `/` — главная (выбор формата теста).
- `/test/free`, `/test/extended`, `/test/premium` — прохождение теста (FREE / EXTENDED / PREMIUM).
- `/result/free`, `/result/vip` — страницы результатов.
- Остальное: reviews, about, privacy, terms, help, account, admin и т.д.

### Движок теста и payload

- **Конфиги**: `src/engine/getTestConfig.ts` — подгрузка JSON по типу теста и возрастной группе (12-17, 18-20, 21+).
- **FREE**: `engine/free/resolveFree.ts` — код профиля по ответам (1–5).
- **VIP (EXTENDED/PREMIUM)**: `engine/resolveVipMetrics.ts`, `engine/vip/resolveVip.ts`, `engine/vip/textPicker.ts` — оси, мета-метрики, тексты по возрасту, код профиля (A/B, 28 вопросов).
- **Сборка payload**: `engine/buildPayload.ts` — из ответов и данных пользователя собирает объект в формате **payload_v1** (version, testId, tariff, completedAt, ageBucket, user, moduleId, placeholdersBase, при EXTENDED/PREMIUM — placeholdersExtended, при PREMIUM — parent).
- **Типы и валидация**: `types/payload.ts` — Zod-схемы и типы (Tariff, PayloadV1, PlaceholdersBase/Extended, parent и т.д.).

### Утилиты

- Возраст: `ageBucket`, `ageGroup`, `ageUtils` — маппинг в `12_14 | 15_17 | 18_20 | 21_plus`.
- Пол: `genderNormalizer` — к `male` | `female`.
- Дата: `dateFormat` — отчёт в формате "DD MON YYYY".
- Имя: `textUtils` — нормализация (UPPERCASE для payload).
- Отправка на бэкенд: `reportApi.ts` — вызов `/api/report-jobs`; `reportPayload.ts` — формирование тела запроса из конфига и ответов.

### Состояние и UX теста

- `useTestStore` — текущий тест, ответы, конфиг.
- `useExitConfirmStore` + `useTestExitConfirmation` — подтверждение выхода.
- `useTestSaveOnUnload` — предупреждение при уходе и синхронизация прогресса (step, answers) на API; payload пользователю не отдаётся и не скачивается.

### Страницы теста

- `TestingFree`, `TestingExtended`, `TestingPremium` — обёртки; общая логика в `TestingPageContent.tsx` (или аналог). Результаты — `ResultFree.tsx`, `ResultVip.tsx`.

Итог: фронт полностью ведёт расчёт профиля и метрик, собирает payload_v1 и при наличии бэкенда шлёт его на генерацию отчёта.

---

## Бэкенд (pb_backend)

Полное описание — в **pb_backend/rules.md**.

### Назначение

- Приём **payload_v1** от фронта.
- Валидация (версия, тариф, обязательные поля, тарифные правила, без `answers`).
- Выбор модулей по тарифу, ageBucket, полу (где есть), категории E/I/Z по первой букве `moduleId`.
- Сборка .docx: для FREE и PREMIUM (родитель) — один модуль; для EXTENDED и PREMIUM (ребёнок) — модуль из `extended/` вставляется в `template_main.docx`, подставляются плейсхолдеры.
- Конвертация в PDF и доставка (email/API) — по правилам из rules.md.

### Ресурсы в репозитории

- **rules.md** — спецификация payload, структура модулей, логика по тарифам, плейсхолдеры, маппинг ageBucket и категорий, рекомендации по реализации (FastAPI, python-docx, docx2pdf и т.д.).
- **modules/** — рабочие .docx модули (free / extended / premium по возрастам и полу).
- **generator_test_modules/** — тестовые модули для скрипта (extended, free, premium).
- **template_main.docx** — шаблон для EXTENDED и для отчёта ребёнка в PREMIUM.
- **payload_examples/** — примеры payload (free, extended, premium).
- **docx_generator.py** — скрипт генерации .docx по payload (использует generator_test_modules, маппинг ageBucket, категорию по moduleId).

### Тарифы и модули (кратко)

| Тариф     | Отчёт для   | Источник модуля   | Шаблон template_main | Плейсхолдеры        |
|----------|-------------|-------------------|----------------------|---------------------|
| FREE     | user        | modules/free/...  | нет                  | только base         |
| EXTENDED | user        | modules/extended/... | да                | base + extended     |
| PREMIUM  | user        | modules/extended/... | да                | base + extended     |
| PREMIUM  | parent      | modules/premium/...  | нет               | только base         |

Маппинг ageBucket: `12_14`→`12-14`, `15_17`→`15-17`, `18_20`→`18-20`, `21_plus`→`21+`. Категория папки: первая буква `moduleId` (E / I / Z).

---

## Связка фронт ↔ бэкенд

- Фронт отдаёт **payload_v1** (без поля `answers`): version, testId, tariff, completedAt, ageBucket, user, moduleId, placeholdersBase; при EXTENDED/PREMIUM — placeholdersExtended; при PREMIUM — parent.
- Бэкенд (по rules.md) принимает этот payload (например, POST `/api/v1/generate-report` или единый `/api/report-jobs`), валидирует, выбирает модули, генерирует PDF и отправляет на email.
- В фронте вызов к бэкенду описан в `reportApi.ts` (endpoint и обёртка над `reportPayload`).

---

## Итог

- **Фронт**: опросник с тремя тарифами, расчёт профиля и метрик, сборка payload_v1, сохранение прогресса, отправка на бэкенд.
- **Бэкенд**: описан в rules.md; в репо — правила, модули, шаблон, примеры payload и скрипт docx_generator; полноценный API (PDF, email, БД) — в правилах как целевая архитектура.

Один .md с тезисами: **docs/PROJECT_OVERVIEW.md** (этот файл).
