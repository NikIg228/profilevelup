# Engine - Система тестирования

## Описание

Универсальная система для обработки результатов тестов личности. Вся логика находится на фронтенде, бэкенд получает только финальный `resultIndex`.

**Ключевые принципы:**
- Engine **НЕ использует** `tariff` (FREE / EXTENDED / PREMIUM) для выбора логики подсчёта
- Тип логики определяется **исключительно** структурой `config.resultMapping`
- `getTestConfig` является **ЕДИНСТВЕННОЙ** точкой выбора теста - engine всегда получает уже готовую конфигурацию
- `resultIndex` (INTJ, EXTP, ZNFW и т.п.) **НЕ является** пользовательским результатом и **запрещено** использовать напрямую в UI

## Структура

```
/src/engine
  - types.ts                # Типы и интерфейсы
  - resolveJPW.ts          # Логика разрешения J/P/W (для FREE)
  - resolveExtendedResult.ts # Логика разрешения EXTENDED/PREMIUM
  - resolveResult.ts       # Вычисление финального результата (универсальный роутер)
  - getTestConfig.ts       # Загрузка конфигурации теста (синхронная)

/src/tests
  /FREE/{ageGroup}/index.ts        # FREE тесты (5 вопросов)
  /EXTENDED/{ageGroup}/index.ts    # EXTENDED тесты (28 вопросов)
  /PREMIUM/{ageGroup}/index.ts     # PREMIUM тесты (28 вопросов)
```

## Использование

### 1. Загрузка конфигурации теста (синхронно)

**⚠️ ВАЖНО:** `getTestConfig` является **ЕДИНСТВЕННОЙ** точкой выбора теста. Engine всегда получает уже готовую конфигурацию и не знает, как она была выбрана.

```typescript
import { getTestConfig } from '../engine/getTestConfig';

// FREE тест
const freeConfig = getTestConfig('FREE', '18-24');

// EXTENDED тест (возрастная группа является ключом выбора конфигурации)
const extendedConfig = getTestConfig('EXTENDED', '18-24');

// PREMIUM тест (возрастная группа является ключом выбора конфигурации)
const premiumConfig = getTestConfig('PREMIUM', '13-17');
```

**Как работает выбор конфигурации:**
- `getTestConfig(tariff, ageGroup)` выбирает конфигурацию по комбинации `tariff` и `ageGroup`
- Возрастная группа (`ageGroup`) является **ключом выбора** для всех тарифов
- Для каждого тарифа и возрастной группы существует отдельный файл конфигурации
- Если конфигурация не найдена, выбрасывается явная ошибка

### 2. Сохранение ответов пользователя

#### FREE тест

```typescript
import type { Answers } from '../engine/types';

const answers: Answers = {
  1: 'P', // или 'J'
  2: 'E', // или 'I'
  3: 'T', // или 'F'
  4: 'J', // или 'P'
  5: 'N', // или 'S'
};
```

#### EXTENDED / PREMIUM тест

```typescript
import type { ExtendedAnswers } from '../engine/types';

const answers: ExtendedAnswers = {
  1: 'A',  // или 'B'
  2: 'A',  // или 'B'
  // ... вопросы 3-28
  28: 'B', // или 'A'
};
```

### 3. Вычисление результата

```typescript
import { resolveResult } from '../engine/resolveResult';

// Универсальная функция автоматически определяет тип теста
const result = resolveResult(answers, config);

// Для FREE: "ESTW", "INFP", "ENTJ" и т.д.
// Для EXTENDED/PREMIUM: "EXTP", "ISQJ", "ZNFW" и т.д. (включая срединные буквы)
console.log(result); // "EXTP"

**⚠️ ЗАПРЕЩЕНО:** `resultIndex` (INTJ, EXTP, ZNFW и т.п.) **НЕ является** пользовательским результатом в продакшене. 

**Использование `resultIndex`:**
- ✅ Для отладки логики тестирования
- ✅ Для передачи на бэкенд для генерации отчётов (PDF / email)
- ✅ Для внутренней обработки результатов
- ❌ **ЗАПРЕЩЕНО** использовать напрямую в UI как финальный результат для пользователя
```

**⚠️ КРИТИЧЕСКИ ВАЖНО:** 

Функция `resolveResult` **НЕ использует** `tariff` (FREE / EXTENDED / PREMIUM) для выбора логики подсчёта. Тип логики определяется **исключительно** структурой `config.resultMapping`:

- Если есть `position1` → FREE логика (используется `resolveFreeResult`)
- Если есть `EI` → EXTENDED/PREMIUM логика (используется `resolveExtendedResult`)

