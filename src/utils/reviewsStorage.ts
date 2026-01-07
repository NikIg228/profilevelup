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
  
  // Проверяем, нужно ли обновить отзывы
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const reviews = JSON.parse(existing);
      // Если отзывы есть, но их меньше 30 или у них нет полей age/testType - обновляем
      const hasNewFields = reviews.length > 0 && reviews[0].age !== undefined && reviews[0].testType !== undefined;
      if (reviews.length >= 30 && hasNewFields) {
        return; // Уже инициализировано с новыми полями
      }
    } catch {
      // Если ошибка парсинга - перезаписываем
    }
  }

  const defaultReviews: Review[] = [
    // Смешанные имена, более человечные отзывы с возрастом и тестом
    { id: '1', name: 'Айгерим Садыкова', age: 17, testType: 'Первичное понимание', date: '12.02.2025', result: 'Креативные индустрии', text: 'Прошла тест перед поступлением в университет. Очень помогло понять, что мне действительно интересен дизайн, а не просто "модная" профессия. Вопросы заставили задуматься о том, как я на самом деле принимаю решения.', status: 'approved', createdAt: new Date('2025-02-12').toISOString() },
    { id: '2', name: 'Сергей Фадеев', age: 19, testType: 'Личный разбор', date: '15.02.2025', result: 'Коммуникации и сервис', text: 'Купил расширенный тест, потому что бесплатный показал интересные результаты. Не пожалел! Отчёт получился на 6 страниц, там много конкретных рекомендаций. Особенно понравился раздел про среды, где мне будет комфортнее работать.', status: 'approved', createdAt: new Date('2025-02-15').toISOString() },
    { id: '3', name: 'Нурболат Тлеуханов', age: 18, testType: 'Первичное понимание', date: '18.02.2025', result: 'Технологии и аналитика', text: 'Долго выбирал между программированием и аналитикой. Тест показал, что мне ближе работа с данными и их анализ, а не написание кода. Уже записался на курсы по аналитике — чувствую, что это моё.', status: 'approved', createdAt: new Date('2025-02-18').toISOString() },
    { id: '4', name: 'Екатерина Лебедева', age: 16, testType: 'Подросток и родитель', date: '20.02.2025', result: 'Креативные индустрии', text: 'Проходила тест вместе с мамой. Было интересно сравнить наши результаты! Оказалось, что мы по-разному думаем, но это нормально. Мама теперь лучше понимает, почему я хочу в творческую сферу, а не в экономику, как она хотела.', status: 'approved', createdAt: new Date('2025-02-20').toISOString() },
    { id: '5', name: 'Алтынай Жумабек', age: 17, testType: 'Личный разбор', date: '21.02.2025', result: 'Коммуникации и сервис', text: 'Платный тест стоит своих денег. Получила детальный разбор своих сильных сторон и зон роста. Особенно ценно было про то, как взаимодействовать с разными типами людей — это помогло в отношениях с одноклассниками.', status: 'approved', createdAt: new Date('2025-02-21').toISOString() },
    { id: '6', name: 'Владислав Соколов', age: 20, testType: 'Первичное понимание', date: '23.02.2025', result: 'Технологии и аналитика', text: 'Студент первого курса, выбирал специализацию. Бесплатный тест дал хорошее направление. Понял, что мне интереснее работать с большими данными и машинным обучением, чем просто писать сайты.', status: 'approved', createdAt: new Date('2025-02-23').toISOString() },
    { id: '7', name: 'Дана Абишева', age: 15, testType: 'Подросток и родитель', date: '25.02.2025', result: 'Креативные индустрии', text: 'Мама настояла, чтобы мы прошли тест вместе. Сначала не хотела, но потом заинтересовалась. Результаты помогли нам лучше понять друг друга. Теперь мама поддерживает мой выбор профессии в дизайне.', status: 'approved', createdAt: new Date('2025-02-25').toISOString() },
    { id: '8', name: 'Полина Зайцева', age: 18, testType: 'Личный разбор', date: '27.02.2025', result: 'Коммуникации и сервис', text: 'Перед поступлением в педагогический решила пройти расширенный тест. Отчёт подтвердил, что работа с людьми — это моё. Получила конкретные рекомендации по развитию навыков общения и работы с подростками.', status: 'approved', createdAt: new Date('2025-02-27').toISOString() },
    { id: '9', name: 'Ерлан Каскенов', age: 19, testType: 'Первичное понимание', date: '28.02.2025', result: 'Технологии и аналитика', text: 'Бесплатный тест помог определиться с направлением в IT. Понял, что мне интереснее backend и работа с базами данных, а не фронтенд. Теперь знаю, какие курсы искать и на что обращать внимание.', status: 'approved', createdAt: new Date('2025-02-28').toISOString() },
    { id: '10', name: 'Анна Петрова', age: 17, testType: 'Личный разбор', date: '01.03.2025', result: 'Креативные индустрии', text: 'Купила расширенный тест после бесплатного. Отчёт получился очень подробным — 5 страниц с анализом. Особенно понравился раздел про форматы работы, где мне будет комфортнее. Теперь точно знаю, что хочу в графический дизайн.', status: 'approved', createdAt: new Date('2025-03-01').toISOString() },
    { id: '11', name: 'Асылбек Нуртазин', age: 16, testType: 'Подросток и родитель', date: '03.03.2025', result: 'Технологии и аналитика', text: 'Проходил тест с отцом. Он хотел, чтобы я шёл в бизнес, но тест показал, что мне ближе программирование. Отчёт помог отцу понять мои интересы, и теперь он поддерживает мой выбор IT-направления.', status: 'approved', createdAt: new Date('2025-03-03').toISOString() },
    { id: '12', name: 'Дмитрий Иванов', age: 18, testType: 'Первичное понимание', date: '05.03.2025', result: 'Коммуникации и сервис', text: 'Выбирал между менеджментом и психологией. Тест склонил к психологии — оказалось, что мне действительно интереснее работать с людьми и помогать им, чем управлять процессами. Хороший инструмент для самоопределения.', status: 'approved', createdAt: new Date('2025-03-05').toISOString() },
    { id: '13', name: 'Амина Касымова', age: 17, testType: 'Личный разбор', date: '07.03.2025', result: 'Креативные индустрии', text: 'Расширенный тест помог понять, почему мне так нравится фотография и визуальное искусство. В отчёте было много про мои сильные стороны в креативности и способах самовыражения. Теперь увереннее в своём выборе профессии.', status: 'approved', createdAt: new Date('2025-03-07').toISOString() },
    { id: '14', name: 'Никита Морозов', age: 19, testType: 'Первичное понимание', date: '09.03.2025', result: 'Технологии и аналитика', text: 'Бесплатный тест дал хорошее направление. Понял, что мне интереснее системная аналитика и автоматизация процессов, чем разработка. Уже начал изучать соответствующие инструменты и планирую пройти платный тест для более детального разбора.', status: 'approved', createdAt: new Date('2025-03-09').toISOString() },
    { id: '15', name: 'Аружан Бектасова', age: 16, testType: 'Подросток и родитель', date: '10.03.2025', result: 'Коммуникации и сервис', text: 'Мама купила тест для нас обеих. Было интересно увидеть, как мы по-разному мыслим и принимаем решения. Это помогло нам лучше понимать друг друга. Я поняла, почему мама так реагирует на некоторые мои решения, и наоборот.', status: 'approved', createdAt: new Date('2025-03-10').toISOString() },
    { id: '16', name: 'Максим Волков', age: 18, testType: 'Личный разбор', date: '12.03.2025', result: 'Технологии и аналитика', text: 'Платный тест оказался очень полезным. Получил детальный анализ своих способностей и рекомендации по развитию в сфере данных. Особенно ценно было про то, какие навыки стоит развивать в первую очередь. Отчёт распечатал и использую как план развития.', status: 'approved', createdAt: new Date('2025-03-12').toISOString() },
    { id: '17', name: 'Жанна Абдуллина', age: 17, testType: 'Первичное понимание', date: '14.03.2025', result: 'Креативные индустрии', text: 'Бесплатный тест помог понять, что мне действительно интересен дизайн интерьеров, а не просто "красивая работа". Вопросы заставили задуматься о том, как я вижу пространство и что для меня важно в окружающей среде.', status: 'approved', createdAt: new Date('2025-03-14').toISOString() },
    { id: '18', name: 'Артём Семёнов', age: 19, testType: 'Личный разбор', date: '16.03.2025', result: 'Коммуникации и сервис', text: 'Купил расширенный тест перед выбором магистратуры. Отчёт помог понять, что мне ближе работа в HR и развитие людей, чем чистое управление. Получил конкретные рекомендации по специализациям и курсам для дальнейшего развития.', status: 'approved', createdAt: new Date('2025-03-16').toISOString() },
    { id: '19', name: 'Айжан Токтарова', age: 16, testType: 'Подросток и родитель', date: '18.03.2025', result: 'Креативные индустрии', text: 'Проходила тест с мамой. Она всегда хотела, чтобы я стала врачом, но тест показал, что мне ближе творческие профессии. Отчёт помог маме понять мои интересы, и теперь она поддерживает мой выбор в дизайне одежды.', status: 'approved', createdAt: new Date('2025-03-18').toISOString() },
    { id: '20', name: 'Игорь Новиков', age: 18, testType: 'Первичное понимание', date: '20.03.2025', result: 'Технологии и аналитика', text: 'Бесплатный тест дал хорошее направление. Понял, что мне интереснее работа с искусственным интеллектом и машинным обучением, чем обычная разработка. Теперь знаю, на какие предметы обращать внимание в университете.', status: 'approved', createdAt: new Date('2025-03-20').toISOString() },
    { id: '21', name: 'Сабина Омарова', age: 17, testType: 'Личный разбор', date: '22.03.2025', result: 'Коммуникации и сервис', text: 'Расширенный тест помог понять мои сильные стороны в общении и работе с людьми. Отчёт показал, что мне действительно подходит работа в сфере образования или психологии. Получила много конкретных рекомендаций по развитию навыков.', status: 'approved', createdAt: new Date('2025-03-22').toISOString() },
    { id: '22', name: 'Роман Кузнецов', age: 19, testType: 'Первичное понимание', date: '24.03.2025', result: 'Технологии и аналитика', text: 'Выбирал между экономикой и IT. Тест показал, что мне ближе программирование и работа с данными. Бесплатный вариант дал хорошее направление, планирую пройти платный для более детального разбора.', status: 'approved', createdAt: new Date('2025-03-24').toISOString() },
    { id: '23', name: 'Алёна Смирнова', age: 16, testType: 'Подросток и родитель', date: '26.03.2025', result: 'Креативные индустрии', text: 'Проходила тест вместе с папой. Он хотел, чтобы я стала юристом, но тест показал, что мне ближе творческие профессии. Отчёт помог папе понять мои интересы, и теперь он поддерживает мой выбор в журналистике.', status: 'approved', createdAt: new Date('2025-03-26').toISOString() },
    { id: '24', name: 'Данияр Сабитов', age: 18, testType: 'Личный разбор', date: '28.03.2025', result: 'Технологии и аналитика', text: 'Платный тест оказался очень полезным перед поступлением. Получил детальный анализ своих способностей в сфере IT и конкретные рекомендации по специализациям. Особенно понравился раздел про среды, где мне будет комфортнее работать и развиваться.', status: 'approved', createdAt: new Date('2025-03-28').toISOString() },
    { id: '25', name: 'Мария Орлова', age: 17, testType: 'Первичное понимание', date: '30.03.2025', result: 'Коммуникации и сервис', text: 'Бесплатный тест помог понять, что мне интереснее работа с людьми, чем с документами. Поняла, что хочу в психологию или социальную работу. Вопросы заставили задуматься о том, как я на самом деле взаимодействую с окружающими.', status: 'approved', createdAt: new Date('2025-03-30').toISOString() },
    { id: '26', name: 'Темирлан Алиев', age: 16, testType: 'Подросток и родитель', date: '01.04.2025', result: 'Технологии и аналитика', text: 'Проходил тест с мамой. Она всегда хотела, чтобы я стал врачом, но тест показал, что мне ближе программирование. Отчёт помог маме понять мои интересы и способности, теперь она поддерживает мой выбор IT-направления.', status: 'approved', createdAt: new Date('2025-04-01').toISOString() },
    { id: '27', name: 'София Романова', age: 18, testType: 'Личный разбор', date: '03.04.2025', result: 'Креативные индустрии', text: 'Купила расширенный тест после бесплатного. Отчёт получился очень подробным — 6 страниц с анализом моих способностей в дизайне. Особенно ценно было про сильные стороны и зоны роста. Теперь точно знаю, в каком направлении развиваться.', status: 'approved', createdAt: new Date('2025-04-03').toISOString() },
    { id: '28', name: 'Андрей Белов', age: 19, testType: 'Первичное понимание', date: '05.04.2025', result: 'Коммуникации и сервис', text: 'Бесплатный тест помог определиться с направлением. Понял, что мне интереснее работа в сфере образования или HR, чем чистое управление. Хороший инструмент для самоопределения перед выбором специализации в магистратуре.', status: 'approved', createdAt: new Date('2025-04-05').toISOString() },
    { id: '29', name: 'Айнур Жаныбекова', age: 17, testType: 'Личный разбор', date: '07.04.2025', result: 'Коммуникации и сервис', text: 'Платный тест помог понять мои сильные стороны в работе с людьми. Получила детальный разбор и рекомендации по развитию навыков общения. Особенно понравился раздел про взаимодействие с разными типами людей — это помогло в отношениях с друзьями и семьёй.', status: 'approved', createdAt: new Date('2025-04-07').toISOString() },
    { id: '30', name: 'Кирилл Лебедев', age: 18, testType: 'Первичное понимание', date: '09.04.2025', result: 'Технологии и аналитика', text: 'Бесплатный тест дал хорошее направление перед поступлением. Понял, что мне интереснее работа с данными и аналитика, чем обычная разработка. Теперь знаю, на какие курсы обращать внимание и какие навыки развивать.', status: 'approved', createdAt: new Date('2025-04-09').toISOString() },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReviews));
}

