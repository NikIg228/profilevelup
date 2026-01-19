# Engine - Типы и интерфейсы

## Описание

Определения типов и интерфейсов для системы тестирования.

## Структура

```
/src/engine
  - types.ts                # Типы и интерфейсы
```

## Типы

### Основные типы

- `Tariff` - тариф теста ('FREE' | 'PRO' | 'PREMIUM' | 'EXTENDED')
- `AgeGroup` - возрастная группа ('13-17' | '18-24' | '25-34' | '35-45')
- `Gender` - пол ('male' | 'female')
- `QuestionLetter` - буква ответа на вопрос
- `ResultLetter` - буква результата
- `ResultIndex` - финальный результат теста в виде строки

### Типы ответов

- `Answers` - ответы на FREE тест (5 вопросов)
- `ExtendedAnswers` - ответы на EXTENDED/PREMIUM тест (28 вопросов)

### Типы конфигураций

- `FreeTestConfig` - конфигурация FREE теста
- `ExtendedTestConfig` - конфигурация EXTENDED/PREMIUM теста
- `TestConfig` - объединенный тип конфигурации теста

### Интерфейсы

- `Question` - вопрос FREE теста
- `ExtendedQuestion` - вопрос EXTENDED/PREMIUM теста
- `QuestionOption` - вариант ответа на вопрос
- `ExtendedQuestionOption` - вариант ответа для EXTENDED/PREMIUM теста
- `TestMeta` - метаданные теста
- `PositionalResultMapping` - позиционный маппинг результатов (для FREE)
- `DichotomyMapping` - описание дихотомии (для EXTENDED/PREMIUM)
- `BlockResultMapping` - блочный маппинг результатов (для EXTENDED/PREMIUM)

## Использование

```typescript
import type { Answers, ExtendedAnswers, TestConfig, Tariff, AgeGroup } from '../engine/types';
```
