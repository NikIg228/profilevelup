# Payload v1: Полная логика формирования

## Обзор

Документ описывает полную логику формирования `payload_v1` на фронтенде для всех тарифов (FREE, EXTENDED, PREMIUM). Это внутренняя техническая документация для разработчиков фронтенда.

---

## 1. Структура Payload v1

### Полная структура типа

```typescript
type PayloadV1 = {
  version: "payload_v1",                    // Константа
  testId: string,                            // Уникальный ID теста
  tariff: "FREE" | "EXTENDED" | "PREMIUM",   // Тариф теста
  completedAt: string,                       // ISO 8601 datetime
  ageBucket: "12_14" | "15_17" | "18_20" | "21_plus",  // Вычисляется из age
  user: {
    fullName: string,                        // UPPERCASE, нормализовано
    age: number,                             // Положительное целое число
    gender: "male" | "female",               // Нормализовано из русского/английского
    email: string                            // Валидный email
  },
  moduleId: string,                          // Код профиля (например "ENTJ", "INFW")
  placeholdersBase: {
    USER_FULL_NAME: string,                  // === user.fullName
    REPORT_DATE: string                      // Формат "DD MON YYYY"
  },
  placeholdersExtended?: {                   // Только для EXTENDED/PREMIUM
    // 7 осей
    AXIS_SOCIAL_VALUE: number,               // 0-100
    AXIS_FOCUS_VALUE: number,                // 0-100
    AXIS_DECISION_VALUE: number,             // 0-100
    AXIS_STRUCTURE_VALUE: number,            // 0-100
    AXIS_MOTIVATION_VALUE: number,           // 0-100
    AXIS_ACTIVATION_VALUE: number,           // 0-100
    AXIS_COMMUNICATION_VALUE: number,        // 0-100
    
    // Мета-метрики
    META_EXPRESSIVENESS_VALUE: number,       // 0-100
    META_EXPRESSIVENESS_TEXT: string,        // Текст из модулей
    META_CONFIDENCE_VALUE: number,           // 0-100
    META_CONFIDENCE_TEXT: string,            // Текст из модулей
    
    // Текстовые модули
    SUMMARY_MOTIVATION: string,              // Текст из модулей
    SUMMARY_ACTIVATION: string,             // Текст из модулей
    SUMMARY_COMMUNICATION: string            // Текст из модулей
  },
  parent?: {                                 // Только для PREMIUM
    enabled: true,                           // Константа
    email: string                            // Email родителя
  }
}
```

**ВАЖНО**: Поле `answers` НЕ является частью payload_v1. Ответы используются только для внутренних вычислений.

---

## 2. Нормализация данных

### 2.1. Нормализация имени (fullName)

**Функция**: `normalizeFullName(name: string): string`

**Логика**:
1. Удалить пробелы в начале и конце: `name.trim()`
2. Преобразовать в UPPERCASE: `.toUpperCase()`

**Примеры**:
- `"  john doe "` → `"JOHN DOE"`
- `"Jane"` → `"JANE"`
- `"Иван Иванов"` → `"ИВАН ИВАНОВ"`

**Использование**:
- `payload.user.fullName = normalizeFullName(rawName)`
- `payload.placeholdersBase.USER_FULL_NAME = payload.user.fullName` (строгое совпадение)

---

### 2.2. Нормализация пола (gender)

**Функция**: `normalizeGender(input: string | unknown): "male" | "female"`

**Логика**:
1. Проверить тип входных данных (должна быть строка)
2. Привести к lowercase и удалить пробелы
3. Сопоставить с известными значениями:
   - `"male"`, `"мужской"`, `"m"`, `"м"` → `"male"`
   - `"female"`, `"женский"`, `"f"`, `"ж"` → `"female"`
4. Если не распознано → выбросить ошибку

**Примеры**:
- `"Мужской"` → `"male"`
- `"Женский"` → `"female"`
- `"male"` → `"male"`
- `"M"` → `"male"`
- `"unknown"` → Error

**Использование**:
- `payload.user.gender = normalizeGender(rawGender)`

---

### 2.3. Вычисление возрастной группы (ageBucket)

**Функция**: `getAgeBucket(age: number): AgeGroupKey`

