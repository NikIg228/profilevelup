/**
 * Skip Link компонент для улучшения доступности
 * Позволяет пользователям клавиатуры пропустить навигацию и перейти к основному контенту
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      Перейти к основному содержимому
    </a>
  );
}

