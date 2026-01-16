/**
 * Утилита для санитизации пользовательского ввода
 * Удаляет потенциально опасные HTML теги и атрибуты
 */

/**
 * Простая санитизация текста - удаляет HTML теги
 * React автоматически экранирует HTML, но эта функция добавляет дополнительный слой защиты
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Удаляем все HTML теги
  return text
    .replace(/<[^>]*>/g, '') // Удаляем HTML теги
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Валидация и санитизация имени пользователя
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  
  // Удаляем HTML, оставляем только буквы, пробелы, дефисы и апострофы
  return sanitizeText(name)
    .replace(/[^а-яА-ЯёЁa-zA-Z\s\-']/g, '')
    .substring(0, 100) // Ограничиваем длину
    .trim();
}

/**
 * Валидация и санитизация текста отзыва
 */
export function sanitizeReviewText(text: string): string {
  if (!text) return '';
  
  // Удаляем HTML, оставляем текст с базовой пунктуацией
  return sanitizeText(text)
    .substring(0, 2000) // Ограничиваем длину
    .trim();
}