**Логика**:
```
if (age >= 12 && age <= 14) return "12_14"
if (age >= 15 && age <= 17) return "15_17"
if (age >= 18 && age <= 20) return "18_20"
return "21_plus"  // age >= 21
```

**Примеры**:
- `12` → `"12_14"`
- `14` → `"12_14"`
- `15` → `"15_17"`
- `17` → `"15_17"`
- `18` → `"18_20"`
- `20` → `"18_20"`
- `21` → `"21_plus"`
- `99` → `"21_plus"`

**Использование**:
- `payload.ageBucket = getAgeBucket(payload.user.age)`

**Примечание**: Также используется функция `getAgeGroupKey(age)` для выбора текстовых модулей (та же логика).

---

### 2.4. Форматирование даты отчета (REPORT_DATE)

**Функция**: `formatReportDateFromISO(isoDateString: string): string`

**Логика**:
1. Парсить ISO строку в Date объект
2. Извлечь день, месяц, год
3. Форматировать: `"DD MON YYYY"` (месяц на английском, UPPERCASE)

**Формат месяца**:
```
JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC
```

**Примеры**:
- `"2025-01-24T12:00:00.000Z"` → `"24 JAN 2025"`
- `"2025-12-31T23:59:59.000Z"` → `"31 DEC 2025"`

**Использование**:
- `payload.placeholdersBase.REPORT_DATE = formatReportDateFromISO(payload.completedAt)`

---

## 3. Логика FREE тарифа

### 3.1. Входные данные

- **Ответы**: 5 вопросов (ключи "1"-"5", значения: буквы типа "E", "I", "T", "F", "J", "P", "N", "S", "W")
- **Формат**: `Record<"1"|"2"|"3"|"4"|"5", string>`

### 3.2. Вычисление moduleId (код профиля)

**Функция**: `resolveFreeProfileCode(answers: FreeAnswers): string`

**Логика**:
1. **Позиция 1 (E/I)**: Берется из ответа на вопрос 2 (`answers["2"]`)
2. **Позиция 2 (S/N)**: Берется из ответа на вопрос 5 (`answers["5"]`)
3. **Позиция 3 (T/F)**: Берется из ответа на вопрос 3 (`answers["3"]`)
4. **Позиция 4 (J/P/W)**: Вычисляется из вопросов 1 и 4:
   - Если `answers["1"] === answers["4"]` → использовать эту букву (J или P)
   - Если `answers["1"] !== answers["4"]` → использовать "W"

**Примеры**:
- `{ "1": "J", "2": "E", "3": "T", "4": "J", "5": "N" }` → `"ENTJ"`
- `{ "1": "P", "2": "I", "3": "F", "4": "J", "5": "S" }` → `"IFSW"` (разные Q1 и Q4 → W)

### 3.3. Формирование payload

**Структура**:
```typescript
{
  version: "payload_v1",
  testId: string,
  tariff: "FREE",
  completedAt: string,
  ageBucket: AgeGroupKey,  // Вычислено из user.age
  user: {
    fullName: string,       // Нормализовано (UPPERCASE)
    age: number,
    gender: "male" | "female",  // Нормализовано
    email: string
  },
  moduleId: string,         // Вычислено из ответов
  placeholdersBase: {
    USER_FULL_NAME: string,  // === user.fullName
    REPORT_DATE: string      // Форматировано из completedAt
  }
  // НЕТ placeholdersExtended
  // НЕТ parent
}
```

---

## 4. Логика VIP тарифа (EXTENDED / PREMIUM)

### 4.1. Входные данные

- **Ответы**: 28 вопросов (ключи "1"-"28", значения: "A" или "B")
- **Формат**: `Record<"1"|"2"|...|"28", "A"|"B">`

### 4.2. Распределение вопросов по блокам

**Блок E/I (Социальный режим)**:
- Вопросы: 1, 5, 9, 13, 17, 21, 25 (7 вопросов)
- A = E (экстраверсия), B = I (интроверсия)

**Блок S/N (Фокус мышления)**:
- Вопросы: 2, 6, 10, 14, 18, 22, 26 (7 вопросов)
- A = S (сенсорика), B = N (интуиция)

**Блок T/F (Основание решений)**:
- Вопросы: 3, 7, 11, 15, 19, 23, 27 (7 вопросов)
- A = T (мышление), B = F (чувства)

