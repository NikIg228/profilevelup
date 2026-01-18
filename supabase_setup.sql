-- ============================================
-- SQL Команды для настройки Supabase
-- ============================================
-- Настройка базы данных для авторизации через email + пароль
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
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Комментарии к таблице
COMMENT ON TABLE public.profiles IS 'Профили пользователей с дополнительной информацией';
COMMENT ON COLUMN public.profiles.id IS 'ID пользователя (связь с auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'Полное имя пользователя';
COMMENT ON COLUMN public.profiles.email IS 'Email пользователя (синхронизируется с auth.users)';
COMMENT ON COLUMN public.profiles.created_at IS 'Дата создания профиля';
COMMENT ON COLUMN public.profiles.updated_at IS 'Дата последнего обновления профиля';

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

-- Триггер для автоматического создания профиля при регистрации
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

-- Триггер для синхронизации email при изменении в auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_change();

-- ============================================
-- 5. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ============================================

-- Индекс для быстрого поиска по email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================
-- 6. ПРОВЕРКА УСТАНОВКИ
-- ============================================

DO $$
BEGIN
  -- Проверка таблицы profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'Таблица profiles не создана!';
  END IF;
  
  -- Проверка обязательных колонок
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
    RAISE EXCEPTION 'Колонка profiles.id не существует!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    RAISE EXCEPTION 'Колонка profiles.email не существует!';
  END IF;
  
  -- Проверка триггеров
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE 'Триггер on_auth_user_created создан';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_email_changed') THEN
    RAISE NOTICE 'Триггер on_auth_user_email_changed создан';
  END IF;
  
  RAISE NOTICE 'Настройка завершена успешно!';
  RAISE NOTICE 'Таблица profiles создана и настроена';
  RAISE NOTICE 'Триггеры для автоматического создания и синхронизации профилей настроены';
  RAISE NOTICE 'RLS политики настроены для безопасности';
END $$;

-- ============================================
-- КОНЕЦ УСТАНОВКИ
-- ============================================

