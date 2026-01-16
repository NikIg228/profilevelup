# Настройка Supabase CLI

## ✅ Установка завершена

Supabase CLI успешно установлен через Scoop.

Версия: `2.67.1`

## Подключение к существующему проекту

### Шаг 1: Вход в Supabase

Выполните команду:
```bash
supabase login
```

Откроется браузер для авторизации. После входа вернитесь в терминал.

### Шаг 2: Получение Project Reference ID

1. Откройте панель Supabase: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **General**
4. Найдите **Reference ID** (обычно это строка вида `yvjadleeuweayspajthc`)

### Шаг 3: Подключение проекта

Выполните команду:
```bash
supabase link --project-ref yvjadleeuweayspajthc
```

Замените `yvjadleeuweayspajthc` на ваш Project Reference ID.

### Шаг 4: Применение миграций

После подключения примените миграции:

```bash
# Просмотр статуса миграций
supabase db remote list

# Применение всех миграций
supabase db push

# Или применение конкретной миграции
supabase migration up
```

## Полезные команды

```bash
# Просмотр статуса подключения
supabase status

# Просмотр удаленных миграций
supabase db remote list

# Создание новой миграции
supabase migration new migration_name

# Применение миграций на удаленный проект
supabase db push

# Просмотр различий между локальной и удаленной БД
supabase db diff

# Генерация TypeScript типов из схемы БД
supabase gen types typescript --linked > src/types/supabase.ts
```

## Структура проекта

После инициализации создана следующая структура:

```
supabase/
├── config.toml          # Конфигурация проекта
└── migrations/          # SQL миграции
    ├── 001_initial_schema.sql
    └── 002_update_profile_on_email_change.sql
```

## Примечания

- Все миграции находятся в папке `supabase/migrations/`
- Конфигурация проекта в `supabase/config.toml`
- После подключения можно использовать команды для управления БД


