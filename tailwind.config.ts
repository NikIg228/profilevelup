import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#F0FDF4', // Светло-зеленый фон (было #F8F6F0)
        card: '#FFFFFF',
        ink: '#1F2937', // Более контрастный текст (было #3A3A3A)
        muted: '#6B7280', // Более читаемый серый (было #4A4A4A)
        heading: '#065F46', // Яркий темно-зеленый (было #3A5A40)
        secondary: '#D1FAE5', // Светло-зеленый для фонов (было #DAD7CD)
        primary: {
          DEFAULT: '#10B981', // Яркий зеленый (было #6B9080)
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Основной
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        accent: '#F59E0B', // Яркий янтарный для акцентов (было #C67C48)
        success: '#10B981',
        info: '#3B82F6',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      borderRadius: {
        xl: '16px',
        lg: '12px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(16, 185, 129, 0.08)',
        hover: '0 12px 28px rgba(16, 185, 129, 0.15)'
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


