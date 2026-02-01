# Единое API — итоговое резюме

Документ описывает реализацию единого API для фронта и бэкенда.

---

## ✅ Что сделано

### 1. Единая конфигурация API

- ✅ Создан `src/config/api.ts` — централизованная конфигурация endpoints
- ✅ Используется переменная окружения `VITE_API_BASE_URL`
- ✅ Поддержка разных окружений (dev/prod)
- ✅ Все endpoints используют единую конфигурацию

### 2. Обновлён код фронта

- ✅ `reportApi.ts` использует `REPORT_API` из конфигурации
- ✅ `useTestStore.ts` использует `TEST_API` из конфигурации
- ✅ Все fetch запросы используют централизованные endpoints

### 3. Документация

- ✅ `DEPLOYMENT_ARCHITECTURE.md` — архитектура развертывания
- ✅ `DEPLOYMENT.md` — руководство по развертыванию
- ✅ `.env.example` — пример конфигурации

---

## 🏗️ Архитектура

### Развертывание

**Фронт:**
- **Где**: Netlify/Vercel (CDN)
- **Что**: Статические файлы React (dist/)
- **Домен**: `profi-level.com`

**Бэкенд:**
- **Где**: VPS (Ubuntu/Debian)
- **Что**: Python API (FastAPI/Flask)
- **Домен**: `api.profi-level.com`

### Почему раздельно?

1. **Фронт на CDN:**
   - ✅ Быстрая загрузка через CDN
   - ✅ Автоматический HTTPS
   - ✅ Простое развертывание (git push)
   - ✅ Бесплатный тариф для старта

2. **Бэкенд на VPS:**
   - ✅ Нужны ресурсы для генерации PDF
   - ✅ Работа с файлами (.docx модули)
   - ✅ База данных (PostgreSQL)
   - ✅ Отправка email
   - ✅ Полный контроль над окружением

---

## 🔌 Единое API

### Базовый URL

**Разработка:**
```
VITE_API_BASE_URL=http://localhost:8000/api
```

**Production:**
```
VITE_API_BASE_URL=https://api.profi-level.com/api
```

**Единый домен (альтернатива):**
```
VITE_API_BASE_URL=/api
```

### Endpoints

**Test API:**
- `POST /api/test/start` — создать сессию
- `PUT /api/test/progress/:testId` — сохранить прогресс
- `GET /api/test/progress/:testId` — получить прогресс
- `POST /api/test/complete/:testId` — завершить сессию

**Report API:**
- `POST /api/v1/reports` — создать задачу генерации отчёта
- `GET /api/v1/reports/:jobId` — статус задачи
- `POST /api/v1/validate-payload` — валидация payload

**Полная спецификация:** `API_SPEC.md`

---

## 📋 Использование на фронте

### Конфигурация

```typescript
import { TEST_API, REPORT_API } from '../config/api';

// Test API
fetch(TEST_API.START, { ... });
fetch(TEST_API.PROGRESS(testId), { ... });

// Report API
fetch(REPORT_API.CREATE, { ... });
fetch(REPORT_API.STATUS(jobId), { ... });
```

### Переменные окружения

**`.env` (локально):**
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Netlify (production):**
```
VITE_API_BASE_URL=https://api.profi-level.com/api
```

---

## 🔒 Безопасность

### CORS

Если фронт и бэкенд на разных доменах, настройте CORS на бэкенде:

```python
allow_origins=[
    "https://profi-level.com",
    "https://www.profi-level.com",
    "http://localhost:5173",  # Для разработки
]
```

### Rate Limiting

Рекомендуется добавить rate limiting на бэкенде, особенно для `/api/v1/reports` (генерация PDF ресурсоёмкая).

---

## 📊 Поток данных

### 1. Прохождение теста

```
Фронт → POST /api/test/start → Бэкенд → { testId }
Фронт → PUT /api/test/progress/:testId → Бэкенд → сохранение в БД
Фронт → POST /api/test/complete/:testId → Бэкенд → завершение
```

### 2. Генерация отчёта

```
Фронт → POST /api/v1/reports (payload_v1) → Бэкенд
  ├─► Валидация payload_v1
  ├─► Сохранение в БД
  ├─► Создание job (асинхронно)
  └─► Возврат: { jobId, status: "pending" }

Бэкенд (асинхронно):
  ├─► Выбор модуля
  ├─► Генерация .docx
  ├─► Конвертация в PDF
  └─► Отправка на email
```

---

## 🚀 Развертывание

### Фронт (Netlify)

1. Подключить репозиторий
2. Настроить build: `npm run build`, publish: `dist`
3. Добавить переменную: `VITE_API_BASE_URL=https://api.profi-level.com/api`
4. Deploy

**Подробнее:** `DEPLOYMENT.md`

### Бэкенд (VPS)

1. Установить зависимости (Python, PostgreSQL, Nginx)
2. Настроить структуру проекта
3. Настроить Nginx (reverse proxy)
4. Настроить SSL (Let's Encrypt)
5. Запустить API (systemd service)

**Подробнее:** `pb_backend/docs/DEPLOYMENT_ARCHITECTURE.md`

---

## ✅ Итог

- ✅ Единая конфигурация API на фронте
- ✅ Централизованные endpoints
- ✅ Поддержка разных окружений через переменные
- ✅ Документация по архитектуре и развертыванию
- ✅ Готовность к развертыванию фронта и бэкенда

**Следующие шаги:**
1. Реализовать бэкенд API согласно `API_SPEC.md`
2. Развернуть фронт на Netlify
3. Развернуть бэкенд на VPS
4. Настроить CORS и SSL
5. Протестировать интеграцию
