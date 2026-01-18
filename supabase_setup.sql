-- ============================================
-- SQL Команды для настройки Supabase
-- ============================================
-- Этот файл содержит все необходимые SQL команды
-- для корректной работы приложения с Supabase
--
-- Инструкция по применению:
-- 1. Откройте панель Supabase: https://supabase.com/dashboard
-- 2. Выберите ваш проект
-- 3. Перейдите в SQL Editor
-- 4. Скопируйте и вставьте весь этот файл
-- 5. Нажмите Run
-- ============================================

-- ============================================
-- 1. СОЗДАНИЕ ТАБЛИЦЫ ПРОФИЛЕЙ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем недостающие колонки, если таблица уже существовала
DO $$
BEGIN
  -- Добавляем колонку full_name, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Добавляем колонку email, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Добавляем колонку created_at, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Добавляем колонку updated_at, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Комментарии к таблице и колонкам (только если они существуют)
DO $$
BEGIN
  -- Комментарий к таблице
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    COMMENT ON TABLE public.profiles IS 'Профили пользователей с дополнительной информацией';
    
    -- Комментарии к колонкам (только если они существуют)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
      COMMENT ON COLUMN public.profiles.id IS 'ID пользователя (связь с auth.users)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
      COMMENT ON COLUMN public.profiles.full_name IS 'Полное имя пользователя';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
      COMMENT ON COLUMN public.profiles.email IS 'Email пользователя (синхронизируется с auth.users)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
      COMMENT ON COLUMN public.profiles.created_at IS 'Дата создания профиля';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
      COMMENT ON COLUMN public.profiles.updated_at IS 'Дата последнего обновления профиля';
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. ВКЛЮЧЕНИЕ ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. ПОЛИТИКИ БЕЗОПАСНОСТИ ДЛЯ ПРОФИЛЕЙ
-- ============================================

-- Политика: пользователи могут читать только свой профиль
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Политика: пользователи могут обновлять только свой профиль
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Политика: пользователи могут вставлять только свой профиль
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Политика: пользователи могут удалять только свой профиль
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- 4. ФУНКЦИИ И ТРИГГЕРЫ ДЛЯ ПРОФИЛЕЙ
-- ============================================

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Функция для синхронизации email в профиле при изменении в auth.users
CREATE OR REPLACE FUNCTION public.handle_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для синхронизации email
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_change();

-- ============================================
-- 5. СОЗДАНИЕ ТАБЛИЦЫ ИСТОРИИ ТЕСТОВ
-- ============================================

CREATE TABLE IF NOT EXISTS public.test_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  tariff TEXT NOT NULL,
  age_group TEXT NOT NULL,
  result_index TEXT,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем недостающие колонки, если таблица уже существовала
DO $$
BEGIN
  -- Добавляем колонку answers, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'answers'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN answers JSONB;
  END IF;

  -- Добавляем колонку started_at, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Добавляем колонку created_at, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Добавляем колонку completed_at, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Добавляем колонку result_index, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'result_index'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN result_index TEXT;
  END IF;

  -- Добавляем колонку tariff, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'tariff'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN tariff TEXT NOT NULL DEFAULT 'free';
    ALTER TABLE public.test_history ALTER COLUMN tariff DROP DEFAULT;
  END IF;

  -- Добавляем колонку age_group, если её нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_history' 
    AND column_name = 'age_group'
  ) THEN
    ALTER TABLE public.test_history ADD COLUMN age_group TEXT NOT NULL DEFAULT 'teenager';
    ALTER TABLE public.test_history ALTER COLUMN age_group DROP DEFAULT;
  END IF;
END $$;

