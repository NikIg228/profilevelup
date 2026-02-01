# Реализация единого формата payload_v1

Документ описывает реализацию единого формата payload_v1 для фронта и бэкенда.

---

## ✅ Выполнено

### 1. Единый формат payload_v1

- ✅ Создан единый формат payload_v1 для всех тарифов (FREE, EXTENDED, PREMIUM)
- ✅ Спецификация: `PAYLOAD_V1_SPEC.md` (в обоих проектах)
- ✅ Валидация через `validatePayload` (utils/validatePayload.ts)
- ✅ Типы через Zod схему (types/payload.ts)

### 2. Обновлён reportApi

- ✅ `reportApi.ts` теперь использует `buildPayload` (payload_v1) вместо `buildReportPayload` (v3)
- ✅ Endpoint изменён на `/api/v1/reports` (совместимость со старым `/api/report-jobs` можно добавить на бэкенде)
- ✅ Данные пользователя получаются из `sessionStorage['profi.user']` и преобразуются для `buildPayload`
- ✅ Payload валидируется перед отправкой через `validatePayload`

### 3. Удалён формат v3

- ✅ Удалён файл `utils/reportPayload.ts` (содержал формат v3)
- ✅ Удалены функции `buildReportPayload`, `buildFreePayload`, `buildExtendedPayload`, `buildPremiumPayload`
- ✅ Все запросы теперь используют payload_v1

### 4. Документация

- ✅ Обновлён `API_SPEC.md` — отражает единый формат payload_v1
- ✅ Создан `PAYLOAD_V1_SPEC.md` — полная спецификация формата
- ✅ Документы синхронизированы между фронтом и бэкендом

---

## 📋 Структура payload_v1

### Обязательные поля (все тарифы)

```typescript
{
  version: "payload_v1",
  testId: string,
  tariff: "FREE" | "EXTENDED" | "PREMIUM",
  completedAt: string,  // ISO 8601
  ageBucket: "12_14" | "15_17" | "18_20" | "21_plus",
  user: {
    fullName: string,   // UPPERCASE
    email: string,
    age: number,
    gender: "male" | "female"
  },
  moduleId: string,
  placeholdersBase: {
    USER_FULL_NAME: string,
    REPORT_DATE: string  // "DD MON YYYY"
  }
}
```

### Опциональные поля

- **EXTENDED / PREMIUM**: `placeholdersExtended` (7 осей, мета-метрики, текстовые модули)
- **PREMIUM**: `parent` (enabled: true, email)

---

## 🔧 Использование на фронте

### Генерация payload_v1

```typescript
import { buildPayload } from '../engine/buildPayload';
import { validatePayload } from '../utils/validatePayload';
import type { PayloadV1 } from '../types/payload';

// Получаем данные пользователя из sessionStorage
const userData = getUserDataForPayload(); // Внутри reportApi

// Преобразуем answers
const answersRecord = normalizeAnswers(answers);

// Создаём payload_v1
const payload: PayloadV1 = buildPayload({
  testId,
  tariff,
  completedAt,
  user: userData,
  answers: answersRecord,
});

// Валидируем
validatePayload(payload);

// Отправляем на бэкенд
const response = await fetch('/api/v1/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

---

## 🎯 Правила по тарифам

| Тариф | placeholdersExtended | parent |
|-------|---------------------|--------|
| FREE | ❌ Нет | ❌ Нет |
| EXTENDED | ✅ Обязательно | ❌ Нет |
| PREMIUM | ✅ Обязательно | ✅ Обязательно |

---

## ⚠️ Важные замечания

1. **version**: строго `"payload_v1"` (не `"v1"`, не `"payload_v2"`)
2. **user.fullName**: должно быть UPPERCASE и совпадать с `placeholdersBase.USER_FULL_NAME`
3. **user.gender**: строго `"male"` или `"female"` (нормализовано)
4. **ageBucket**: должно соответствовать `user.age`
5. **answers**: поле `answers` НЕ должно присутствовать в payload

---

## 📁 Файлы

### Фронт

- `src/engine/buildPayload.ts` — генерация payload_v1
- `src/types/payload.ts` — Zod схема и типы
- `src/utils/validatePayload.ts` — валидация payload_v1
- `src/utils/reportApi.ts` — отправка payload_v1 на бэкенд
- `docs/PAYLOAD_V1_SPEC.md` — спецификация формата
- `docs/API_SPEC.md` — спецификация API

### Бэкенд

- `docs/PAYLOAD_V1_SPEC.md` — спецификация формата (синхронизирована с фронтом)
- `docs/API_SPEC.md` — спецификация API
- `rules.md` — детальная логика обработки payload_v1
- `payload_examples/` — примеры payload_v1 для каждого тарифа

---

## ✅ Результат

- Единый формат payload_v1 для фронта и бэкенда
- Исключены конфликты форматов (v3 удалён)
- Валидация на фронте перед отправкой
- Полная документация в обоих проектах
- Готовность к реализации бэкенда
