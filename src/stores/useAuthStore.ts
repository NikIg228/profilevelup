import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Функция для перевода ошибок аутентификации на русский язык
function translateAuthError(errorMessage: string): string {
  const errorLower = errorMessage.toLowerCase();
  
  // Ошибки входа
  if (errorLower.includes('invalid login credentials') || 
      errorLower.includes('invalid credentials') ||
      errorLower.includes('email or password is incorrect')) {
    return 'Неверный email или пароль';
  }
  
  // Ошибки регистрации
  if (errorLower.includes('user already registered') ||
      errorLower.includes('email already exists') ||
      errorLower.includes('already registered')) {
    return 'Пользователь с таким email уже зарегистрирован';
  }
  
  // Ошибки подтверждения email
  if (errorLower.includes('email not confirmed') ||
      errorLower.includes('email_not_confirmed')) {
    return 'Email не подтвержден. Проверьте почту и подтвердите регистрацию';
  }
  
  // Ошибки пароля
  if (errorLower.includes('password should be at least') ||
      errorLower.includes('password is too short')) {
    return 'Пароль должен содержать минимум 6 символов';
  }
  
  if (errorLower.includes('password is too weak') ||
      errorLower.includes('weak password')) {
    return 'Пароль слишком слабый. Используйте более сложный пароль';
  }
  
  // Ошибки email
  if (errorLower.includes('invalid email') ||
      errorLower.includes('email format is invalid')) {
    return 'Неверный формат email';
  }
  
  if (errorLower.includes('email already exists') ||
      errorLower.includes('email is already taken')) {
    return 'Email уже используется';
  }
  
  // Ошибки токена
  if (errorLower.includes('token') && errorLower.includes('expired')) {
    return 'Срок действия токена истек. Пожалуйста, попробуйте снова';
  }
  
  if (errorLower.includes('invalid token') ||
      errorLower.includes('token is invalid')) {
    return 'Недействительный токен';
  }
  
  // Ошибки сети
  if (errorLower.includes('network') ||
      errorLower.includes('fetch failed') ||
      errorLower.includes('connection')) {
    return 'Ошибка подключения. Проверьте интернет-соединение';
  }
  
  // Ошибки сессии
  if (errorLower.includes('session') && errorLower.includes('expired')) {
    return 'Сессия истекла. Пожалуйста, войдите снова';
  }
  
  if (errorLower.includes('session not found') ||
      errorLower.includes('no session')) {
    return 'Сессия не найдена. Пожалуйста, войдите снова';
  }
  
  // Ошибки сброса пароля
  if (errorLower.includes('password reset') && errorLower.includes('failed')) {
    return 'Ошибка сброса пароля. Попробуйте позже';
  }
  
  // Ошибки изменения email
  if (errorLower.includes('email change') && errorLower.includes('failed')) {
    return 'Ошибка изменения email';
  }
  
  // Ошибки изменения пароля
  if (errorLower.includes('password change') && errorLower.includes('failed')) {
    return 'Ошибка изменения пароля';
  }
  
  // Общие ошибки
  if (errorLower.includes('too many requests') ||
      errorLower.includes('rate limit')) {
    return 'Слишком много запросов. Пожалуйста, подождите немного';
  }
  
  if (errorLower.includes('forbidden') ||
      errorLower.includes('access denied')) {
    return 'Доступ запрещен';
  }
  
  if (errorLower.includes('not found')) {
    return 'Не найдено';
  }
  
  if (errorLower.includes('unauthorized')) {
    return 'Не авторизован. Пожалуйста, войдите';
  }
  
  // Если ошибка не распознана, возвращаем оригинальное сообщение
  // но переводим некоторые общие фразы
  return errorMessage
    .replace(/Invalid login credentials/gi, 'Неверный email или пароль')
    .replace(/Invalid credentials/gi, 'Неверные учетные данные')
    .replace(/Email not confirmed/gi, 'Email не подтвержден')
    .replace(/User already registered/gi, 'Пользователь уже зарегистрирован')
    .replace(/Password should be at least/gi, 'Пароль должен содержать минимум')
    .replace(/Invalid email/gi, 'Неверный email');
}

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
  register: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
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
            return { success: false, error: translateAuthError(error.message) };
          }

          if (data.user) {
            // Проверяем, требуется ли подтверждение email
            const requiresEmailConfirmation = !data.session && !data.user.email_confirmed_at;
            
            // Если есть сессия (email подтвержден автоматически), загружаем профиль и авторизуем
            if (data.session) {
              // Обновляем профиль с именем, если оно указано (только если есть сессия)
              if (fullName) {
                try {
                  await supabase
                    .from('profiles')
                    .update({ full_name: fullName })
                    .eq('id', data.user.id);
                } catch (profileError) {
                  // Игнорируем ошибку обновления профиля, если профиль еще не создан
                  console.warn('Не удалось обновить профиль:', profileError);
                }
              }

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
                token: data.session.access_token,
                isAuthenticated: true,
              });

              return { success: true };
            }

            // Если сессии нет, значит требуется подтверждение email
            // Профиль будет создан триггером автоматически с именем из metadata
            return { 
              success: true, 
              requiresEmailConfirmation: true 
            };
          }

          return { success: false, error: 'Ошибка регистрации' };
        } catch (error: any) {
          return { success: false, error: translateAuthError(error.message || 'Ошибка регистрации') };
        }
      },

      login: async (email, password) => {
        try {
          // Пытаемся войти напрямую
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            const errorMessage = error.message.toLowerCase();
            const errorCode = error.status || error.code || '';
            const errorCodeStr = String(errorCode).toLowerCase();
            
            // Проверяем, связана ли ошибка с неподтвержденным email
            if (errorMessage.includes('email not confirmed') || 
                errorMessage.includes('email_not_confirmed') ||
                errorMessage.includes('email not verified') ||
                errorMessage.includes('email_not_verified') ||
                errorMessage.includes('confirmation') ||
                errorMessage.includes('verify') ||
                errorCodeStr.includes('email_not_confirmed') ||
                errorCodeStr.includes('email_not_verified')) {
              return { 
                success: false, 
                error: 'Подтвердите регистрацию перейдя по ссылке в нашем письме' 
              };
            }
            
            // Проверяем, является ли ошибка "Invalid login credentials"
            if (errorMessage.includes('invalid login credentials') || 
                errorMessage.includes('invalid credentials') ||
                errorMessage.includes('email or password is incorrect')) {
              
              // Показываем общее сообщение об ошибке
              // Не проверяем существование пользователя через signUp, чтобы не отправлять письма
              return { 
                success: false, 
                error: 'Неверный email или пароль' 
              };
            }
            
            // Для других ошибок используем перевод
            return { success: false, error: translateAuthError(error.message) || 'Ошибка входа' };
          }

          if (data.user && data.session) {
            // Загружаем профиль после входа
            let profile = null;
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', data.user.id)
                .maybeSingle();

              if (profileError) {
                // Если профиль не найден (код PGRST116), создаем его
                if (profileError.code === 'PGRST116') {
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: data.user.id,
                      email: data.user.email || email,
                      full_name: null,
                    });

                  if (insertError) {
                    console.error('Ошибка создания профиля:', insertError);
                  }
                } else {
                  console.error('Ошибка загрузки профиля:', profileError);
                }
              } else {
                profile = profileData;
              }
            } catch (profileErr) {
              console.error('Ошибка при загрузке профиля:', profileErr);
              // Продолжаем выполнение даже если профиль не загружен
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
            });

            return { success: true };
          }

          return { success: false, error: 'Ошибка входа' };
        } catch (error: any) {
          return { success: false, error: translateAuthError(error.message || 'Ошибка входа') };
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
            return { success: false, error: translateAuthError(signInError.message || 'Неверный пароль') };
          }

          // Обновляем email
          const { data, error } = await supabase.auth.updateUser({
            email: newEmail,
          });

          if (error) {
            return { success: false, error: translateAuthError(error.message) };
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
          return { success: false, error: translateAuthError(error.message || 'Ошибка изменения email') };
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
            return { success: false, error: translateAuthError(signInError.message || 'Неверный текущий пароль') };
          }

          // Обновляем пароль
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            return { success: false, error: translateAuthError(error.message) };
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: translateAuthError(error.message || 'Ошибка изменения пароля') };
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
            return { success: false, error: translateAuthError(error.message) };
          }

          set({
            user: { ...state.user, fullName },
          });

          return { success: true };
        } catch (error: any) {
          return { success: false, error: translateAuthError(error.message || 'Ошибка изменения имени') };
        }
      },

      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/account?reset=true`,
          });

          if (error) {
            return { success: false, error: translateAuthError(error.message) };
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: translateAuthError(error.message || 'Ошибка сброса пароля') };
        }
      },

      loadUserProfile: async () => {
        const state = get();
        if (!state.user) return;

        try {
          // Проверяем активную сессию
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Ошибка получения сессии:', sessionError);
            return;
          }

          if (!session) {
            console.warn('Нет активной сессии для загрузки профиля');
            // Сбрасываем состояние, если нет сессии
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
            return;
          }

          // Выполняем запрос к профилю с активной сессией
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', state.user.id)
            .single();

          if (error) {
            console.error('Ошибка загрузки профиля:', error);
            // Если ошибка 401 (Unauthorized), пытаемся обновить сессию
            if (
              error.code === 'PGRST301' ||
              error.message?.includes('401')
            ) {
              console.log('Сессия истекла, пытаемся обновить...');

              // Пытаемся обновить сессию
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError || !refreshedSession) {
                console.error('Не удалось обновить сессию:', refreshError);
                // Если не удалось обновить, сбрасываем состояние
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                });
                return;
              }

              // Повторяем запрос после обновления сессии
              const { data: retryData, error: retryError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', state.user.id)
                .single();
              
              if (retryError) {
                console.error('Ошибка при повторном запросе профиля:', retryError);
                return;
              }
              
              if (retryData) {
                set({
                  user: { ...state.user, fullName: retryData.full_name || undefined },
                  token: refreshedSession.access_token,
                });
              }
              return;
            }
            
            return;
          }

          if (data) {
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
supabase.auth.onAuthStateChange(async (event, session) => {
  const state = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      // Загружаем профиль при входе (включая подтверждение email)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      // Если профиль не найден, создаем его
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            full_name: null,
          });

        if (insertError) {
          console.error('Ошибка создания профиля:', insertError);
        }
      }

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
    } catch (error: any) {
      console.error('Ошибка при загрузке профиля в onAuthStateChange:', error);
      // Создаем пользователя даже если профиль не загружен
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        fullName: undefined,
        createdAt: session.user.created_at || new Date().toISOString(),
      };

      state.updateUser(user);
      useAuthStore.setState({
        user,
        token: session.access_token,
        isAuthenticated: true,
      });
    }
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