-- Комментарии к таблице и колонкам (только если колонки существуют)
DO $$
BEGIN
  -- Комментарий к таблице
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_history') THEN
    COMMENT ON TABLE public.test_history IS 'История прохождения тестов пользователями';
    
    -- Комментарии к колонкам (только если они существуют)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'id') THEN
      COMMENT ON COLUMN public.test_history.id IS 'Уникальный ID записи истории';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'user_id') THEN
      COMMENT ON COLUMN public.test_history.user_id IS 'ID пользователя (связь с auth.users)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'test_id') THEN
      COMMENT ON COLUMN public.test_history.test_id IS 'Идентификатор теста';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'tariff') THEN
      COMMENT ON COLUMN public.test_history.tariff IS 'Тариф теста (free/pro)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'age_group') THEN
      COMMENT ON COLUMN public.test_history.age_group IS 'Возрастная группа (teenager/parent)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'result_index') THEN
      COMMENT ON COLUMN public.test_history.result_index IS 'Индекс результата теста';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'answers') THEN
      COMMENT ON COLUMN public.test_history.answers IS 'JSON объект с ответами пользователя';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'completed_at') THEN
      COMMENT ON COLUMN public.test_history.completed_at IS 'Дата и время завершения теста';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'started_at') THEN
      COMMENT ON COLUMN public.test_history.started_at IS 'Дата и время начала теста';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'created_at') THEN
      COMMENT ON COLUMN public.test_history.created_at IS 'Дата создания записи';
    END IF;
  END IF;
END $$;

-- ============================================
-- 6. ВКЛЮЧЕНИЕ RLS ДЛЯ ИСТОРИИ ТЕСТОВ
-- ============================================

ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. ПОЛИТИКИ БЕЗОПАСНОСТИ ДЛЯ ИСТОРИИ ТЕСТОВ
-- ============================================

-- Политика: пользователи могут читать только свою историю
DROP POLICY IF EXISTS "Users can view own test history" ON public.test_history;
CREATE POLICY "Users can view own test history"
  ON public.test_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут вставлять только свою историю
DROP POLICY IF EXISTS "Users can insert own test history" ON public.test_history;
CREATE POLICY "Users can insert own test history"
  ON public.test_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять только свою историю
DROP POLICY IF EXISTS "Users can update own test history" ON public.test_history;
CREATE POLICY "Users can update own test history"
  ON public.test_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Политика: пользователи могут удалять только свою историю
DROP POLICY IF EXISTS "Users can delete own test history" ON public.test_history;
CREATE POLICY "Users can delete own test history"
  ON public.test_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ============================================

-- Индексы для таблицы profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Индексы для таблицы test_history
CREATE INDEX IF NOT EXISTS idx_test_history_user_id ON public.test_history(user_id);
CREATE INDEX IF NOT EXISTS idx_test_history_completed_at ON public.test_history(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_history_test_id ON public.test_history(test_id);
CREATE INDEX IF NOT EXISTS idx_test_history_tariff ON public.test_history(tariff);
CREATE INDEX IF NOT EXISTS idx_test_history_age_group ON public.test_history(age_group);
CREATE INDEX IF NOT EXISTS idx_test_history_user_tariff ON public.test_history(user_id, tariff);

-- Составной индекс для быстрого поиска истории пользователя по тарифу
CREATE INDEX IF NOT EXISTS idx_test_history_user_completed ON public.test_history(user_id, completed_at DESC);

-- ============================================
-- 9. ТАБЛИЦА ДЛЯ ЛОГИРОВАНИЯ ИЗМЕНЕНИЙ ПАРОЛЯ И EMAIL
-- ============================================

-- Таблица для хранения запросов на изменение пароля и email
CREATE TABLE IF NOT EXISTS public.password_email_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('password', 'email')),
  old_value TEXT,
  new_value TEXT,
  confirmation_token TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Комментарии к таблице
COMMENT ON TABLE public.password_email_changes IS 'Логирование запросов на изменение пароля и email';
COMMENT ON COLUMN public.password_email_changes.change_type IS 'Тип изменения: password или email';
COMMENT ON COLUMN public.password_email_changes.confirmation_token IS 'Токен для подтверждения изменения';
COMMENT ON COLUMN public.password_email_changes.expires_at IS 'Время истечения токена (обычно 24 часа)';

-- Включаем RLS для таблицы изменений
ALTER TABLE public.password_email_changes ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут читать только свои запросы на изменение
DROP POLICY IF EXISTS "Users can view own password email changes" ON public.password_email_changes;
CREATE POLICY "Users can view own password email changes"
  ON public.password_email_changes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут вставлять только свои запросы
