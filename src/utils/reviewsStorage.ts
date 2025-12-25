export interface Review {
  id: string;
  name: string;
  date: string;
  text: string;
  result?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STORAGE_KEY = 'reviews';
const STORAGE_KEY_PENDING = 'reviews_pending';

export function getReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const reviews = JSON.parse(stored);
    return reviews.filter((r: Review) => r.status === 'approved');
  } catch {
    return [];
  }
}

export function getPendingReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_PENDING);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getAllReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addReview(review: Omit<Review, 'id' | 'status' | 'createdAt'>): Review {
  const newReview: Review = {
    ...review,
    id: Date.now().toString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Сохраняем в pending
  const pending = getPendingReviews();
  pending.push(newReview);
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pending));

  // Также добавляем в общий список
  const all = getAllReviews();
  all.push(newReview);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  return newReview;
}

export function approveReview(id: string): void {
  const all = getAllReviews();
  const review = all.find((r) => r.id === id);
  if (review) {
    review.status = 'approved';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  // Удаляем из pending
  const pending = getPendingReviews();
  const filtered = pending.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(filtered));
}

export function rejectReview(id: string): void {
  const all = getAllReviews();
  const review = all.find((r) => r.id === id);
  if (review) {
    review.status = 'rejected';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  // Удаляем из pending
  const pending = getPendingReviews();
  const filtered = pending.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(filtered));
}

export function deleteReview(id: string): void {
  const all = getAllReviews();
  const filtered = all.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // Удаляем из pending если есть
  const pending = getPendingReviews();
  const filteredPending = pending.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(filteredPending));
}

// Инициализация с дефолтными отзывами
export function initializeDefaultReviews(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEY)) return; // Уже инициализировано

  const defaultReviews: Review[] = [
    { id: '1', name: 'Айгерим Садыкова', date: '12.02.2025', result: 'Креативные индустрии', text: 'Тест помог понять, что мне ближе дизайн и визуальные коммуникации. Понравились вопросы и формат.', status: 'approved', createdAt: new Date('2025-02-12').toISOString() },
    { id: '2', name: 'Нурболат Тлеуханов', date: '18.02.2025', result: 'Технологии и аналитика', text: 'Получил понятные рекомендации и список направлений. Уже смотрю курсы по аналитике данных.', status: 'approved', createdAt: new Date('2025-02-18').toISOString() },
    { id: '3', name: 'Алтынай Жумабек', date: '21.02.2025', result: 'Коммуникации и сервис', text: 'Опрос структурировал мысли. Я лучше понимаю, где мои сильные стороны в работе с людьми.', status: 'approved', createdAt: new Date('2025-02-21').toISOString() },
    { id: '4', name: 'Ерлан Каскенов', date: '25.02.2025', result: 'Технологии и аналитика', text: 'Хороший баланс вопросов. Итог совпал с моими ощущениями. Рекомендации по профессиям — в тему.', status: 'approved', createdAt: new Date('2025-02-25').toISOString() },
    { id: '5', name: 'Дана Абишева', date: '28.02.2025', result: 'Креативные индустрии', text: 'Понравились примеры и понятная подача. Стало ясно, куда двигаться дальше.', status: 'approved', createdAt: new Date('2025-02-28').toISOString() },
    { id: '6', name: 'Сергей Фадеев', date: '03.03.2025', result: 'Коммуникации и сервис', text: 'Простой и аккуратный интерфейс. Результат помог выбрать профиль для поступления.', status: 'approved', createdAt: new Date('2025-03-03').toISOString() },
    { id: '7', name: 'Екатерина Лебедева', date: '07.03.2025', result: 'Креативные индустрии', text: 'Краткий отчёт дал направление, а расширенная версия — подробный план развития.', status: 'approved', createdAt: new Date('2025-03-07').toISOString() },
    { id: '8', name: 'Владислав Соколов', date: '10.03.2025', result: 'Технологии и аналитика', text: 'Раньше сомневался между ИТ и экономикой. Тест склоняет к данным — логично по моим ответам.', status: 'approved', createdAt: new Date('2025-03-10').toISOString() },
    { id: '9', name: 'Полина Зайцева', date: '12.03.2025', result: 'Коммуникации и сервис', text: 'Теперь понимаю, что мне ближе работа с людьми и проекты в сфере образования.', status: 'approved', createdAt: new Date('2025-03-12').toISOString() },
    { id: '10', name: 'Никита Морозов', date: '15.03.2025', result: 'Технологии и аналитика', text: 'Отличная точка старта. Планирую пройти платный тест и получить полный отчёт.', status: 'approved', createdAt: new Date('2025-03-15').toISOString() },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReviews));
}

