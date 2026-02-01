# Единая спецификация payload_v1

Документ описывает единый формат payload_v1 для всех тарифов (FREE, EXTENDED, PREMIUM), используемый для передачи данных от фронта к бэкенду при генерации PDF-отчётов.

---

## Версия

**version**: `"payload_v1"` (строго, без вариантов)

---

## Обязательные поля (все тарифы)

```typescript
{
  version: "payload_v1",
  testId: string,                    // Уникальный ID теста
  tariff: "FREE" | "EXTENDED" | "PREMIUM",
  completedAt: string,               // ISO 8601 datetime (например "2025-01-29T10:00:00.000Z")
  ageBucket: "12_14" | "15_17" | "18_20" | "21_plus",  // Вычисляется из user.age
  user: {
    fullName: string,                 // ВСЕГДА UPPERCASE (например "IVAN PETROV")
    email: string,                    // Валидный email
    age: number,                      // Положительное целое число (12-90)
    gender: "male" | "female"        // СТРОГО "male" или "female" (нормализовано)
  },
  moduleId: string,                  // Код профиля (например "ENTJ", "INFW", "ZNFJ")
  placeholdersBase: {
    USER_FULL_NAME: string,          // Должен совпадать с user.fullName (UPPERCASE)
    REPORT_DATE: string               // Формат "DD MON YYYY" (например "29 JAN 2025")
  }
}
```

---

## Опциональные поля (EXTENDED / PREMIUM)

```typescript
{
  placeholdersExtended?: {
    // Оси (0-100)
    AXIS_SOCIAL_VALUE: number,           // 0-100
    AXIS_FOCUS_VALUE: number,            // 0-100
    AXIS_DECISION_VALUE: number,          // 0-100
    AXIS_STRUCTURE_VALUE: number,          // 0-100
    AXIS_MOTIVATION_VALUE: number,         // 0-100
    AXIS_ACTIVATION_VALUE: number,         // 0-100
    AXIS_COMMUNICATION_VALUE: number,      // 0-100
    
    // Мета-метрики
    META_EXPRESSIVENESS_VALUE: number,    // 0-100
    META_EXPRESSIVENESS_TEXT: string,     // Текстовое описание выраженности
    META_CONFIDENCE_VALUE: number,         // 0-100
    META_CONFIDENCE_TEXT: string,         // Текстовое описание уверенности
    
    // Текстовые модули
    SUMMARY_MOTIVATION: string,          // Текст модуля мотивации
    SUMMARY_ACTIVATION: string,          // Текст модуля активации
    SUMMARY_COMMUNICATION: string        // Текст модуля коммуникации
  }
}
```

---

## Опциональные поля (только PREMIUM)

```typescript
{
  parent?: {
    enabled: true,                    // Строго true
    email: string                     // Email родителя (валидный email)
  }
}
```

---

## Правила по тарифам

### FREE

- ✅ Обязательные поля (version, testId, tariff, completedAt, ageBucket, user, moduleId, placeholdersBase)
- ❌ НЕТ `placeholdersExtended`
- ❌ НЕТ `parent`

### EXTENDED

- ✅ Обязательные поля
- ✅ ОБЯЗАТЕЛЬНО `placeholdersExtended` (все 7 осей, мета-метрики, текстовые модули)
- ❌ НЕТ `parent`

### PREMIUM

- ✅ Обязательные поля
- ✅ ОБЯЗАТЕЛЬНО `placeholdersExtended`
- ✅ ОБЯЗАТЕЛЬНО `parent` с `enabled: true` и валидным `email`

---

## Валидация

### Строгие правила

1. **version**: строго `"payload_v1"` (не `"v1"`, не `"payload_v2"`, не `"payload_v1.0"`)
2. **user.fullName**: должно быть UPPERCASE и совпадать с `placeholdersBase.USER_FULL_NAME`
3. **user.gender**: строго `"male"` или `"female"` (нормализовано на фронте)
4. **placeholdersBase.REPORT_DATE**: формат `"DD MON YYYY"` (например `"29 JAN 2025"`), месяц на английском, UPPERCASE
5. **ageBucket**: должно соответствовать `user.age`:
   - `12_14` → возраст 12-14
   - `15_17` → возраст 15-17
   - `18_20` → возраст 18-20
   - `21_plus` → возраст 21+
6. **placeholdersExtended**: все числовые значения (AXIS_*, META_*_VALUE) должны быть в диапазоне 0-100
7. **answers**: поле `answers` НЕ должно присутствовать в payload (только вычисленные метрики)

### Тарифные правила

- **FREE**: валидация должна проверить отсутствие `placeholdersExtended` и `parent`
- **EXTENDED**: валидация должна проверить наличие `placeholdersExtended` и отсутствие `parent`
- **PREMIUM**: валидация должна проверить наличие `placeholdersExtended` и `parent` с `enabled: true` и валидным `email`

---

## Примеры

### FREE

```json
{
  "version": "payload_v1",
  "testId": "free-test-123",
  "tariff": "FREE",
  "completedAt": "2025-01-29T10:00:00.000Z",
  "ageBucket": "15_17",
  "user": {
    "fullName": "ALEX SMITH",
    "email": "alex@example.com",
    "age": 16,
    "gender": "male"
  },
  "moduleId": "ENTJ",
  "placeholdersBase": {
    "USER_FULL_NAME": "ALEX SMITH",
    "REPORT_DATE": "29 JAN 2025"
  }
}
```

