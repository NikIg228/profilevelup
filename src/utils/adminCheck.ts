import { supabase } from '../lib/supabase';

/**
 * Проверяет, является ли текущий пользователь администратором
 * Использует RPC функцию is_admin(), которая проверяет таблицу admin_users
 * @returns true, если пользователь есть в таблице admin_users, иначе false
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_admin");
    
    if (error) {
      console.error('Ошибка проверки прав администратора:', error);
      return false;
    }

    const isAdmin = data === true;
    return isAdmin;
  } catch (error) {
    console.error('Ошибка проверки прав администратора:', error);
    return false;
  }
}