Engine **не знает** и **не должен знать** о тарифах - он работает только с конфигурацией, которая уже выбрана через `getTestConfig`.

### 4. Отправка на бэкенд (в utils, не в engine)

```typescript
import { sendResultToBackend } from '../utils/sendResult';

await sendResultToBackend(result.resultIndex, userId);
```

## Правила вычисления результата

### FREE тесты

Финальный результат строится в порядке: **[E/I] – [N/S] – [T/F] – [J/P/W]**

- Позиция 1 (E/I) → из вопроса 2
- Позиция 2 (N/S) → из вопроса 5
- Позиция 3 (T/F) → из вопроса 3
- Позиция 4 (J/P/W) → разрешается из вопросов 1 и 4:
  - Если `answer_q1 === answer_q4` → использовать эту букву (J или P)
  - Если `answer_q1 !== answer_q4` → использовать "W"

### EXTENDED / PREMIUM тесты

**Важно:** EXTENDED («Личный разбор») и PREMIUM («Подросток и родитель») используют **ОДИНАКОВУЮ** логику подсчета.

**Почему одна логика:**
- Оба тарифа имеют одинаковую структуру: 28 вопросов, 4 дихотомии по 7 вопросов
- Оба используют одинаковый формат ответов: `'A' | 'B'`
- Оба используют одинаковый алгоритм подсчёта с срединными буквами (Z/X/Q/W)
- Оба тарифа разделены по возрастным группам: 13-17, 18-24, 25-34, 35-45
- Для каждого тарифа и возрастной группы существует отдельный файл конфигурации
- Различие только в `meta.tariff` ('EXTENDED' vs 'PREMIUM') - вопросы и `resultMapping` идентичны
- Engine **не различает** EXTENDED и PREMIUM - он видит только структуру `resultMapping` с дихотомиями `EI`, `SN`, `TF`, `JP`

#### Структура теста

- **Всего 28 вопросов**
- **4 дихотомии по 7 вопросов каждая**
- Дихотомии определяются через `resultMapping`, а не через поле `block` в вопросах:
  - EI дихотомия (вопросы 1-7) → E / I / Z
  - SN дихотомия (вопросы 8-14) → S / N / X
  - TF дихотомия (вопросы 15-21) → T / F / Q
  - JP дихотомия (вопросы 22-28) → J / P / W

#### Формат ответов

Каждый вопрос имеет **2 варианта ответа:**
- Вариант **A** → первая буква дихотомии (E, S, T, J)
- Вариант **B** → вторая буква дихотомии (I, N, F, P)

#### Подсчет результата

Для каждой дихотомии:
1. Подсчитывается количество ответов **A** и **B** по вопросам из `resultMapping.{dichotomy}.questions`
2. Определяется итоговая буква по правилу:

```typescript
function getLetter(A_count, B_count, primary, secondary, middle) {
  if (Math.abs(A_count - B_count) === 1) {
    return middle;  // Используем срединную букву
  }
  return (A_count > B_count) ? primary : secondary;  // Буква большинства
}
```

**Специальные (срединные) буквы:**
- E / I → **Z** (если разница = 1)
- S / N → **X** (если разница = 1)
- T / F → **Q** (если разница = 1)
- J / P → **W** (если разница = 1)

**Важно:** Дихотомии явно описаны в `resultMapping` с указанием `primary`, `secondary` и `middle` букв. Engine не зависит от порядка блоков или номеров - использует только структуру `resultMapping`.

#### Формирование итогового типа

Итоговый `resultIndex` формируется строго в порядке MBTI:

**[E/I/Z] + [S/N/X] + [T/F/Q] + [J/P/W]**

**Примеры:**
- `E + X + T + P` = `EXTP`
- `I + S + Q + J` = `ISQJ`
- `Z + N + F + W` = `ZNFW`

**⚠️ ВАЖНО:** `resultIndex` используется **только** для:
- Отладки логики тестирования
- Передачи на бэкенд для генерации отчётов (PDF / email)
- Внутренней обработки результатов

**ЗАПРЕЩЕНО** использовать `resultIndex` напрямую в UI как финальный результат для пользователя.

#### Псевдокод реализации

