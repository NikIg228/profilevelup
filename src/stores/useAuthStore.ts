import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  register: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changeEmail: (newEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeFullName: (fullName: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => void;
  checkSession: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      register: async (email, password, fullName) => {
        try {
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
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Обновляем профиль с именем, если оно указано
            if (fullName) {
              await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', data.user.id);
            }

            // Загружаем профиль после регистрации
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', data.user.id)
              .single();

            const user: User = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: profile?.full_name || fullName || undefined,
              createdAt: data.user.created_at || new Date().toISOString(),
            };

            set({
              user,
              token: data.session?.access_token || null,
              isAuthenticated: !!data.session,
            });

            return { success: true };
          }

          return { success: false, error: 'Ошибка регистрации' };
        } catch (error: any) {
          return { success: false, error: error.message || 'Ошибка регистрации' };
        }
      },

      login: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.user && data.session) {
            // Загружаем профиль после входа
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', data.user.id)
              .single();

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
            });

            return { success: true };
          }

          return { success: false, error: 'Ошибка входа' };
        } catch (error: any) {
          return { success: false, error: error.message || 'Ошибка входа' };
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Ошибка выхода:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      changeEmail: async (newEmail, password) => {
        const state = get();
        if (!state.user) {
          return { success: false, error: 'Пользователь не авторизован' };
        }

        try {
          // Проверяем пароль, выполняя вход
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: state.user.email,
            password,
          });

          if (signInError) {
            return { success: false, error: 'Неверный пароль' };
          }

          // Обновляем email
          const { data, error } = await supabase.auth.updateUser({
            email: newEmail,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.user) {
            const updatedUser: User = {
              id: data.user.id,
              email: data.user.email || newEmail,
              createdAt: data.user.created_at || state.user.createdAt,
            };

            set({
              user: updatedUser,
            });

            return { success: true };
          }

          return { success: false, error: 'Ошибка изменения email' };
        } catch (error: any) {
          return { success: false, error: error.message || 'Ошибка изменения email' };
        }
      },

      changePassword: async (oldPassword, newPassword) => {
        const state = get();
        if (!state.user) {
          return { success: false, error: 'Пользователь не авторизован' };
        }

        try {
          // Проверяем старый пароль, выполняя вход
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: state.user.email,
            password: oldPassword,
          });

          if (signInError) {
            return { success: false, error: 'Неверный текущий пароль' };
          }

          // Обновляем пароль
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message || 'Ошибка изменения пароля' };
        }
      },

      updateUser: (user) => {
        set({ user });
      },

      changeFullName: async (fullName) => {
        const state = get();
        if (!state.user) {
          return { success: false, error: 'Пользователь не авторизован' };
        }

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', state.user.id);

          if (error) {
            return { success: false, error: error.message };
          }

          set({
            user: { ...state.user, fullName },
          });

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message || 'Ошибка изменения имени' };
        }
      },

      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/account?reset=true`,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message || 'Ошибка сброса пароля' };
        }
      },

      loadUserProfile: async () => {
        const state = get();
        if (!state.user) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', state.user.id)
            .single();

          if (!error && data) {
            set({
              user: { ...state.user, fullName: data.full_name || undefined },
            });
          }
        } catch (error) {
          console.error('Ошибка загрузки профиля:', error);
        }
      },

      checkSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Ошибка проверки сессии:', error);
            return;
          }

          if (session?.user) {
            // Загружаем профиль из таблицы profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();

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
    }),
    {
      name: 'profi-auth-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Проверяем сессию при восстановлении состояния
        if (state) {
          state.checkSession();
        }
      },
    }
  )
);

// Слушаем изменения аутентификации в Supabase
supabase.auth.onAuthStateChange((event, session) => {
  const state = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    // Загружаем профиль при входе
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data: profile }) => {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: profile?.full_name || undefined,
          createdAt: session.user.created_at || new Date().toISOString(),
        };

        state.updateUser(user);
        useAuthStore.setState({
          user,
          token: session.access_token,
          isAuthenticated: true,
        });
      });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  } else if (event === 'TOKEN_REFRESHED' && session) {
    useAuthStore.setState({
      token: session.access_token,
    });
  }
});