DROP POLICY IF EXISTS "Users can insert own password email changes" ON public.password_email_changes;
CREATE POLICY "Users can insert own password email changes"
  ON public.password_email_changes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять только свои запросы
DROP POLICY IF EXISTS "Users can update own password email changes" ON public.password_email_changes;
CREATE POLICY "Users can update own password email changes"
  ON public.password_email_changes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Индекс для быстрого поиска по токену подтверждения
CREATE INDEX IF NOT EXISTS idx_password_email_changes_token ON public.password_email_changes(confirmation_token) WHERE confirmed = FALSE;
CREATE INDEX IF NOT EXISTS idx_password_email_changes_user_id ON public.password_email_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_email_changes_expires_at ON public.password_email_changes(expires_at) WHERE confirmed = FALSE;

-- ============================================
-- 10. ФУНКЦИИ ДЛЯ ИЗМЕНЕНИЯ ПАРОЛЯ С ПОДТВЕРЖДЕНИЕМ
-- ============================================

-- Функция для создания запроса на изменение пароля
-- ВНИМАНИЕ: Пароль не сохраняется в базе данных для безопасности.
-- Токен отправляется на email пользователя для подтверждения.
-- После подтверждения пароль должен быть изменен через Supabase Auth API.
CREATE OR REPLACE FUNCTION public.request_password_change(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_user_email TEXT;
  v_result JSONB;
BEGIN
  -- Проверяем, что пользователь существует
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;
  
  -- Генерируем токен подтверждения
  v_token := encode(gen_random_bytes(32), 'base64');
  
  -- Создаем запись о запросе на изменение (без сохранения пароля)
  INSERT INTO public.password_email_changes (
    user_id,
    change_type,
    confirmation_token,
    expires_at
  ) VALUES (
    p_user_id,
    'password',
    v_token,
    NOW() + INTERVAL '24 hours'
  );
  
  -- Возвращаем токен и email для отправки письма
  -- В Supabase отправка email обычно делается через API или Edge Function
  -- Используйте Supabase Auth API: auth.resetPasswordForEmail(v_user_email, { redirectTo: ... })
  v_result := jsonb_build_object(
    'token', v_token,
    'user_id', p_user_id,
    'email', v_user_email,
    'expires_at', NOW() + INTERVAL '24 hours',
    'message', 'Используйте Supabase Auth API для отправки email с токеном подтверждения'
  );
  
  RETURN v_result;
END;
$$;

-- Функция для подтверждения изменения пароля
-- ВНИМАНИЕ: Эта функция только помечает запрос как подтвержденный.
-- Фактическое изменение пароля должно выполняться через Supabase Auth API
-- в Edge Function или через API endpoint, используя токен подтверждения.
CREATE OR REPLACE FUNCTION public.confirm_password_change(
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_record RECORD;
  v_result JSONB;
BEGIN
  -- Находим запись по токену
  SELECT * INTO v_change_record
  FROM public.password_email_changes
  WHERE confirmation_token = p_token
    AND change_type = 'password'
    AND confirmed = FALSE
    AND expires_at > NOW();
  
  IF v_change_record IS NULL THEN
    RAISE EXCEPTION 'Недействительный или истекший токен';
  END IF;
  
  -- Помечаем запрос как подтвержденный
  UPDATE public.password_email_changes
  SET confirmed = TRUE,
      confirmed_at = NOW()
  WHERE id = v_change_record.id;
  
  -- Возвращаем информацию для дальнейшего использования в API
  -- Фактическое изменение пароля должно быть выполнено через Supabase Auth Admin API
  -- Пример: auth.admin.updateUserById(v_change_record.user_id, { password: new_password })
  v_result := jsonb_build_object(
    'user_id', v_change_record.user_id,
    'token', p_token,
    'confirmed', TRUE,
    'message', 'Токен подтвержден. Используйте Supabase Auth Admin API для изменения пароля.'
  );
  
  RETURN v_result;
END;
$$;

-- ============================================
-- 11. ФУНКЦИИ ДЛЯ ИЗМЕНЕНИЯ EMAIL С ПОДТВЕРЖДЕНИЕМ
-- ============================================

-- Функция для создания запроса на изменение email
CREATE OR REPLACE FUNCTION public.request_email_change(
  p_user_id UUID,
  p_new_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_old_email TEXT;
  v_result JSONB;
BEGIN
  -- Проверяем, что пользователь существует
  SELECT email INTO v_old_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_old_email IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;
  
  -- Проверяем, что новый email отличается от старого
  IF v_old_email = p_new_email THEN
    RAISE EXCEPTION 'Новый email совпадает со старым';
  END IF;
  
  -- Проверяем, что новый email не используется другим пользователем
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_new_email AND id != p_user_id) THEN
    RAISE EXCEPTION 'Email уже используется другим пользователем';
  END IF;
  
  -- Генерируем токен подтверждения
  v_token := encode(gen_random_bytes(32), 'base64');
  
  -- Создаем запись о запросе на изменение
  INSERT INTO public.password_email_changes (
    user_id,
    change_type,
    old_value,
    new_value,
    confirmation_token,
    expires_at
  ) VALUES (
    p_user_id,
    'email',
    v_old_email,
    p_new_email,
    v_token,
    NOW() + INTERVAL '24 hours'
  );
  
  -- Возвращаем информацию для отправки email
  -- В Supabase отправка email обычно делается через API или Edge Function
  v_result := jsonb_build_object(
    'token', v_token,
    'user_id', p_user_id,
    'old_email', v_old_email,
    'new_email', p_new_email,
    'expires_at', NOW() + INTERVAL '24 hours',
    'message', 'Используйте Edge Function для отправки email с токеном подтверждения на новый email'
  );
  
  RETURN v_result;
END;
$$;

-- Функция для подтверждения изменения email
-- ВНИМАНИЕ: Прямое изменение email в auth.users требует специальных прав.
-- Рекомендуется использовать Supabase Auth Admin API: auth.admin.updateUserById()
-- Эта функция должна вызываться из Edge Function или через API endpoint.
CREATE OR REPLACE FUNCTION public.confirm_email_change(
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_record RECORD;
  v_result JSONB;
BEGIN
  -- Находим запись по токену
  SELECT * INTO v_change_record
  FROM public.password_email_changes
  WHERE confirmation_token = p_token
    AND change_type = 'email'
    AND confirmed = FALSE
    AND expires_at > NOW();
  
  IF v_change_record IS NULL THEN
    RAISE EXCEPTION 'Недействительный или истекший токен';
  END IF;
  
  -- Обновляем email в auth.users
  -- ВНИМАНИЕ: Это требует прав суперпользователя или использования Auth Admin API
  UPDATE auth.users
  SET email = v_change_record.new_value,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_change_record.user_id;
  
  -- Обновляем email в profiles (триггер handle_email_change также обновит это)
  UPDATE public.profiles
  SET email = v_change_record.new_value,
      updated_at = NOW()
  WHERE id = v_change_record.user_id;
  
  -- Помечаем запрос как подтвержденный
  UPDATE public.password_email_changes
  SET confirmed = TRUE,
      confirmed_at = NOW()
  WHERE id = v_change_record.id;
  
  -- Возвращаем информацию об успешном изменении
  v_result := jsonb_build_object(
    'user_id', v_change_record.user_id,
    'old_email', v_change_record.old_value,
    'new_email', v_change_record.new_value,
    'confirmed', TRUE,
    'confirmed_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- Функция для очистки истекших токенов (можно запускать периодически)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Удаляем истекшие неподтвержденные запросы старше 7 дней
  DELETE FROM public.password_email_changes
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND confirmed = FALSE;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- ============================================
-- 12. ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ
-- ============================================

-- Включаем расширение для генерации UUID (если еще не включено)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Включаем расширение для работы с JSONB (обычно уже включено)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Включаем расширение для криптографии (для хеширования паролей)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 13. ПРОВЕРКА УСТАНОВКИ
-- ============================================

-- Проверяем, что таблицы созданы и содержат все необходимые колонки
DO $$
BEGIN
  -- Проверка таблицы profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'Таблица profiles не создана!';
  END IF;
  
  -- Проверка обязательных колонок profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
    RAISE EXCEPTION 'Колонка profiles.id не существует!';
  END IF;
  
  -- Проверка таблицы test_history
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_history') THEN
    RAISE EXCEPTION 'Таблица test_history не создана!';
  END IF;
  
  -- Проверка обязательных колонок test_history
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'id') THEN
    RAISE EXCEPTION 'Колонка test_history.id не существует!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'user_id') THEN
    RAISE EXCEPTION 'Колонка test_history.user_id не существует!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'test_id') THEN
    RAISE EXCEPTION 'Колонка test_history.test_id не существует!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'tariff') THEN
    RAISE EXCEPTION 'Колонка test_history.tariff не существует!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'age_group') THEN
    RAISE EXCEPTION 'Колонка test_history.age_group не существует!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_history' AND column_name = 'answers') THEN
    RAISE EXCEPTION 'Колонка test_history.answers не существует!';
  END IF;
  
  -- Проверка таблицы password_email_changes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_email_changes') THEN
    RAISE NOTICE 'Таблица password_email_changes создана';
  END IF;
  
  -- Проверка функций
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'request_password_change') THEN
    RAISE NOTICE 'Функция request_password_change создана';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_password_change') THEN
    RAISE NOTICE 'Функция confirm_password_change создана';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'request_email_change') THEN
    RAISE NOTICE 'Функция request_email_change создана';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_email_change') THEN
    RAISE NOTICE 'Функция confirm_email_change создана';
  END IF;
  
  RAISE NOTICE 'Все таблицы, колонки и функции успешно созданы и проверены!';