**Блок J/P (Стиль организации)**:
- Вопросы: 4, 8, 12, 16, 20, 24, 28 (7 вопросов)
- A = J (суждение), B = P (восприятие)

### 4.3. Вычисление осей 1-4

**Ось 1: Социальный режим (AXIS_SOCIAL_VALUE)**
```
countA = количество ответов "A" в блоке E/I
axis1 = round((countA / 7) * 100)
clamp(0, 100)
```
- 0 = Автономно (I)
- 100 = Через людей (E)

**Ось 2: Фокус мышления (AXIS_FOCUS_VALUE)**
```
countB = количество ответов "B" в блоке S/N
axis2 = round((countB / 7) * 100)
clamp(0, 100)
```
- 0 = Конкретика и факты (S)
- 100 = Идеи и сценарии (N)

**Ось 3: Основание решений (AXIS_DECISION_VALUE)**
```
countB = количество ответов "B" в блоке T/F
axis3 = round((countB / 7) * 100)
clamp(0, 100)
```
- 0 = Логика/справедливость (T)
- 100 = Люди/ценности (F)

**Ось 4: Стиль организации (AXIS_STRUCTURE_VALUE)**
```
countA = количество ответов "A" в блоке J/P
axis4 = round((countA / 7) * 100)
clamp(0, 100)
```
- 0 = Адаптация (P)
- 100 = План/структура (J)

### 4.4. Вычисление осей 5-7

**Ось 5: Драйвер мотивации (AXIS_MOTIVATION_VALUE)**
```
axis5 = round(0.45 * axis2 + 0.35 * axis3 + 0.20 * (100 - axis4))
clamp(0, 100)
```
- 0 = Результат
- 100 = Смысл

**Ось 6: Старт действий (AXIS_ACTIVATION_VALUE)**
```
axis6 = round(0.80 * (100 - axis4) + 0.20 * axis2)
clamp(0, 100)
```
- 0 = Через план
- 100 = Через пробу/эксперимент

**Ось 7: Стиль диалога в напряжении (AXIS_COMMUNICATION_VALUE)**
```
axis7 = round(0.60 * axis3 + 0.20 * (100 - axis1) + 0.20 * (100 - axis4))
clamp(0, 100)
```
- 0 = Прямо/жёстко
- 100 = Мягко/согласуя

### 4.5. Вычисление метрик

**Выраженность (META_EXPRESSIVENESS_VALUE)**
```
avgDist = (|axis1 - 50| + |axis2 - 50| + |axis3 - 50| + |axis4 - 50|) / 4
expression = round(2 * avgDist)
clamp(0, 100)
```
- Показывает, насколько стиль заметный (отклонение от середины)

**Уверенность (META_CONFIDENCE_VALUE)**

**Часть 1: Сила перевеса (baseConf)**
```
confMargin(diff) = 30 + 10 * diff

baseConf = (
  confMargin(|EI_A - EI_B|) +
  confMargin(|SN_A - SN_B|) +
  confMargin(|TF_A - TF_B|) +
  confMargin(|JP_A - JP_B|)
) / 4
```

**Часть 2: Стабильность (stability)**
```
Для каждого блока:
  first3 = первые 3 вопроса
  last4 = последние 4 вопроса
  
  p1 = доля "правильного" ответа в first3
  p2 = доля "правильного" ответа в last4
  
  stability_block = 100 - |p1 - p2| * 100

stability = среднее по всем блокам
```

**Итоговая уверенность**:
```
confidence = round(0.70 * baseConf + 0.30 * stability)
clamp(0, 100)
```

### 4.6. Вычисление moduleId (код профиля)

**Логика для каждого блока**:
```
if (|countA - countB| <= 1) {
  return "Z"  // Средний вариант (VIP_MIDDLE_MODE)
} else {
  return countA > countB ? primary : secondary
}
```

**Маппинг**:
- E/I: primary="E", secondary="I"
- S/N: primary="S", secondary="N"
- T/F: primary="T", secondary="F"
- J/P: primary="J", secondary="P"

**Примеры**:
- EI: 7A, 0B → "E"
- SN: 3A, 4B → "N"
- TF: 4A, 3B → "Z" (разница 1)
- JP: 0A, 7B → "P"
- Результат: "ENZP"

### 4.7. Подбор текстовых модулей

**Функция**: `pickText(ageGroup: AgeGroupKey, moduleName: ModuleName, value: number): string`

