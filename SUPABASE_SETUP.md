# Настройка Supabase

## Проблема: "Forbidden use of secret API key in browser"

Эта ошибка возникает, когда в `.env` файле указан **секретный ключ (service role key)** вместо **анонимного ключа (anon key)**.

## Решение

### 1. Найдите правильный anon key в Supabase:

1. Откройте панель Supabase: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Найдите раздел **Project API keys**
5. Скопируйте ключ **"anon public"** (он начинается с `eyJ...` и является JWT токеном)

### 2. Обновите .env файл:

Замените значение `VITE_SUPABASE_ANON_KEY` на anon key:

```env
VITE_SUPABASE_URL=https://yvjadleeuweayspajthc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...ваш_anon_key_здесь
```

### 3. Перезапустите dev-сервер:

```bash
npm run dev
```

## Разница между ключами:

- **anon key** (публичный) - безопасен для браузера, работает с RLS политиками
- **service role key** (секретный) - только для сервера, обходит все политики безопасности

⚠️ **ВАЖНО**: Никогда не используйте service role key в браузере!

