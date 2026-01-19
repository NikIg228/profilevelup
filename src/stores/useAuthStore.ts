import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Действия
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkSession: () => Promise<void>;
  updateProfile: (fullName?: string) => Promise<{ success: boolean; error?: string }>;
  changeEmail: (newEmail: string, password: string) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            // Обработка ошибок
            let errorMessage = 'Ошибка входа';
            
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = 'Неверный email или пароль';
            } else if (error.message.includes('Email not confirmed')) {
              errorMessage = 'Подтвердите регистрацию, перейдя по ссылке в письме';
            } else {
              errorMessage = error.message;
            }
            
            set({ isLoading: false });
            return { success: false, error: errorMessage };
          }

          if (data.user && data.session) {
            // Загружаем профиль
            let profile = null;
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', data.user.id)
                .maybeSingle();
              
              profile = profileData;
            } catch (profileError) {
              logger.error('Ошибка загрузки профиля:', profileError);
            }

            const user: User = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: profile?.full_name || undefined,
              createdAt: data.user.created_at || new Date().toISOString(),
            };

            set({
              user,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Ошибка входа' };
        } catch (error: unknown) {
          set({ isLoading: false });
          const errorMessage = error instanceof Error ? error.message : 'Ошибка входа';
          return { success: false, error: errorMessage };
        }
      },

      register: async (email, password, fullName) => {
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName || '',
              },
            },
          });

          if (error) {
            let errorMessage = 'Ошибка регистрации';
            
            if (error.message.includes('User already registered')) {
              errorMessage = 'Пользователь с таким email уже зарегистрирован';
            } else if (error.message.includes('Password')) {
              errorMessage = 'Пароль должен содержать минимум 6 символов';
            } else {
              errorMessage = error.message;
            }
            
            set({ isLoading: false });
            return { success: false, error: errorMessage };
          }

          // Если email не требует подтверждения, сразу входим
          if (data.user && data.session) {
            const user: User = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: fullName || undefined,
              createdAt: data.user.created_at || new Date().toISOString(),
            };

            set({
              user,
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });

            return { success: true };
          }

          // Если требуется подтверждение email
          set({ isLoading: false });
          return { 
            success: true, 
            error: 'Проверьте почту и подтвердите регистрацию' 
          };
        } catch (error: unknown) {
          set({ isLoading: false });
          const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации';
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        } catch (error) {
          logger.error('Ошибка выхода:', error);
          // Все равно очищаем состояние
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/account?mode=reset-password`,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка сброса пароля';
          return { success: false, error: errorMessage };
        }
      },

      checkSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            logger.error('Ошибка проверки сессии:', error);
            return;
          }

          if (session?.user) {
            // Загружаем профиль
            let profile = null;
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .maybeSingle();
              
              profile = profileData;
            } catch (profileError) {
              logger.error('Ошибка загрузки профиля:', profileError);
            }

            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: profile?.full_name || undefined,
              createdAt: session.user.created_at || new Date().toISOString(),
            };

            set({
              user,
              token: session.access_token,
              isAuthenticated: true,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('Ошибка проверки сессии:', error);
        }
      },

      updateProfile: async (fullName) => {
        try {
          const state = get();
          if (!state.user) {
            return { success: false, error: 'Пользователь не авторизован' };
          }

          const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName || null })
            .eq('id', state.user.id);

          if (error) {
            return { success: false, error: error.message };
          }

          // Обновляем состояние
          set({
            user: {
              ...state.user,
              fullName: fullName || undefined,
            },
          });

          return { success: true };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления профиля';
          return { success: false, error: errorMessage };
        }
      },

      changeEmail: async (newEmail, password) => {
        try {
          const state = get();
          if (!state.user) {
            return { success: false, error: 'Пользователь не авторизован' };
          }

          // Проверяем текущий пароль
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: state.user.email,
            password,
          });

          if (signInError) {
            return { success: false, error: 'Неверный пароль' };
          }

          // Проверяем, что новый email отличается от текущего
          if (newEmail === state.user.email) {
            return { success: false, error: 'Новый email совпадает с текущим' };
          }

          // Обновляем email
          const { data, error } = await supabase.auth.updateUser({
            email: newEmail,
          });

          if (error) {
            let errorMessage = 'Ошибка изменения email';
            if (error.message.includes('already registered')) {
              errorMessage = 'Email уже используется другим пользователем';
            } else if (error.message.includes('rate limit')) {
              errorMessage = 'Слишком много запросов. Попробуйте позже';
            } else {
              errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
          }

          // Если email не требует подтверждения, обновляем состояние сразу
          if (data.user && data.user.email === newEmail) {
            set({
              user: {
                ...state.user,
                email: newEmail,
              },
            });
            return { success: true };
          }

          // Если требуется подтверждение
          return { 
            success: true, 
            requiresConfirmation: true,
            error: 'Проверьте новую почту и подтвердите изменение email'
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка изменения email';
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (oldPassword, newPassword) => {
        try {
          const state = get();
          if (!state.user) {
            return { success: false, error: 'Пользователь не авторизован' };
          }

          // Проверяем текущий пароль
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: state.user.email,
            password: oldPassword,
          });

          if (signInError) {
            return { success: false, error: 'Неверный текущий пароль' };
          }

          // Проверяем, что новый пароль отличается от старого
          if (oldPassword === newPassword) {
            return { success: false, error: 'Новый пароль должен отличаться от текущего' };
          }

          // Проверяем длину нового пароля
          if (newPassword.length < 6) {
            return { success: false, error: 'Пароль должен содержать минимум 6 символов' };
          }

          // Вместо немедленного изменения пароля, отправляем письмо с подтверждением
          // Сохраняем новый пароль в sessionStorage для последующего использования
          sessionStorage.setItem('pending_password_change', newPassword);
          
          const { error } = await supabase.auth.resetPasswordForEmail(state.user.email, {
            redirectTo: `${window.location.origin}/account?mode=change-password`,
          });

          if (error) {
            sessionStorage.removeItem('pending_password_change');
            return { success: false, error: error.message || 'Ошибка отправки письма' };
          }

          return { 
            success: true,
            requiresConfirmation: true,
            error: 'Проверьте почту и подтвердите изменение пароля по ссылке в письме'
          };
        } catch (error: unknown) {
          sessionStorage.removeItem('pending_password_change');
          const errorMessage = error instanceof Error ? error.message : 'Ошибка изменения пароля';
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Слушаем изменения аутентификации
supabase.auth.onAuthStateChange((event: string, session: { user: { id: string; email?: string | null; created_at?: string } | null; access_token?: string | null } | null) => {
  const state = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    // Загружаем профиль при входе
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data: profile }: { data: { full_name?: string } | null }) => {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: profile?.full_name || undefined,
          createdAt: session.user.created_at || new Date().toISOString(),
        };

        state.user = user;
        state.token = session.access_token || null;
        state.isAuthenticated = true;
      });
  } else if (event === 'SIGNED_OUT') {
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
  }
});