**Логика**:
1. Определить band по значению:
   - 0-35 → "L"
   - 36-64 → "M"
   - 65-100 → "R"
2. Загрузить `text_modules.json`
3. Выбрать текст по пути: `ageGroups[ageGroup][moduleName][band]`

**Модули**:
- `motivation` → используется `AXIS_MOTIVATION_VALUE`
- `activation` → используется `AXIS_ACTIVATION_VALUE`
- `communication` → используется `AXIS_COMMUNICATION_VALUE`
- `expression` → используется `META_EXPRESSIVENESS_VALUE`
- `confidence` → используется `META_CONFIDENCE_VALUE`

**Примеры**:
- `pickText("15_17", "motivation", 80)` → текст из `ageGroups["15_17"]["motivation"]["R"]`
- `pickText("21_plus", "confidence", 45)` → текст из `ageGroups["21_plus"]["confidence"]["M"]`

### 4.8. Формирование placeholdersExtended

```typescript
{
  // Оси
  AXIS_SOCIAL_VALUE: axis1,
  AXIS_FOCUS_VALUE: axis2,
  AXIS_DECISION_VALUE: axis3,
  AXIS_STRUCTURE_VALUE: axis4,
  AXIS_MOTIVATION_VALUE: axis5,
  AXIS_ACTIVATION_VALUE: axis6,
  AXIS_COMMUNICATION_VALUE: axis7,
  
  // Мета-метрики
  META_EXPRESSIVENESS_VALUE: expression,
  META_EXPRESSIVENESS_TEXT: pickText(ageGroup, "expression", expression),
  META_CONFIDENCE_VALUE: confidence,
  META_CONFIDENCE_TEXT: pickText(ageGroup, "confidence", confidence),
  
  // Текстовые модули
  SUMMARY_MOTIVATION: pickText(ageGroup, "motivation", axis5),
  SUMMARY_ACTIVATION: pickText(ageGroup, "activation", axis6),
  SUMMARY_COMMUNICATION: pickText(ageGroup, "communication", axis7)
}
```

### 4.9. Формирование payload для EXTENDED

```typescript
{
  version: "payload_v1",
  testId: string,
  tariff: "EXTENDED",
  completedAt: string,
  ageBucket: AgeGroupKey,
  user: { ... },
  moduleId: string,
  placeholdersBase: { ... },
  placeholdersExtended: { ... }  // ВСЕГДА присутствует
  // НЕТ parent
}
```

### 4.10. Формирование payload для PREMIUM

```typescript
{
  version: "payload_v1",
  testId: string,
  tariff: "PREMIUM",
  completedAt: string,
  ageBucket: AgeGroupKey,
  user: { ... },
  moduleId: string,
  placeholdersBase: { ... },
  placeholdersExtended: { ... },  // ВСЕГДА присутствует
  parent: {                       // ВСЕГДА присутствует
    enabled: true,
    email: string                 // Из userData.parentEmail
  }
}
```

---

## 5. Главная функция buildPayload

### 5.1. Сигнатура

```typescript
function buildPayload(opts: BuilderOptions): PayloadV1

interface BuilderOptions {
  testId: string;
  tariff: Tariff;
  completedAt: string;  // ISO
  user: {
    fullName: string;   // Может быть русским, будет нормализовано
    email: string;
    age: number;
    gender: string;     // Может быть русским, будет нормализовано
    parentEmail?: string;  // Только для PREMIUM
  };
  answers: Record<string, string>;  // Сырые ответы
}
```

### 5.2. Алгоритм

1. **Нормализация данных**:
   - `fullNameUpper = normalizeFullName(user.fullName)`
   - `genderNormalized = normalizeGender(user.gender)`
   - `ageBucket = getAgeBucket(user.age)`
   - `reportDate = formatReportDateFromISO(completedAt)`

2. **Определение типа теста**:
   - `isVip = tariff === "EXTENDED" || tariff === "PREMIUM"`

3. **Вычисление результатов**:
   - Если FREE: `moduleId = resolveFreeProfileCode(answers)`
   - Если VIP: 
     - Вычислить все оси и метрики
     - `moduleId = resolveVipMetrics(answers).profileCode`
     - Подобрать текстовые модули

