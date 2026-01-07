import type { TestConfig } from '../../../engine/types';

/**
 * FREE / 18–24
 * Gender-independent test
 * Только вопросы + positional resultMapping
 */
const testConfig: TestConfig = {
  meta: {
    tariff: 'FREE',
    age: '18-24',
  },

  questions: [
    {
      id: 1,
      text: 'Когда вам предлагают новый проект или задачу, вы обычно:',
      options: [
        { value: 'P', label: 'Берётесь сразу и разбираетесь по ходу дела' },
        { value: 'J', label: 'Сначала анализируете и планируете подход' },
      ],
    },
    {
      id: 2,
      text: 'В новом коллективе или команде вы скорее:',
      options: [
        { value: 'E', label: 'Быстро знакомитесь и активно общаетесь' },
        { value: 'I', label: 'Сначала наблюдаете и держитесь сдержанно' },
      ],
    },
    {
      id: 3,
      text: 'При принятии важных решений вы чаще:',
      options: [
        { value: 'T', label: 'Опираетесь на логику, факты и анализ' },
        { value: 'F', label: 'Учитываете эмоции и отношения между людьми' },
      ],
    },
    {
      id: 4,
      text: 'Если нужно подготовиться к важному событию или дедлайну, вы:',
      options: [
        { value: 'J', label: 'Составляете план и придерживаетесь его' },
        { value: 'P', label: 'Оставляете место для гибкости и импровизации' },
      ],
    },
    {
      id: 5,
      text: 'Думая о своём будущем, вы чаще:',
      options: [
        { value: 'N', label: 'Рассматриваете разные возможности и направления' },
        { value: 'S', label: 'Фокусируетесь на конкретных целях и шагах' },
      ],
    },
  ],

  // Универсальный mapping для всех FREE тестов
  resultMapping: {
    position1: { from: 2 },      // E / I
    position2: { from: 5 },      // N / S
    position3: { from: 3 },      // T / F
    position4: { from: [1, 4] }, // J / P / W
  },
};

export default testConfig;