### EXTENDED

```json
{
  "version": "payload_v1",
  "testId": "extended-test-456",
  "tariff": "EXTENDED",
  "completedAt": "2025-01-29T10:00:00.000Z",
  "ageBucket": "18_20",
  "user": {
    "fullName": "MARIA IVANOVA",
    "email": "maria@example.com",
    "age": 19,
    "gender": "female"
  },
  "moduleId": "ENFJ",
  "placeholdersBase": {
    "USER_FULL_NAME": "MARIA IVANOVA",
    "REPORT_DATE": "29 JAN 2025"
  },
  "placeholdersExtended": {
    "AXIS_SOCIAL_VALUE": 85,
    "AXIS_FOCUS_VALUE": 70,
    "AXIS_DECISION_VALUE": 60,
    "AXIS_STRUCTURE_VALUE": 45,
    "AXIS_MOTIVATION_VALUE": 75,
    "AXIS_ACTIVATION_VALUE": 30,
    "AXIS_COMMUNICATION_VALUE": 55,
    "META_EXPRESSIVENESS_VALUE": 80,
    "META_EXPRESSIVENESS_TEXT": "ярко, устойчиво, заметно",
    "META_CONFIDENCE_VALUE": 85,
    "META_CONFIDENCE_TEXT": "ровно, согласованно, стабильно",
    "SUMMARY_MOTIVATION": "Тебя держит не только 'сделать', а понять: зачем это тебе...",
    "SUMMARY_ACTIVATION": "Тебе легче начинать, когда есть структура...",
    "SUMMARY_COMMUNICATION": "В конфликте ты чаще стараешься сохранить отношения..."
  }
}
```

### PREMIUM

```json
{
  "version": "payload_v1",
  "testId": "premium-test-789",
  "tariff": "PREMIUM",
  "completedAt": "2025-01-29T10:00:00.000Z",
  "ageBucket": "12_14",
  "user": {
    "fullName": "JOHN DOE",
    "email": "john@example.com",
    "age": 13,
    "gender": "male"
  },
  "moduleId": "INFP",
  "placeholdersBase": {
    "USER_FULL_NAME": "JOHN DOE",
    "REPORT_DATE": "29 JAN 2025"
  },
  "placeholdersExtended": {
    "AXIS_SOCIAL_VALUE": 30,
    "AXIS_FOCUS_VALUE": 80,
    "AXIS_DECISION_VALUE": 70,
    "AXIS_STRUCTURE_VALUE": 25,
    "AXIS_MOTIVATION_VALUE": 85,
    "AXIS_ACTIVATION_VALUE": 20,
    "AXIS_COMMUNICATION_VALUE": 65,
    "META_EXPRESSIVENESS_VALUE": 75,
    "META_EXPRESSIVENESS_TEXT": "выражено, заметно, устойчиво",
    "META_CONFIDENCE_VALUE": 78,
    "META_CONFIDENCE_TEXT": "стабильно, согласованно, надежно",
    "SUMMARY_MOTIVATION": "Тебя больше всего включает, когда понятно: что делать...",
    "SUMMARY_ACTIVATION": "Тебе проще начать с черновика: попробовать, посмотреть...",
    "SUMMARY_COMMUNICATION": "В конфликте ты чаще идёшь через ясность: кто прав..."
  },
  "parent": {
    "enabled": true,
    "email": "parent@example.com"
  }
}
```

---

## Использование на фронте

### Генерация payload_v1

Используйте функцию `buildPayload` из `engine/buildPayload.ts`:

```typescript
import { buildPayload } from '../engine/buildPayload';
import type { PayloadV1 } from '../types/payload';

const payload: PayloadV1 = buildPayload({
  testId: 'test-123',
  tariff: 'EXTENDED',
  completedAt: new Date().toISOString(),
  user: {
    fullName: 'Ivan Petrov',  // Будет нормализовано в UPPERCASE
    email: 'ivan@example.com',
    age: 18,
    gender: 'male',            // Будет нормализовано к "male" | "female"
    parentEmail: undefined     // Только для PREMIUM
  },
  answers: {
    '1': 'A',
    '2': 'B',
    // ... остальные ответы
  }
});
```

### Валидация payload_v1

Используйте функцию `validatePayload` из `utils/validatePayload.ts`:

```typescript
import { validatePayload } from '../utils/validatePayload';

try {
  validatePayload(payload);
  // Payload валиден
} catch (error) {
  // Ошибка валидации
  console.error('Validation failed:', error.message);
}
```

---

## Использование на бэкенде

### Валидация входящего payload

Бэкенд должен валидировать payload по правилам выше перед генерацией отчёта.

### Обработка по тарифам

См. `pb_backend/rules.md` для детальной логики обработки каждого тарифа.

---

## Запрещённые поля

- ❌ `answers` — не должно присутствовать в payload (только вычисленные метрики)
- ❌ Любые другие поля, не описанные в спецификации выше

---

## Миграция с v3 формата

Старый формат v3 (`v: 3`, `result: { moduleId, childPlaceholders }`) **больше не используется**. Все запросы должны использовать payload_v1.
