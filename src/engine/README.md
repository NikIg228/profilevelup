# Engine - Система тестирования

## Описание

Универсальная система для обработки результатов тестов личности. Вся логика находится на фронтенде, бэкенд получает только финальный `resultIndex`.

## Структура

```
/src/engine
  - types.ts          # Типы и интерфейсы
  - resolveJPW.ts    # Логика разрешения J/P/W
  - resolveResult.ts # Вычисление финального результата
  - getTestConfig.ts # Загрузка конфигурации теста (синхронная)

/src/tests/FREE/{age}/{gender}.ts
```

## Использование

### 1. Загрузка конфигурации теста (синхронно)

```typescript
import { getTestConfig } from '../engine/getTestConfig';

const config = getTestConfig('FREE', '18-24', 'male');
```

### 2. Сохранение ответов пользователя

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

### 3. Вычисление результата

```typescript
import { resolveResult } from '../engine/resolveResult';

const result = resolveResult(answers, config);
// result.resultIndex: "ESTW", "INFP", "ENTJ" и т.д.
// result.positionResults: массив результатов для каждой позиции
```

### 4. Отправка на бэкенд (в utils, не в engine)

```typescript
import { sendResultToBackend } from '../utils/sendResult';

await sendResultToBackend(result.resultIndex, userId);
```

## Правила вычисления результата

Финальный результат строится в порядке: **[E/I] – [N/S] – [T/F] – [J/P/W]**

- Позиция 1 (E/I) → из вопроса 2
- Позиция 2 (N/S) → из вопроса 5
- Позиция 3 (T/F) → из вопроса 3
- Позиция 4 (J/P/W) → разрешается из вопросов 1 и 4:
  - Если `answer_q1 === answer_q4` → использовать эту букву (J или P)
  - Если `answer_q1 !== answer_q4` → использовать "W"

## Позиционный маппинг результатов

`TestConfig` содержит `resultMapping` с позиционным маппингом:

```typescript
resultMapping: {
  position1: {
    E: { title: '...', description: '...' },
    I: { title: '...', description: '...' },
  },
  position2: {
    N: { title: '...', description: '...' },
    S: { title: '...', description: '...' },
  },
  position3: {
    T: { title: '...', description: '...' },
    F: { title: '...', description: '...' },
  },
  position4: {
    J: { title: '...', description: '...' },
    P: { title: '...', description: '...' },
    W: { title: '...', description: '...' },
  },
}
```

## Добавление нового теста

1. Создайте файл в `/src/tests/{TARIFF}/{AGE}/{GENDER}.ts`
2. Экспортируйте `TestConfig` с полями:
   - `meta` (tariff, age, gender)
   - `questions` (массив из 5 вопросов)
   - `resultMapping` (позиционный маппинг для всех 4 позиций)
3. Добавьте импорт в `getTestConfig.ts`

## Важные правила

- `resolveResult` **обязательно** принимает `config` как второй параметр
- `TestConfig` **не содержит** lookup по типу (ESTJ, INFP и т.д.)
- `resultMapping` **позиционный** - каждая позиция содержит маппинг букв на результаты
- `getTestConfig` **синхронный** - использует статические импорты
- `sendResult` **не является частью engine** - находится в `utils`
