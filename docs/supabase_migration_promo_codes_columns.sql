-- Миграция: добавить недостающие колонки в promo_codes (если таблица создана вручную без них).
-- Выполнить в Supabase: Dashboard → SQL Editor → New query → вставить и Run.
-- После миграции: RPC check_promo_code будет работать и промокод можно применить на сайте.

ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS valid_until timestamptz;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS max_uses int;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS used_count int DEFAULT 0;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.promo_codes SET used_count = 0 WHERE used_count IS NULL;
