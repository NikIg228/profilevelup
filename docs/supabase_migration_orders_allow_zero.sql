-- Миграция: разрешить заказы с нулевой суммой (100% промокод — доступ к отчёту без Robokassa).
-- Выполнить в Supabase: Dashboard → SQL Editor → New query → вставить и Run.

-- Удаляем ограничение amount > 0 и добавляем amount >= 0
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_amount_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_amount_check CHECK (amount >= 0);
