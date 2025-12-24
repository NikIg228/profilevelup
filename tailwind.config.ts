import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#F7F7F5', // Основной фон (Main Background)
        card: '#FFFFFF', // Фон карточек
        'section-bg': '#EFEDEA', // Альтернативный фон блоков (Section Background)
        ink: '#4A4A4A', // Основной текст (Body text)
        muted: '#7A7A7A', // Вторичный текст / подсказки
        heading: '#2B2B2B', // Заголовки (H1–H3)
        secondary: '#E3E3E1', // Разделители, рамки
        primary: {
          DEFAULT: '#C9A24D', // Primary Accent — «Золото роста»
          hover: '#9E7F3A', // Secondary Accent — «Теплый тёмный» для hover
        },
        accent: '#C9A24D', // Primary Accent — «Золото роста»
        'accent-hover': '#9E7F3A', // Secondary Accent для hover
        'card-recommend': '#F3EEE2', // Лёгкая подложка для карточки «Рекомендуем»
        success: '#4FA37A', // Успех / подтверждение
        info: '#4A6FA5', // Информационные блоки
        error: '#C94A4A', // Ошибки
        warning: '#C9A24D', // Предупреждения (используем золото)
      },
      borderRadius: {
        xl: '16px',
        lg: '12px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(201, 162, 77, 0.08)',
        hover: '0 12px 28px rgba(201, 162, 77, 0.15)'
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


