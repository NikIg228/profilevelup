-- =============================================================================
-- Supabase: схема БД для ProfiLevelUp
-- Профили, промокоды, заказы (платежи Робокасса), покупки (доступ к тестам)
--
-- Как применить:
-- 1. Открыть Supabase Dashboard → SQL Editor
-- 2. Вставить весь скрипт и нажать Run (или выполнять блоки по порядку)
-- 3. При ошибке "already exists" можно пропустить соответствующий create
--
-- Порядок: profiles → promo_codes → orders → purchases → индексы → grant
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ПРОФИЛИ (profiles)
-- Связаны с auth.users, создаются автоматически при регистрации
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'Профили пользователей (расширение auth.users)';

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Вставка только через триггер handle_new_user (security definer), не из клиента.
-- Политику insert не создаём: тогда только владелец таблицы / definer может вставлять.

-- Триггер: создание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Обновление updated_at при изменении профиля
create or replace function public.profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.profiles_updated_at();


-- -----------------------------------------------------------------------------
-- 2. ПРОМОКОДЫ (promo_codes)
-- Создание в админке, проверка через RPC check_promo_code
-- -----------------------------------------------------------------------------

create table if not exists public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_percent int check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  discount_fixed int check (discount_fixed is null or discount_fixed >= 0),
  valid_from timestamptz default now(),
  valid_until timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  used_count int default 0 check (used_count >= 0),
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint promo_discount_check check (
    (discount_percent is not null and discount_fixed is null) or
    (discount_percent is null and discount_fixed is not null)
  )
);

comment on table public.promo_codes is 'Промокоды для скидок на тесты';
comment on column public.promo_codes.code is 'Код (уникальный, без учёта регистра при проверке)';
comment on column public.promo_codes.discount_percent is 'Скидка в % (0–100), взаимоисключающе с discount_fixed';
comment on column public.promo_codes.discount_fixed is 'Фиксированная скидка в единицах валюты';
comment on column public.promo_codes.valid_until is 'Действителен до (null = без ограничения)';
comment on column public.promo_codes.max_uses is 'Макс. использований (null = без ограничения)';

alter table public.promo_codes enable row level security;

drop policy if exists "promo_codes_select_authenticated" on public.promo_codes;
create policy "promo_codes_select_authenticated"
  on public.promo_codes for select
  to authenticated
  using (true);

drop policy if exists "promo_codes_insert_authenticated" on public.promo_codes;
create policy "promo_codes_insert_authenticated"
  on public.promo_codes for insert
  to authenticated
  with check (true);

drop policy if exists "promo_codes_update_authenticated" on public.promo_codes;
create policy "promo_codes_update_authenticated"
  on public.promo_codes for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "promo_codes_delete_authenticated" on public.promo_codes;
create policy "promo_codes_delete_authenticated"
  on public.promo_codes for delete
  to authenticated
  using (true);

-- RPC: проверка промокода (доступно без авторизации, возвращает только валидность и скидку)
create or replace function public.check_promo_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select id, discount_percent, discount_fixed, max_uses, used_count, valid_from, valid_until
  into rec
  from public.promo_codes
  where lower(trim(code)) = lower(trim(nullif(p_code, '')))
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
    and (max_uses is null or used_count < max_uses)
  limit 1;

  if rec.id is null then
    return json_build_object('valid', false);
  end if;

  return json_build_object(
    'valid', true,
    'discount_percent', rec.discount_percent,
    'discount_fixed', rec.discount_fixed
  );
end;
$$;

comment on function public.check_promo_code(text) is 'Проверка промокода. Возвращает { valid, discount_percent?, discount_fixed? }. Вызов: select check_promo_code(''SUMMER20'');';


-- -----------------------------------------------------------------------------
-- 3. ЗАКАЗЫ / ПЛАТЕЖИ (orders)
-- Создаются при нажатии «Оплатить», обновляются по Result URL Робокассы
-- -----------------------------------------------------------------------------

create sequence if not exists public.orders_inv_id_seq;

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  inv_id int unique not null default nextval('public.orders_inv_id_seq'),
  user_id uuid references auth.users(id) on delete set null,
  tariff text not null check (tariff in ('EXTENDED', 'PREMIUM')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'KZT',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'expired')),
  email text,
  test_id text,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  robokassa_out_sum numeric(12, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  paid_at timestamptz
);

comment on table public.orders is 'Заказы (платежи Робокасса). inv_id — InvId для подписи и Result URL.';
comment on column public.orders.inv_id is 'Уникальный номер заказа для Робокассы (InvId)';
comment on column public.orders.robokassa_out_sum is 'Сумма, которую вернула Робокасса в Result (для проверки подписи)';

alter table public.orders enable row level security;

-- Пользователь видит только свои заказы (user_id = текущий пользователь)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

-- Вставка и обновление — только через backend (service role) или разрешаем anon для создания заказа
-- Бэкенд при создании платежа вставит запись; при Result — обновит status.
-- Для упрощения: insert/update не даём через anon/authenticated из браузера, только service role.
-- Либо даём insert для authenticated (создание заказа при нажатии «Оплатить» с фронта через Supabase).
-- Рекомендация: создание заказа в бэкенде → только service role. Тогда политик insert/update для orders не создаём.

-- Триггер: при переходе заказа в completed увеличить used_count у промокода
create or replace function public.orders_after_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') and new.promo_code_id is not null then
    update public.promo_codes
    set used_count = used_count + 1, updated_at = now()
    where id = new.promo_code_id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_promo_used on public.orders;
create trigger orders_promo_used
  after update on public.orders
  for each row execute procedure public.orders_after_completed();

-- Обновление updated_at
create or replace function public.orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.orders_updated_at();


-- -----------------------------------------------------------------------------
-- 4. ПОКУПКИ / ДОСТУП К ТЕСТАМ (purchases)
-- Связь «пользователь купил тариф» — для проверки доступа к платному тесту
-- -----------------------------------------------------------------------------

create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  tariff text not null check (tariff in ('EXTENDED', 'PREMIUM')),
  test_id text,
  email text,
  created_at timestamptz default now(),
  unique (order_id)
);

comment on table public.purchases is 'Доступ к платным тестам после успешной оплаты (можно заполнять из orders при status=completed).';

alter table public.purchases enable row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);

-- Вставка только с бэкенда (service role) при успешной оплате
-- Политику insert не даём для anon/authenticated, только service role


-- -----------------------------------------------------------------------------
-- 5. ИНДЕКСЫ
-- -----------------------------------------------------------------------------

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_inv_id on public.orders(inv_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

create index if not exists idx_promo_codes_code_lower on public.promo_codes(lower(code));
create index if not exists idx_purchases_user_id on public.purchases(user_id);


-- -----------------------------------------------------------------------------
-- 6. GRANT (права для anon и authenticated)
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
-- insert в profiles только через триггер (definer), не выдаём клиенту

grant select, insert, update, delete on public.promo_codes to authenticated;
grant execute on function public.check_promo_code(text) to anon, authenticated;

grant select on public.orders to authenticated;
grant select on public.purchases to authenticated;

-- Последовательность для inv_id — только для service role (бэкенд создаёт заказы)
grant usage, select on sequence public.orders_inv_id_seq to service_role;
grant insert, update, select on public.orders to service_role;
grant insert, select on public.purchases to service_role;