END $$;

-- ============================================
-- КОНЕЦ УСТАНОВКИ
-- ============================================
-- После выполнения этого скрипта:
-- 1. Таблицы profiles и test_history будут созданы
-- 2. Таблица password_email_changes для логирования изменений
-- 3. RLS политики будут настроены
-- 4. Триггеры будут автоматически создавать профили при регистрации
-- 5. Email будет синхронизироваться между auth.users и profiles
-- 6. Индексы будут созданы для оптимизации запросов
-- 7. Функции для изменения пароля с подтверждением по email:
--    - request_password_change(user_id) - создает запрос и возвращает токен
--      Используйте Supabase Auth API: auth.resetPasswordForEmail() для отправки email
--    - confirm_password_change(token) - подтверждает токен
--      Фактическое изменение пароля должно быть через Supabase Auth Admin API
-- 8. Функции для изменения email с подтверждением по email:
--    - request_email_change(user_id, new_email) - создает запрос и возвращает токен
--      Отправьте email с токеном на новый email через Edge Function
--    - confirm_email_change(token) - подтверждает и изменяет email
--      Автоматически обновляет email в auth.users и profiles
-- 9. Функция cleanup_expired_tokens() - очистка истекших токенов
--
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
--
-- 1. Запрос на изменение пароля:
--    SELECT * FROM request_password_change('user-uuid-here');
--    Результат: { token, user_id, email, expires_at }
--    Затем используйте Supabase Auth API для отправки email с токеном
--
-- 2. Подтверждение изменения пароля:
--    SELECT * FROM confirm_password_change('token-from-email');
--    Затем используйте Supabase Auth Admin API для фактического изменения пароля
--
-- 3. Запрос на изменение email:
--    SELECT * FROM request_email_change('user-uuid-here', 'new@email.com');
--    Результат: { token, user_id, old_email, new_email, expires_at }
--    Отправьте email с токеном на новый email через Edge Function
--
-- 4. Подтверждение изменения email:
--    SELECT * FROM confirm_email_change('token-from-email');
--    Результат: { user_id, old_email, new_email, confirmed, confirmed_at }
--
-- ВАЖНО: 
-- - Функции confirm_password_change и confirm_email_change требуют
--   использования Supabase Auth Admin API для изменения данных в auth.users.
-- - Рекомендуется вызывать эти функции из Edge Function или через API endpoint.
-- - Для отправки email используйте Supabase Auth API или Edge Functions.
-- ============================================

