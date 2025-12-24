import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#F6F6F4', // Основной фон сайта
        card: '#FFFFFF', // Фон карточек / блоков
        ink: '#1F1F1F', // Основной текст
        muted: '#4A4A4A', // Вторичный текст
        'muted-light': '#8A8A8A', // Вспомогательный / неактивный текст
        heading: '#1F1F1F', // Заголовки (тот же что и основной текст)
        secondary: '#E3E3E1', // Разделители, рамки, линии
        primary: {
          DEFAULT: '#2F5D50', // Основной акцент (кнопки, ссылки)
          hover: '#244A40', // Hover для кнопок
        },
        'badge-bg': '#EEF2F0', // Фон нейтральных бейджей
        'badge-text': '#2F5D50', // Текст бейджей
        error: '#C04A3A', // Ошибки / предупреждения
        success: '#2F5D50',
        info: '#3B82F6',
        warning: '#C04A3A',
      },
      borderRadius: {
        xl: '16px',
        lg: '12px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(47, 93, 80, 0.08)',
        hover: '0 12px 28px rgba(47, 93, 80, 0.15)'
      },
      fontFamily: {
        heading: ['Montserrat', 'Poppins', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Open Sans"', 'Roboto', 'Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 500ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;


