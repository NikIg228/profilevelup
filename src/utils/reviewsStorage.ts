export interface Review {
  id: string;
  name: string;
  date?: string; // Опциональное поле, новые отзывы не будут иметь дату
  text: string;
  result?: string;
  age?: number;
  testType?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STORAGE_KEY = 'reviews';
const STORAGE_KEY_PENDING = 'reviews_pending';
const REVIEWS_VERSION_KEY = 'reviews_version';
const CURRENT_REVIEWS_VERSION = '2.0'; // Версия новых отзывов

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
  
  // Проверяем версию отзывов
  const currentVersion = localStorage.getItem(REVIEWS_VERSION_KEY);
  if (currentVersion === CURRENT_REVIEWS_VERSION) {
    // Версия совпадает - отзывы уже обновлены
    return;
  }
  
  // Версия не совпадает или отсутствует - перезаписываем отзывы

  const defaultReviews: Review[] = [
    { id: '1', name: 'Айгерим', age: 17, testType: 'Первичное понимание', text: 'Прошла опрос, всё зашло! Теперь понятно, куда двигаться. Рекомендую.', status: 'approved', createdAt: new Date('2025-01-15').toISOString() },
    { id: '2', name: 'Сергей', age: 19, testType: 'Персональный разбор', text: 'Купил расширенный опрос — не пожалел. Отчёт реально помог разобраться в себе. Стоит своих денег.', status: 'approved', createdAt: new Date('2025-01-18').toISOString() },
    { id: '3', name: 'Нурболат', age: 18, testType: 'Первичное понимание', text: 'Бесплатный опрос показал, что мне ближе аналитика, а не программирование. Уже записался на курсы!', status: 'approved', createdAt: new Date('2025-01-20').toISOString() },
    { id: '4', name: 'Екатерина', age: 16, testType: 'Семейная навигация', text: 'Проходили с мамой вместе — было прикольно! Теперь она понимает, почему я хочу в дизайн, а не в экономику.', status: 'approved', createdAt: new Date('2025-01-22').toISOString() },
    { id: '5', name: 'Алтынай', age: 17, testType: 'Персональный разбор', text: 'Платный опрос — огонь! Получила кучу полезных инсайтов про себя. Особенно про то, как общаться с разными людьми.', status: 'approved', createdAt: new Date('2025-01-25').toISOString() },
    { id: '6', name: 'Владислав', age: 20, testType: 'Первичное понимание', text: 'Студент первого курса, выбирал специализацию. Опрос помог определиться — иду в машинное обучение.', status: 'approved', createdAt: new Date('2025-01-28').toISOString() },
    { id: '7', name: 'Дана', age: 15, testType: 'Семейная навигация', text: 'Мама настояла пройти вместе. Сначала не хотела, но потом зашло. Теперь она поддерживает мой выбор!', status: 'approved', createdAt: new Date('2025-02-01').toISOString() },
    { id: '8', name: 'Полина', age: 18, testType: 'Персональный разбор', text: 'Перед поступлением в пед решила пройти расширенный опрос. Подтвердил, что работа с людьми — это моё.', status: 'approved', createdAt: new Date('2025-02-05').toISOString() },
    { id: '9', name: 'Ерлан', age: 19, testType: 'Первичное понимание', text: 'Бесплатный опрос помог понять, что мне ближе backend, а не фронтенд. Теперь знаю, какие курсы искать.', status: 'approved', createdAt: new Date('2025-02-08').toISOString() },
    { id: '10', name: 'Анна', age: 17, testType: 'Персональный разбор', text: 'Купила расширенный опрос — отчёт на 5 страниц! Теперь точно знаю, что хочу в графический дизайн.', status: 'approved', createdAt: new Date('2025-02-12').toISOString() },
    { id: '11', name: 'Асылбек', age: 16, testType: 'Семейная навигация', text: 'Проходил с отцом. Он хотел, чтобы я шёл в бизнес, но опрос показал IT. Теперь он поддерживает мой выбор!', status: 'approved', createdAt: new Date('2025-02-15').toISOString() },
    { id: '12', name: 'Дмитрий', age: 18, testType: 'Первичное понимание', text: 'Выбирал между менеджментом и психологией. Опрос склонил к психологии — оказалось, это моё.', status: 'approved', createdAt: new Date('2025-02-18').toISOString() },
    { id: '13', name: 'Амина', age: 17, testType: 'Персональный разбор', text: 'Расширенный опрос помог понять, почему мне так нравится фотография. Теперь увереннее в своём выборе.', status: 'approved', createdAt: new Date('2025-02-22').toISOString() },
    { id: '14', name: 'Никита', age: 19, testType: 'Первичное понимание', text: 'Бесплатный опрос дал хорошее направление. Понял, что мне интереснее аналитика, чем разработка. Планирую пройти платный.', status: 'approved', createdAt: new Date('2025-02-25').toISOString() },
    { id: '15', name: 'Аружан', age: 16, testType: 'Семейная навигация', text: 'Мама купила опрос для нас обеих. Было интересно увидеть, как мы по-разному мыслим. Теперь лучше понимаем друг друга.', status: 'approved', createdAt: new Date('2025-02-28').toISOString() },
    { id: '16', name: 'Максим', age: 18, testType: 'Персональный разбор', text: 'Платный опрос — топ! Получил детальный анализ и рекомендации. Отчёт распечатал, использую как план развития.', status: 'approved', createdAt: new Date('2025-03-03').toISOString() },
    { id: '17', name: 'Жанна', age: 17, testType: 'Первичное понимание', text: 'Бесплатный опрос помог понять, что мне интересен дизайн интерьеров. Вопросы заставили задуматься о том, как я вижу пространство.', status: 'approved', createdAt: new Date('2025-03-07').toISOString() },
    { id: '18', name: 'Артём', age: 19, testType: 'Персональный разбор', text: 'Купил расширенный опрос перед выбором магистратуры. Помог понять, что мне ближе HR, чем чистое управление.', status: 'approved', createdAt: new Date('2025-03-10').toISOString() },
    { id: '19', name: 'Айжан', age: 16, testType: 'Семейная навигация', text: 'Проходила с мамой. Она хотела, чтобы я стала врачом, но опрос показал дизайн. Теперь она поддерживает мой выбор!', status: 'approved', createdAt: new Date('2025-03-14').toISOString() },
    { id: '20', name: 'Игорь', age: 18, testType: 'Первичное понимание', text: 'Бесплатный опрос дал хорошее направление. Понял, что мне интереснее AI и машинное обучение. Теперь знаю, на что обращать внимание в универе.', status: 'approved', createdAt: new Date('2025-03-18').toISOString() },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReviews));
  localStorage.setItem(REVIEWS_VERSION_KEY, CURRENT_REVIEWS_VERSION);
}

