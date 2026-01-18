# HTML Шаблоны для Email писем

Этот каталог содержит HTML шаблоны для автоматических email писем, отправляемых через Supabase Auth.

## Шаблоны

### 1. `signup.html` - Подтверждение регистрации
Используется для подтверждения email адреса при регистрации нового пользователя.

**Переменные Supabase:**
- `{{ .ConfirmationURL }}` - ссылка для подтверждения регистрации
- `{{ .Token }}` - токен подтверждения
- `{{ .Email }}` - email адрес пользователя
- `{{ .SiteURL }}` - URL сайта

### 2. `email_change.html` - Подтверждение изменения email
Используется для подтверждения изменения email адреса пользователя.

**Переменные Supabase:**
- `{{ .ConfirmationURL }}` - ссылка для подтверждения изменения email
- `{{ .Token }}` - токен подтверждения
- `{{ .Email }}` - новый email адрес
- `{{ .SiteURL }}` - URL сайта

### 3. `password_reset.html` - Сброс пароля
Используется для сброса пароля пользователя.

**Переменные Supabase:**
- `{{ .ConfirmationURL }}` - ссылка для сброса пароля
- `{{ .Token }}` - токен подтверждения
- `{{ .Email }}` - email адрес пользователя
- `{{ .SiteURL }}` - URL сайта

## Стилистика

Все шаблоны оформлены в единой стилистике сайта "Профиль будущего":

- **Цвета:**
  - Основной фон: `#F7F7F5`
  - Фон карточек: `#FFFFFF`
  - Основной текст: `#4A4A4A`
  - Заголовки: `#2B2B2B`
  - Акцент (золото): `#C9A24D`
  - Вторичный текст: `#7A7A7A`

- **Шрифты:**
  - Заголовки: Montserrat, Arial, sans-serif
  - Основной текст: Open Sans, Arial, sans-serif

- **Фон:**
  - Используется логотип `LOGO W TEXT AND BG HERO.png` как фоновое изображение

## Настройка

Шаблоны настроены в файле `supabase/config.toml`:

```toml
[auth.email.template.signup]
subject = "Подтверждение регистрации - Профиль будущего"
content_path = "./templates/signup.html"

[auth.email.template.change_email]
subject = "Подтверждение изменения email - Профиль будущего"
content_path = "./templates/email_change.html"

[auth.email.template.reset_password]
subject = "Сброс пароля - Профиль будущего"
content_path = "./templates/password_reset.html"
```

## Применение изменений

После изменения шаблонов необходимо перезапустить Supabase:

```bash
supabase stop
supabase start
```

Или применить изменения через миграции, если используется production окружение.

## Совместимость

Шаблоны оптимизированы для:
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Мобильные почтовые клиенты

Используются inline стили для максимальной совместимости с различными почтовыми клиентами.

