import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173
    },
    build: {
        // Увеличиваем лимит предупреждений для больших чанков
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // React vendor chunk
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
                        return 'react-vendor';
                    }
                    // Framer Motion
                    if (id.includes('node_modules/framer-motion')) {
                        return 'framer-motion';
                    }
                    // Swiper
                    if (id.includes('node_modules/swiper')) {
                        return 'swiper';
                    }
                    // Zustand
                    if (id.includes('node_modules/zustand')) {
                        return 'zustand';
                    }
                    // Lucide React (если используется много иконок)
                    if (id.includes('node_modules/lucide-react')) {
                        return 'lucide-icons';
                    }
                    // GSAP
                    if (id.includes('node_modules/gsap')) {
                        return 'gsap';
                    }
                    // Supabase
                    if (id.includes('node_modules/@supabase')) {
                        return 'supabase';
                    }
                    // Остальные node_modules
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
                // Оптимизация имен файлов
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },
        // Минификация
        minify: 'esbuild',
        // Source maps только для production (опционально)
        sourcemap: false,
        // Оптимизация для production
        target: 'esnext',
        cssCodeSplit: true,
    },
    // Оптимизация зависимостей
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            'zustand',
        ],
        exclude: ['@studio-freight/lenis'], // Исключаем если не используется сразу
    },
});
