# Единая спецификация API ProfiLevelUp

Документ описывает текущее состояние API на фронте и целевую структуру API для фронта и бэкенда.

**Архитектура развертывания:** см. `DEPLOYMENT.md` и `pb_backend/docs/DEPLOYMENT_ARCHITECTURE.md`

---

## Часть 1. Текущее состояние (фронт)

### 1.1 Что реализовано на фронте

| Область | Endpoint | Где используется | Формат тела/ответа | Бэкенд |
|--------|----------|------------------|----------------------|--------|
| **Сессия теста** | `POST /api/test/start` | useTestStore: createTestSession | Body: `{ tariff, ageGroup, userId?, email?, timestamp }`. Ответ: `{ testId }` | Не реализован (фронт fallback: `local_*` testId) |
| **Прогресс** | `PUT /api/test/progress/:testId` | useTestStore: syncProgress, syncImmediate | Body: `{ step, answers, timestamp }` | Не реализован |
| **Прогресс** | `GET /api/test/progress/:testId` | useTestStore: loadFromServer | Ответ: `{ step, answers, updatedAt }` | Не реализован |
| **Завершение** | `POST /api/test/complete/:testId` | useTestStore: markTestCompleted | Body: `{ completedAt, timestamp }` | Не реализован |
| **Отчёт** | `POST /api/v1/reports` | reportApi.submitReportJob | Body: **payload_v1** (см. PAYLOAD_V1_SPEC.md) | Не реализован |
| **Статус job** | `GET /api/v1/reports/:jobId` | reportApi.checkReportJobStatus | Ответ: `{ jobId, status, childUrl?, emailStatus?, error? }` | Не реализован |

### 1.2 Единый формат payload_v1 ✅

- **Фронт и бэкенд** используют единый формат **payload_v1** согласно `PAYLOAD_V1_SPEC.md`.
- **Фронт** использует `buildPayload` (engine/buildPayload.ts) для генерации payload_v1.
- **reportApi** получает данные пользователя из `sessionStorage['profi.user']` и преобразует их для `buildPayload`.
- Формат v3 (`v: 3`, `result: { moduleId, childPlaceholders }`) **больше не используется** и удалён из кода.

---

## Часть 2. Единая структура API (фронт + бэкенд)

### 2.1 Базовые правила

- **Префикс**: все эндпоинты под префиксом `/api`.
- **Версионирование отчётов**: контракт тела отчёта — **payload_v1** (см. п. 2.4). Эндпоинты отчётов могут быть с префиксом `/api/v1/` для ясности (например `/api/v1/reports`).
- **Content-Type**: запросы с телом — `application/json`; ответы — `application/json`.
- **Коды ответов**: 200/201 — успех; 400 — ошибка валидации; 404 — не найдено; 500 — ошибка сервера.

### 2.2 Test API (сессия и прогресс теста)

Назначение: создание сессии теста, сохранение и загрузка прогресса (step, answers), завершение сессии. Реализовано на фронте; бэкенд должен реализовать те же контракты.

| Метод | Путь | Назначение | Тело запроса | Ответ |
|-------|------|------------|--------------|--------|
| POST | `/api/test/start` | Создать сессию теста | `{ tariff, ageGroup, userId?, email?, timestamp }` | `201` `{ testId: string }` |
| PUT | `/api/test/progress/:testId` | Сохранить прогресс | `{ step: number, answers: object, timestamp: string }` | `200` `{}` или `{ updatedAt: string }` |
| GET | `/api/test/progress/:testId` | Получить прогресс | — | `200` `{ step, answers, updatedAt }` или `404` |
| POST | `/api/test/complete/:testId` | Завершить сессию | `{ completedAt: string, timestamp?: string }` | `200` `{}` или `204` |

- **tariff**: `"FREE"` \| `"EXTENDED"` \| `"PREMIUM"`.
- **ageGroup**: строка возрастной группы (например `"12-17"`, `"18-20"`, `"21+"`) — как на фронте в конфигах.
- **answers**: объект ключ–значение (номера вопросов и ответы); формат зависит от тарифа (FREE: 1–5, VIP: 1–28, значения по конфигу).

### 2.3 Report API (генерация PDF-отчётов)

Назначение: принять payload_v1, сгенерировать отчёт(ы), отдать ссылку/статус и при необходимости отправить письма. Контракт тела — только **payload_v1** (см. п. 2.4).

| Метод | Путь | Назначение | Тело запроса | Ответ |
|-------|------|------------|--------------|--------|
| POST | `/api/v1/reports` | Создать задачу генерации отчёта | **payload_v1** (JSON) | `202` `{ jobId: string, status: "pending" \| "processing" }` |
| GET | `/api/v1/reports/:jobId` | Статус задачи | — | `200` `{ jobId, status: "pending" \| "processing" \| "completed" \| "failed", childUrl?, emailStatus?, error? }` |
| POST | `/api/v1/validate-payload` | Только валидация payload (без генерации) | **payload_v1** (JSON) | `200` `{ valid: true }` или `400` `{ error, message?, field? }` |

