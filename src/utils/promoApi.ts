/**
 * API промокодов (Supabase promo_codes)
 * Используется в админ-панели при залогиненном пользователе (RLS: authenticated)
 */

import { supabase } from '../lib/supabase';

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_fixed: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type PromoCodeInsert = {
  code: string;
  discount_percent?: number | null;
  discount_fixed?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  max_uses?: number | null;
  description?: string | null;
};

/** Превращает ответ Supabase в сообщение для пользователя */
function supabaseErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return 'Ошибка загрузки промокодов';
}

/**
 * Список всех промокодов (требуется сессия Supabase — войдите в аккаунт)
 */
export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(supabaseErrorMessage(error));
  }
  return (data ?? []) as PromoCode[];
}

/**
 * Создать промокод (либо discount_percent 0–100, либо discount_fixed ≥ 0)
 */
export async function createPromoCode(row: PromoCodeInsert): Promise<PromoCode> {
  const { data, error } = await supabase
    .from('promo_codes')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(supabaseErrorMessage(error));
  return data as PromoCode;
}

/**
 * Удалить промокод по id
 */
export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  if (error) throw new Error(supabaseErrorMessage(error));
}

/**
 * Проверить, есть ли активная сессия Supabase
 */
export async function hasSupabaseSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/** Результат проверки промокода (RPC check_promo_code) */
export interface PromoCheckResult {
  valid: boolean;
  discount_percent?: number | null;
  discount_fixed?: number | null;
}

/**
 * Проверить промокод через Supabase RPC (доступно без авторизации)
 */
export async function validatePromoCode(code: string): Promise<PromoCheckResult> {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    return { valid: false };
  }
  const { data, error } = await supabase.rpc('check_promo_code', { p_code: trimmed });
  if (error) throw new Error(supabaseErrorMessage(error));
  const result = data as { valid: boolean; discount_percent?: number | null; discount_fixed?: number | null };
  return {
    valid: result?.valid === true,
    discount_percent: result?.discount_percent ?? null,
    discount_fixed: result?.discount_fixed ?? null,
  };
}

/** Базовые цены по тарифам (₸) */
export const TARIFF_BASE_PRICES: Record<string, number> = {
  EXTENDED: 14_990,
  PREMIUM: 34_990,
};

/**
 * Рассчитать итоговую цену с учётом промокода из sessionStorage
 */
export function getPriceWithPromo(
  tariff: string,
  promo: { discount_percent?: number | null; discount_fixed?: number | null } | null
): { basePrice: number; finalPrice: number; hasDiscount: boolean } {
  const basePrice = TARIFF_BASE_PRICES[tariff] ?? TARIFF_BASE_PRICES.EXTENDED;
  if (!promo) {
    return { basePrice, finalPrice: basePrice, hasDiscount: false };
  }
  if (promo.discount_percent != null && promo.discount_percent > 0) {
    const finalPrice = Math.round(basePrice * (1 - promo.discount_percent / 100));
    return { basePrice, finalPrice, hasDiscount: true };
  }
  if (promo.discount_fixed != null && promo.discount_fixed > 0) {
    const finalPrice = Math.max(0, basePrice - promo.discount_fixed);
    return { basePrice, finalPrice, hasDiscount: true };
  }
  return { basePrice, finalPrice: basePrice, hasDiscount: false };
}

const PROMO_STORAGE_KEY = 'profi.promo';

/** Сохранённый применённый промокод (из формы перед тестом) */
export interface StoredPromo {
  code: string;
  discount_percent: number | null;
  discount_fixed: number | null;
}

export function getStoredPromo(): StoredPromo | null {
  try {
    const raw = sessionStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredPromo;
    return data;
  } catch {
    return null;
  }
}

export function setStoredPromo(promo: StoredPromo | null): void {
  if (promo) {
    sessionStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promo));
  } else {
    sessionStorage.removeItem(PROMO_STORAGE_KEY);
  }
}
