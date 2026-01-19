# 📊 Сравнение текстовых модулей: Excel vs JSON

## ✅ Результаты сравнения

**Дата проверки:** 2025-01-20  
**Файлы:**
- Excel: `text_modules/text_modules.xlsx`
- JSON: `src/data/text_modules.json`

### Статистика

- **Всего записей:** 45 (3 возрастные группы × 5 модулей × 3 диапазона)
- **Совпадений:** 45 (100%)
- **Проблем/различий:** 0

**Вывод:** ✅ Данные в JSON полностью соответствуют данным в Excel файле.

---

## 📋 Структура данных

### Возрастные группы

1. **12-17** (используются данные из колонок "15-17 лет" в Excel)
2. **18-20**
3. **21+**

### Модули

1. **motivation** (Мотивация) - зависит от оси 5 (Драйвер мотивации)
2. **start** (Старт действий) - зависит от оси 6 (Старт действий)
3. **conflict** (Стиль диалога в напряжении) - зависит от оси 7 (Стиль диалога в напряжении)
4. **expression** (Выраженность) - зависит от метрики "Выраженность"
5. **confidence** (Уверенность) - зависит от метрики "Уверенность"

### Диапазоны (Bands)

- **L** (Left): 0-35 - Левая сторона шкалы
- **M** (Middle): 36-64 - Середина шкалы
- **R** (Right): 65-100 - Правая сторона шкалы

---

## 🔍 Проверка использования в коде

### 1. Структура JSON

**Ожидаемая структура:**
```json
{
  "ageGroups": {
    "12-17": {
      "motivation": { "L": "...", "M": "...", "R": "..." },
      "start": { "L": "...", "M": "...", "R": "..." },
      "conflict": { "L": "...", "M": "...", "R": "..." },
      "expression": { "L": "...", "M": "...", "R": "..." },
      "confidence": { "L": "...", "M": "...", "R": "..." }
    },
    "18-20": { ... },
    "21+": { ... }
  }
}
```

**Статус:** ✅ Структура полностью соответствует ожидаемой в коде.

---

### 2. Функция `getBand`

**Расположение:** `src/engine/resolveVipMetrics.ts:276-280`

**Реализация:**
```typescript
export function getBand(score: number): 'L' | 'M' | 'R' {
  if (score <= 35) return 'L';
  if (score <= 64) return 'M';
  return 'R';
}
```

**Соответствие документации:** ✅ Полностью соответствует `vip_rules.md`

**Диапазоны:**
- 0-35 → L ✅
- 36-64 → M ✅
- 65-100 → R ✅

---

### 3. Функция `getTextModule`

**Расположение:** `src/engine/resolveVipMetrics.ts:285-303`

**Реализация:**
```typescript
function getTextModule(
  modules: any,
  ageGroup: ExtendedAgeGroup,
  moduleName: 'motivation' | 'start' | 'conflict' | 'expression' | 'confidence',
  axisValue: number
): string {
  if (!modules || !modules.ageGroups) {
    return '';
  }
  
  const band = getBand(axisValue);
  const ageGroupData = modules.ageGroups[ageGroup];
  
  if (!ageGroupData || !ageGroupData[moduleName]) {
    return '';
  }
  
  return ageGroupData[moduleName][band] || '';
}
```

**Логика работы:**
1. ✅ Проверяет наличие `modules` и `modules.ageGroups`
2. ✅ Определяет диапазон (L/M/R) на основе `axisValue` через `getBand`
3. ✅ Извлекает данные для нужной возрастной группы
4. ✅ Извлекает данные для нужного модуля
5. ✅ Возвращает текст для нужного диапазона

**Статус:** ✅ Логика корректна

---

### 4. Использование в `resolveVipMetrics`

**Расположение:** `src/engine/resolveVipMetrics.ts:352-358`

**Реализация:**
```typescript
// 5. Выбор текстовых модулей на основе осей 5-7 и метрик (если модули переданы)
const ageGroup = config.meta.ageGroup;
const motivationModule = textModules ? getTextModule(textModules, ageGroup, 'motivation', axis5) : '';
const startModule = textModules ? getTextModule(textModules, ageGroup, 'start', axis6) : '';
const conflictModule = textModules ? getTextModule(textModules, ageGroup, 'conflict', axis7) : '';
const expressionModule = textModules ? getTextModule(textModules, ageGroup, 'expression', expression) : '';
const confidenceModule = textModules ? getTextModule(textModules, ageGroup, 'confidence', confidence) : '';
```