- Для совместимости с текущим фронтом бэкенд может дополнительно поддерживать старые пути (например `POST /api/report-jobs` → тот же handler, что и `POST /api/v1/reports`), но тело в любом случае — **payload_v1**.
- **childUrl** — ссылка на скачивание PDF для пользователя (если отдача по ссылке предусмотрена).
- **emailStatus** — статус отправки на email (`pending` \| `sent` \| `failed`).

### 2.4 Контракт payload_v1 (отчёт)

Единый формат для передачи данных от фронта к бэкенду при генерации отчёта. 

**Полная спецификация**: см. `PAYLOAD_V1_SPEC.md`

**Краткое описание**:

**Обязательные поля (все тарифы):**

```ts
{
  version: "payload_v1",
  testId: string,
  tariff: "FREE" | "EXTENDED" | "PREMIUM",
  completedAt: string,        // ISO 8601
  ageBucket: "12_14" | "15_17" | "18_20" | "21_plus",
  user: {
    fullName: string,         // UPPERCASE
    email: string,
    age: number,
    gender: "male" | "female"
  },
  moduleId: string,           // например "ENTJ", "INFW"
  placeholdersBase: {
    USER_FULL_NAME: string,
    REPORT_DATE: string       // "DD MON YYYY", например "24 JAN 2026"
  }
}
```

**Опционально (EXTENDED / PREMIUM):**

```ts
{
  placeholdersExtended?: {
    AXIS_SOCIAL_VALUE: number,
    AXIS_FOCUS_VALUE: number,
    AXIS_DECISION_VALUE: number,
    AXIS_STRUCTURE_VALUE: number,
    AXIS_MOTIVATION_VALUE: number,
    AXIS_ACTIVATION_VALUE: number,
    AXIS_COMMUNICATION_VALUE: number,
    META_EXPRESSIVENESS_VALUE: number,
    META_EXPRESSIVENESS_TEXT: string,
    META_CONFIDENCE_VALUE: number,
    META_CONFIDENCE_TEXT: string,
    SUMMARY_MOTIVATION: string,
    SUMMARY_ACTIVATION: string,
    SUMMARY_COMMUNICATION: string
  }
}
```

**Опционально (только PREMIUM):**

```ts
{
  parent?: {
    enabled: true,
    email: string
  }
}
```

**Правила:**

- FREE: нет `placeholdersExtended`, нет `parent`.
- EXTENDED: есть `placeholdersExtended`, нет `parent`.
- PREMIUM: есть `placeholdersExtended` и `parent`.
- В payload не должно быть поля `answers`.

### 2.5 Формат ошибок API

Ответ при ошибке (4xx/5xx):

```ts
{
  error: string,        // код, например "VALIDATION_ERROR", "NOT_FOUND"
  message?: string,     // человекочитаемое описание
  field?: string        // путь к полю (для валидации)
}
```

---

## Часть 3. Рекомендации по реализации

### Фронт ✅

1. **Отправка отчёта**: ✅ Реализовано — используется **payload_v1** через `buildPayload` (engine/buildPayload.ts). Данные пользователя получаются из `sessionStorage['profi.user']` и преобразуются в формат для `buildPayload`. Формат v3 удалён.
2. **Report API**: ✅ Реализовано — отправляет POST на `/api/v1/reports` с телом payload_v1. Ответ обрабатывается как `{ jobId, status, ... }`.
3. **Test API**: ✅ Реализовано — текущие пути и тела готовы для подключения бэкенда.

### Бэкенд

1. **Report API**: принимать только **payload_v1**; валидация по правилам из rules.md (версия, тариф, обязательные поля, тарифные правила, без answers).
2. **Test API**: реализовать `/api/test/start`, `/api/test/progress/:testId` (PUT + GET), `/api/test/complete/:testId` по контрактам выше.
3. Опционально: `POST /api/v1/validate-payload` для проверки payload без генерации отчёта.

---

## Сводная таблица эндпоинтов

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/test/start` | Создать сессию теста |
| PUT | `/api/test/progress/:testId` | Сохранить прогресс |
| GET | `/api/test/progress/:testId` | Получить прогресс |
| POST | `/api/test/complete/:testId` | Завершить сессию |
| POST | `/api/v1/reports` | Создать задачу генерации отчёта (body: payload_v1) |
| GET | `/api/v1/reports/:jobId` | Статус задачи отчёта |
| POST | `/api/v1/validate-payload` | Валидация payload_v1 (опционально) |
