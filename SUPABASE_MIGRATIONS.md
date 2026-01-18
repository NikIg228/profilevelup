# SQL Миграции для Supabase

## Применение миграций

### Способ 1: Через SQL Editor в Supabase Dashboard

1. Откройте панель Supabase: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `supabase/migrations/001_initial_schema.sql`
5. Вставьте в SQL Editor и нажмите **Run**
6. Повторите для `supabase/migrations/002_update_profile_on_email_change.sql`

### Способ 2: Через Supabase CLI (если установлен)

```bash
# Применить все миграции
supabase db push

# Или применить конкретную миграцию
supabase migration up
```

## Что делают миграции

### 001_initial_schema.sql

- Создает таблицу `profiles` для хранения дополнительной информации о пользователях
- Создает таблицу `test_history` для истории тестов
- Настраивает Row Level Security (RLS) политики
- Создает триггеры для автоматического создания профиля при регистрации
- Создает индексы для оптимизации запросов

### 002_update_profile_on_email_change.sql

- Создает триггер для синхронизации email между `auth.users` и `profiles`
- Автоматически обновляет email в профиле при изменении в auth.users

## Настройка сброса пароля

1. В панели Supabase перейдите в **Authentication** → **Email Templates**
2. Настройте шаблон "Reset Password" (опционально)
3. В **Authentication** → **URL Configuration** укажите:
   - **Site URL**: `http://localhost:5173` (для разработки)
   - **Redirect URLs**: добавьте `http://localhost:5173/account?reset=true`

## Проверка работы

После применения миграций проверьте:

1. Таблица `profiles` создана и доступна
2. Таблица `test_history` создана и доступна
3. RLS политики активны
4. Триггеры работают (проверьте создание профиля при регистрации)