**Соответствие документации:** ✅ Полностью соответствует `vip_rules.md`

**Маппинг модулей на оси/метрики:**
- `motivation` → `axis5` (Драйвер мотивации) ✅
- `start` → `axis6` (Старт действий) ✅
- `conflict` → `axis7` (Стиль диалога в напряжении) ✅
- `expression` → `expression` (метрика Выраженность) ✅
- `confidence` → `confidence` (метрика Уверенность) ✅

**Статус:** ✅ Все модули правильно привязаны к соответствующим осям/метрикам

---

## ⚠️ Важные замечания

### 1. Возрастная группа "12-17"

**Особенность:** В Excel файле есть две колонки:
- "12-14 лет" (колонки 2-4)
- "15-17 лет" (колонки 5-7)

**Текущая реализация:** Используются данные из колонок "15-17 лет" (колонки 5-7) для возрастной группы "12-17" в JSON.

**Рекомендация:** Если нужно использовать данные для "12-14 лет", необходимо изменить скрипт конвертации `convert_text_modules.py` (строка 80).

---

### 2. Обработка пустых значений

**Текущая реализация:**
- Если `textModules` не передан → возвращается пустая строка `''`
- Если модуль не найден → возвращается пустая строка `''`
- Если диапазон не найден → возвращается пустая строка `''`

**Статус:** ✅ Обработка корректна, не вызывает ошибок

---

### 3. Загрузка модулей в `ResultVip.tsx`

**Расположение:** `src/pages/ResultVip.tsx:30-64`

**Реализация:**
```typescript
let textModules = null;
try {
  const response = await fetch('/data/text_modules.json');
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      textModules = await response.json();
    } else {
      console.warn('Сервер вернул не JSON, пропускаем загрузку модулей');
    }
  } else {
    console.warn(`Не удалось загрузить текстовые модули: ${response.status} ${response.statusText}`);
  }
} catch (error) {
  console.warn('Не удалось загрузить текстовые модули:', error);
}
```

**Статус:** ✅ Обработка ошибок корректна, модули загружаются опционально

**Важно:** Файл должен находиться в `public/data/text_modules.json` для доступа через HTTP.

---

## ✅ Итоговый вердикт

### Соответствие данных: 100% ✅

1. ✅ **JSON полностью соответствует Excel** - все 45 записей совпадают
2. ✅ **Структура JSON корректна** - соответствует ожидаемой в коде
3. ✅ **Функция `getBand` работает правильно** - корректно определяет диапазоны L/M/R
4. ✅ **Функция `getTextModule` работает правильно** - корректно извлекает тексты
5. ✅ **Модули правильно привязаны к осям/метрикам** - соответствуют документации
6. ✅ **Обработка ошибок корректна** - не вызывает падений при отсутствии модулей

### Рекомендации

1. ✅ **Текущая реализация полностью корректна** - никаких изменений не требуется
2. ⚠️ **Опционально:** Можно добавить логирование для отладки выбора модулей
3. ⚠️ **Опционально:** Можно добавить unit-тесты для проверки выбора модулей

---

## 📚 Связанные файлы

- **Excel источник:** `text_modules/text_modules.xlsx`
- **JSON результат:** `src/data/text_modules.json` (должен быть скопирован в `public/data/text_modules.json`)
- **Скрипт конвертации:** `scripts/convert_text_modules.py`
- **Скрипт сравнения:** `scripts/compare_text_modules.py`
- **Использование в коде:**
  - `src/engine/resolveVipMetrics.ts` - функции `getBand`, `getTextModule`, `resolveVipMetrics`
  - `src/pages/ResultVip.tsx` - загрузка и передача модулей

---

## 🔧 Команды для проверки

```bash
# Запуск сравнения
python scripts/compare_text_modules.py

# Конвертация Excel в JSON (если нужно обновить)
python scripts/convert_text_modules.py
```