```typescript
// Для каждой дихотомии из resultMapping
EI_A = count(resultMapping.EI.questions, 'A')
EI_B = count(resultMapping.EI.questions, 'B')
letter1 = getLetter(EI_A, EI_B, resultMapping.EI.primary, resultMapping.EI.secondary, resultMapping.EI.middle)

SN_A = count(resultMapping.SN.questions, 'A')
SN_B = count(resultMapping.SN.questions, 'B')
letter2 = getLetter(SN_A, SN_B, resultMapping.SN.primary, resultMapping.SN.secondary, resultMapping.SN.middle)

TF_A = count(resultMapping.TF.questions, 'A')
TF_B = count(resultMapping.TF.questions, 'B')
letter3 = getLetter(TF_A, TF_B, resultMapping.TF.primary, resultMapping.TF.secondary, resultMapping.TF.middle)

JP_A = count(resultMapping.JP.questions, 'A')
JP_B = count(resultMapping.JP.questions, 'B')
letter4 = getLetter(JP_A, JP_B, resultMapping.JP.primary, resultMapping.JP.secondary, resultMapping.JP.middle)

resultIndex = letter1 + letter2 + letter3 + letter4
```

## Структура конфигурации теста

### FREE тест (`FreeTestConfig`)

`TestConfig` содержит `resultMapping` с позиционным маппингом:

```typescript
resultMapping: {
  position1: { from: 2 },      // E/I из вопроса 2
  position2: { from: 5 },      // N/S из вопроса 5
  position3: { from: 3 },      // T/F из вопроса 3
  position4: { from: [1, 4] },  // J/P/W из вопросов 1 и 4
}
```

### EXTENDED / PREMIUM тест (`ExtendedTestConfig`)

`ExtendedTestConfig` содержит `resultMapping` с явным описанием дихотомий:

```typescript
resultMapping: {
  EI: {
    questions: [1, 2, 3, 4, 5, 6, 7],
    primary: 'E',      // Буква для варианта A (большинство)
    secondary: 'I',    // Буква для варианта B (меньшинство)
    middle: 'Z',       // Срединная буква (при разнице в 1)
  },
  SN: {
    questions: [8, 9, 10, 11, 12, 13, 14],
    primary: 'S',
    secondary: 'N',
    middle: 'X',
  },
  TF: {
    questions: [15, 16, 17, 18, 19, 20, 21],
    primary: 'T',
    secondary: 'F',
    middle: 'Q',
  },
  JP: {
    questions: [22, 23, 24, 25, 26, 27, 28],
    primary: 'J',
    secondary: 'P',
    middle: 'W',
  },
}
```

**Важно:** Вопросы **НЕ содержат** поле `block`. Дихотомии определяются только через `resultMapping`.

Каждый вопрос в `ExtendedQuestion` содержит:
- `id`: номер вопроса (1-28)
- `text`: текст вопроса
- `options`: массив с вариантами `{ value: 'A' | 'B', label: string }`

## Добавление нового теста

### FREE тест

1. Создайте файл в `/src/tests/FREE/{ageGroup}/index.ts` (где `ageGroup` = '13-17' | '18-24' | '25-34' | '35-45')
2. Экспортируйте `FreeTestConfig` с полями:
   - `meta` (tariff: 'FREE', ageGroup: AgeGroup)
   - `questions` (массив из 5 вопросов типа `Question`)
   - `resultMapping` (позиционный маппинг)
3. Добавьте импорт в `getTestConfig.ts`

### EXTENDED / PREMIUM тест

1. Создайте файл в `/src/tests/{EXTENDED|PREMIUM}/{ageGroup}/index.ts` (где `ageGroup` = '13-17' | '18-24' | '25-34' | '35-45')
2. Экспортируйте `ExtendedTestConfig` с полями:
   - `meta` (tariff: 'EXTENDED' | 'PREMIUM', ageGroup: AgeGroup)
   - `questions` (массив из 28 вопросов типа `ExtendedQuestion` **без поля `block`**)
   - `resultMapping` (явное описание дихотомий с `EI`, `SN`, `TF`, `JP`, каждая содержит `questions`, `primary`, `secondary`, `middle`)
3. Добавьте импорт в `getTestConfig.ts`

**Важно:** 
- EXTENDED и PREMIUM используют одинаковую логику подсчета
- Для каждого тарифа и возрастной группы существует отдельный файл конфигурации
- PREMIUM тесты являются копиями соответствующих EXTENDED тестов с изменением только `meta.tariff` на 'PREMIUM'
- Вопросы, `resultMapping` и структура идентичны для соответствующих возрастных групп
- Возрастная группа (`ageGroup`) является **ключом выбора конфигурации** для всех тарифов
- Вопросы не должны содержать поле `block` - дихотомии определяются только через `resultMapping`
- `getTestConfig` является **ЕДИНСТВЕННОЙ** точкой выбора теста - engine всегда получает уже готовую конфигурацию

## Важные правила

### Общие правила