4. **Формирование payload**:
   - Базовые поля (version, testId, tariff, completedAt, ageBucket)
   - user (с нормализованными данными)
   - moduleId
   - placeholdersBase
   - placeholdersExtended (только для VIP)
   - parent (только для PREMIUM)

5. **Возврат payload**

### 5.3. Пример использования

```typescript
const payload = buildPayload({
  testId: "test-123",
  tariff: "EXTENDED",
  completedAt: "2025-01-26T10:00:00Z",
  user: {
    fullName: "Иван Иванов",
    email: "ivan@example.com",
    age: 16,
    gender: "Мужской"
  },
  answers: {
    "1": "A", "2": "B", ... "28": "A"
  }
});

// Результат:
// {
//   version: "payload_v1",
//   testId: "test-123",
//   tariff: "EXTENDED",
//   completedAt: "2025-01-26T10:00:00Z",
//   ageBucket: "15_17",
//   user: {
//     fullName: "ИВАН ИВАНОВ",
//     email: "ivan@example.com",
//     age: 16,
//     gender: "male"
//   },
//   moduleId: "ENFJ",
//   placeholdersBase: { ... },
//   placeholdersExtended: { ... }
// }
```

---

## 6. Валидация payload

### 6.1. Схемная валидация (Zod)

Проверяет:
- Типы всех полей
- Обязательность полей
- Диапазоны значений (0-100 для осей)
- Формат email
- Enum значения (tariff, gender, ageBucket)

### 6.2. Бизнес-правила

1. **Имя**: `user.fullName` должно быть UPPERCASE и совпадать с `placeholdersBase.USER_FULL_NAME`
2. **Дата**: `REPORT_DATE` должен соответствовать формату `DD MON YYYY`
3. **ageBucket**: Должен соответствовать возрасту пользователя
4. **gender**: Должен быть строго `"male"` или `"female"`
5. **Тарифные правила**:
   - FREE: нет `placeholdersExtended`, нет `parent`
   - EXTENDED: есть `placeholdersExtended`, нет `parent`
   - PREMIUM: есть `placeholdersExtended`, есть `parent`
6. **answers**: НЕ должно присутствовать в payload

---

## 7. Файлы и функции

### Основные файлы

- `src/types/payload.ts` - TypeScript типы и Zod схемы
- `src/engine/buildPayload.ts` - Главная функция формирования payload
- `src/utils/ageBucket.ts` - Вычисление возрастной группы
- `src/utils/genderNormalizer.ts` - Нормализация пола
- `src/utils/textUtils.ts` - Нормализация имени
- `src/utils/dateFormat.ts` - Форматирование даты
- `src/engine/free/resolveFree.ts` - Логика FREE теста
- `src/engine/vip/resolveVip.ts` - Логика VIP теста (оси, метрики)
- `src/engine/vip/textPicker.ts` - Подбор текстовых модулей
- `src/utils/validatePayload.ts` - Валидация payload

### Ключевые функции

- `buildPayload()` - главная функция
- `getAgeBucket()` - вычисление возрастной группы
- `normalizeGender()` - нормализация пола
- `normalizeFullName()` - нормализация имени
- `formatReportDateFromISO()` - форматирование даты
- `resolveFreeProfileCode()` - вычисление кода для FREE
- `resolveVipMetrics()` - вычисление всех метрик для VIP
- `pickText()` - подбор текстовых модулей
- `validatePayload()` - валидация payload

---

## 8. Примеры полных payload

### FREE

```json
{
  "version": "payload_v1",
  "testId": "free-123",
  "tariff": "FREE",
  "completedAt": "2025-05-20T14:30:00.000Z",
  "ageBucket": "12_14",
  "user": {
    "fullName": "ALEX SMITH",
    "email": "alex@example.com",
    "age": 13,
    "gender": "male"
  },
  "moduleId": "ENTJ",
  "placeholdersBase": {
    "USER_FULL_NAME": "ALEX SMITH",
    "REPORT_DATE": "20 MAY 2025"
  }
}
```

### EXTENDED

