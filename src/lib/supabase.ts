import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Проверяем, что используется anon key, а не service role key
if (supabaseAnonKey.startsWith('sb_secret_')) {
  throw new Error(
    'ОШИБКА: Используется секретный ключ (service role key) вместо анонимного ключа (anon key).\n' +
    'Секретный ключ нельзя использовать в браузере!\n\n' +
    'Как найти anon key:\n' +
    '1. Откройте панель Supabase: https://supabase.com/dashboard\n' +
    '2. Выберите ваш проект\n' +
    '3. Перейдите в Settings > API\n' +
    '4. Скопируйте "anon public" ключ (начинается с eyJ...)\n' +
    '5. Обновите VITE_SUPABASE_ANON_KEY в .env файле'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