- `getTestConfig` является **ЕДИНСТВЕННОЙ** точкой выбора теста - engine всегда получает уже готовую конфигурацию
- `resolveResult` **обязательно** принимает `config` как второй параметр
- `resolveResult` **автоматически определяет** тип теста по структуре `config.resultMapping` (НЕ по `tariff`)
- Engine **НЕ использует** `tariff` для выбора логики - только структуру `resultMapping`
- `getTestConfig` **синхронный** - использует статические импорты
- `sendResult` **не является частью engine** - находится в `utils`
- `resultIndex` **НЕ является** пользовательским результатом и **запрещено** использовать напрямую в UI

### FREE тесты

- Состоят из **5 вопросов**
- Используют **позиционный маппинг** (`PositionalResultMapping`)
- Ответы хранятся как буквы: `'E' | 'I' | 'N' | 'S' | 'T' | 'F' | 'J' | 'P'`
- Результат: `[E/I] + [N/S] + [T/F] + [J/P/W]`

### EXTENDED / PREMIUM тесты

- Состоят из **28 вопросов** (4 дихотомии по 7 вопросов каждая)
- Используют **блочный маппинг** (`BlockResultMapping`) с явным описанием дихотомий
- Вопросы **НЕ содержат** поле `block` - дихотомии определяются только через `resultMapping`
- Ответы хранятся как варианты: `'A' | 'B'`
- Вариант A → `primary` буква дихотомии, B → `secondary` буква
- Подсчет по дихотомиям с учетом срединных букв (Z/X/Q/W)
- Результат: `[E/I/Z] + [S/N/X] + [T/F/Q] + [J/P/W]`
- **EXTENDED и PREMIUM используют ОДИНАКОВУЮ логику**, но с разными вопросами
- Engine не зависит от порядка блоков - использует только структуру `resultMapping`

### Изоляция логики

- **FREE логика** полностью изолирована и не изменяется
- **EXTENDED/PREMIUM логика** реализована отдельно в `resolveExtendedResult.ts`
- Типы разделены: `FreeTestConfig` и `ExtendedTestConfig`
- Union type `TestConfig` позволяет использовать оба типа безопасно

### Как engine понимает выбранный тест

1. **Выбор конфигурации:** `getTestConfig(tariff, ageGroup)` выбирает конфигурацию по комбинации тарифа и возрастной группы
2. **Определение логики:** `resolveResult` анализирует структуру `config.resultMapping`:
   - Если есть `position1` → FREE логика (5 вопросов, позиционный маппинг)
   - Если есть `EI` → EXTENDED/PREMIUM логика (28 вопросов, блочный маппинг с дихотомиями)
3. **Выполнение подсчёта:** Соответствующая функция (`resolveFreeResult` или `resolveExtendedResult`) вычисляет `resultIndex`

**Ключевой момент:** Engine **не знает** о тарифах - он работает только с конфигурацией и её структурой.

### Учёт возрастной группы

- Возрастная группа (`ageGroup`) является **ключом выбора** конфигурации для всех тарифов
- Для каждого тарифа (FREE, EXTENDED, PREMIUM) и возрастной группы (13-17, 18-24, 25-34, 35-45) существует отдельный файл конфигурации
- Структура файлов: `/src/tests/{tariff}/{ageGroup}/index.ts`
- `getTestConfig(tariff, ageGroup)` использует оба параметра для выбора правильной конфигурации
- Если конфигурация не найдена, выбрасывается явная ошибка
- Engine получает уже готовую конфигурацию и не знает, как она была выбрана

### Почему EXTENDED и PREMIUM используют одну логику

- Оба тарифа имеют **идентичную структуру**: 28 вопросов, 4 дихотомии по 7 вопросов
- Оба используют **одинаковый формат ответов**: `'A' | 'B'`
- Оба используют **одинаковый алгоритм подсчёта** с срединными буквами (Z/X/Q/W)
- Оба тарифа разделены по возрастным группам: 13-17, 18-24, 25-34, 35-45
- Для каждой возрастной группы PREMIUM тесты являются копиями EXTENDED тестов
- Различие только в `meta.tariff` ('EXTENDED' vs 'PREMIUM') - вопросы и `resultMapping` полностью идентичны
- Engine **не различает** EXTENDED и PREMIUM - он видит только структуру `resultMapping` с дихотомиями

### Почему результат формируется корректно и стабильно

- **Декларативность:** Дихотомии явно описаны в `resultMapping` с указанием `primary`, `secondary` и `middle` букв
- **Независимость от порядка:** Engine не зависит от порядка блоков или номеров - использует только структуру `resultMapping`
- **Типобезопасность:** TypeScript гарантирует корректность структуры конфигурации
- **Изоляция:** FREE и EXTENDED/PREMIUM логики полностью изолированы друг от друга
- **Единая точка выбора:** `getTestConfig` гарантирует, что engine всегда получает корректную конфигурацию
