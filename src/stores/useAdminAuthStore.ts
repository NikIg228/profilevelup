import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminAuthState {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      login: (password: string) => {
        if (!ADMIN_PASSWORD) {
          alert('Пароль не настроен. Установите VITE_ADMIN_PASSWORD в переменных окружения.');
          return false;
        }
        if (password === ADMIN_PASSWORD) {
          set({ isAuthenticated: true });
          return true;
        } else {
          alert('Неверный пароль');
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false });
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => sessionStorage), // Используем sessionStorage для безопасности
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
