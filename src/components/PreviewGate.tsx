import { PropsWithChildren, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
const STORAGE_KEY = 'preview_authed_v2';

export default function PreviewGate({ children }: PropsWithChildren) {
  // В продакшене пароль не показываем — сразу отдаём контент
  if (import.meta.env.PROD) return <>{children}</>;

  // Экран включается если явно VITE_PREVIEW_ENABLED === 'true'
  // либо если передан VITE_PREVIEW_PASSWORD (защита включена по факту наличия пароля)
  const enabled = (import.meta.env.VITE_PREVIEW_ENABLED ?? 'true') === 'true'
    || Boolean(import.meta.env.VITE_PREVIEW_PASSWORD);
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'yes'; } catch { return false; }
  });
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  if (!enabled) return <>{children}</>;
  if (authed) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_PREVIEW_PASSWORD;
    if (!expected) {
      setError('Пароль не настроен. Установите VITE_PREVIEW_PASSWORD в переменных окружения.');
      return;
    }
    if (value === expected) {
      try { localStorage.setItem(STORAGE_KEY, 'yes'); } catch {}
      setAuthed(true);
    } else {
      setError('Неверный пароль');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-base">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold">Временный доступ</h1>
        <p className="mt-2 text-sm text-muted">Сайт на стадии разработки. Введите пароль, чтобы продолжить.</p>
        <div className="mt-4 relative">
          <input
            type={show ? 'text' : 'password'}
            id="preview-password"
            name="password"
            className="px-4 py-3 pr-12 rounded-xl border border-black/10 w-full"
            placeholder="Пароль"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
          />
          <button
            type="button"
            aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
            className="absolute inset-y-0 right-2 my-auto h-9 w-9 rounded-lg hover:bg-black/5 grid place-items-center text-muted"
            onClick={() => setShow((s) => !s)}
          >
            {show ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        <button className="btn btn-primary mt-4 w-full py-3" type="submit">Войти</button>
      </form>
    </div>
  );
}