```json
{
  "version": "payload_v1",
  "testId": "ext-456",
  "tariff": "EXTENDED",
  "completedAt": "2025-06-15T10:00:00.000Z",
  "ageBucket": "15_17",
  "user": {
    "fullName": "MARIA IVANOVA",
    "email": "maria@example.com",
    "age": 16,
    "gender": "female"
  },
  "moduleId": "ENFJ",
  "placeholdersBase": {
    "USER_FULL_NAME": "MARIA IVANOVA",
    "REPORT_DATE": "15 JUN 2025"
  },
  "placeholdersExtended": {
    "AXIS_SOCIAL_VALUE": 100,
    "AXIS_FOCUS_VALUE": 100,
    "AXIS_DECISION_VALUE": 100,
    "AXIS_STRUCTURE_VALUE": 100,
    "AXIS_MOTIVATION_VALUE": 80,
    "AXIS_ACTIVATION_VALUE": 20,
    "AXIS_COMMUNICATION_VALUE": 60,
    "META_EXPRESSIVENESS_VALUE": 100,
    "META_EXPRESSIVENESS_TEXT": "ярко, устойчиво, заметно",
    "META_CONFIDENCE_VALUE": 91,
    "META_CONFIDENCE_TEXT": "ровно, согласованно, стабильно",
    "SUMMARY_MOTIVATION": "Тебя держит не только “сделать”, а понять...",
    "SUMMARY_ACTIVATION": "Тебе легче начинать, когда есть структура...",
    "SUMMARY_COMMUNICATION": "В конфликте ты чаще стараешься сохранить отношения..."
  }
}
```

### PREMIUM

```json
{
  "version": "payload_v1",
  "testId": "prem-789",
  "tariff": "PREMIUM",
  "completedAt": "2025-07-01T09:00:00.000Z",
  "ageBucket": "21_plus",
  "user": {
    "fullName": "JOHN ADULT",
    "email": "john@example.com",
    "age": 25,
    "gender": "male"
  },
  "moduleId": "ESTP",
  "placeholdersBase": {
    "USER_FULL_NAME": "JOHN ADULT",
    "REPORT_DATE": "01 JUL 2025"
  },
  "placeholdersExtended": {
    "AXIS_SOCIAL_VALUE": 100,
    "AXIS_FOCUS_VALUE": 0,
    "AXIS_DECISION_VALUE": 0,
    "AXIS_STRUCTURE_VALUE": 0,
    "AXIS_MOTIVATION_VALUE": 20,
    "AXIS_ACTIVATION_VALUE": 80,
    "AXIS_COMMUNICATION_VALUE": 20,
    "META_EXPRESSIVENESS_VALUE": 100,
    "META_EXPRESSIVENESS_TEXT": "ярко, устойчиво, выражено",
    "META_CONFIDENCE_VALUE": 91,
    "META_CONFIDENCE_TEXT": "стабильно, согласованно, надежно",
    "SUMMARY_MOTIVATION": "Тебя больше всего включает, когда понятно...",
    "SUMMARY_ACTIVATION": "Тебе проще начать с черновика...",
    "SUMMARY_COMMUNICATION": "В конфликте ты чаще идёшь через ясность..."
  },
  "parent": {
    "enabled": true,
    "email": "mom@example.com"
  }
}
```

---

## 9. Константы и настройки

### Константы

- `VIP_MIDDLE_MODE = "Z"` - символ для среднего варианта в VIP тесте
- `version = "payload_v1"` - версия формата payload

### Диапазоны

- Возраст: 12-90 (рекомендуется)
- Оси и метрики: 0-100
- Band для текстов: L (0-35), M (36-64), R (65-100)

### Форматы

- Дата: ISO 8601 для `completedAt`
- Дата отчета: `DD MON YYYY` (например "24 JAN 2026")
- Email: стандартный формат email

---

## 10. Обработка ошибок

### Типичные ошибки

1. **Невалидный возраст**: возраст < 12 или не число
2. **Невалидный gender**: значение не распознано нормализатором
3. **Недостаточно ответов**: для FREE нужно 5, для VIP нужно 28
4. **Невалидная дата**: `completedAt` не является валидной ISO строкой
5. **Отсутствие текстовых модулей**: файл `text_modules.json` не найден или поврежден

### Рекомендации

- Всегда валидировать входные данные перед вызовом `buildPayload()`
- Использовать `validatePayload()` после создания payload
- Логировать ошибки нормализации для отладки
- Предоставлять понятные сообщения об ошибках пользователю

---

**Версия документа**: 1.0  
**Дата создания**: 2026-01-26  
**Для**: Разработчики фронтенда
