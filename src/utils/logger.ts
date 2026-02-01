/**
 * Утилита для логирования с поддержкой dev/prod режимов
 * В продакшене логи отключены для безопасности и производительности
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  /** Для отладочных сообщений (ожидаемый поток инициализации и т.п.), в dev — console.debug */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Ошибки логируем всегда, но в продакшене можно отправить в сервис мониторинга
    console.error(...args);
    // if (import.meta.env.PROD) {
    //   errorReportingService.logError(...args);
    // }
  },
};

