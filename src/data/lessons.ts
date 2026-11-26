import type { Lesson } from '@/types';

/** Награда настроением за верный ответ (зафиксировано контрактом: +4). */
export const LESSON_CORRECT_MOOD_GAIN = 4;

/**
 * Мок-уроки английского языка.
 * Каждый урок — последовательность из 4–5 заданий (Lesson.tasks).
 * Логика задания: питомец «говорит» английскую фразу, игрок собирает её перевод
 * из банка русских слов (в банке есть дистракторы — лишние слова).
 *
 * Правила данных:
 *  - все id слов внутри урока уникальны;
 *  - correctWordIds ссылаются ТОЛЬКО на существующие words.id и задают верный порядок;
 *  - translation совпадает с фразой, собранной из правильных слов в правильном порядке
 *    (слова соединяются через пробел, знаки препинания входят в текст слов).
 *
 * Структура готова к будущему импорту из JSON/админки: урок = метаданные + tasks.
 */
export const lessons: Lesson[] = [
  {
    id: 'lesson-greetings',
    title: 'Приветствие',
    instruction: 'Собери перевод фразы питомца на русский язык.',
    xpReward: 10,
    mode: 'choice',
    tasks: [
      {
        id: 'greetings-1',
        petPhrase: 'Hello! How are you?',
        translation: 'Привет! Как дела?',
        words: [
          { id: 'greet-1-1', text: 'Привет!' },
          { id: 'greet-1-2', text: 'Как' },
          { id: 'greet-1-3', text: 'дела?' },
          { id: 'greet-1-4', text: 'спасибо' },
          { id: 'greet-1-5', text: 'ты' },
          { id: 'greet-1-6', text: 'хорошо' },
        ],
        correctWordIds: ['greet-1-1', 'greet-1-2', 'greet-1-3'],
      },
      {
        id: 'greetings-2',
        petPhrase: 'Good morning, my friend!',
        translation: 'Доброе утро, мой друг!',
        words: [
          { id: 'greet-2-1', text: 'Доброе' },
          { id: 'greet-2-2', text: 'утро,' },
          { id: 'greet-2-3', text: 'мой' },
          { id: 'greet-2-4', text: 'друг!' },
          { id: 'greet-2-5', text: 'вечер,' },
          { id: 'greet-2-6', text: 'враг!' },
        ],
        correctWordIds: ['greet-2-1', 'greet-2-2', 'greet-2-3', 'greet-2-4'],
      },
      {
        id: 'greetings-3',
        petPhrase: 'What is your name?',
        translation: 'Как тебя зовут?',
        words: [
          { id: 'greet-3-1', text: 'Как' },
          { id: 'greet-3-2', text: 'тебя' },
          { id: 'greet-3-3', text: 'зовут?' },
          { id: 'greet-3-4', text: 'меня' },
          { id: 'greet-3-5', text: 'где' },
          { id: 'greet-3-6', text: 'живёшь?' },
        ],
        correctWordIds: ['greet-3-1', 'greet-3-2', 'greet-3-3'],
      },
      {
        id: 'greetings-4',
        petPhrase: 'Nice to meet you!',
        translation: 'Приятно познакомиться!',
        words: [
          { id: 'greet-4-1', text: 'Приятно' },
          { id: 'greet-4-2', text: 'познакомиться!' },
          { id: 'greet-4-3', text: 'До' },
          { id: 'greet-4-4', text: 'свидания!' },
          { id: 'greet-4-5', text: 'снова' },
        ],
        correctWordIds: ['greet-4-1', 'greet-4-2'],
      },
      {
        id: 'greetings-5',
        petPhrase: 'See you tomorrow!',
        translation: 'До завтра!',
        words: [
          { id: 'greet-5-1', text: 'До' },
          { id: 'greet-5-2', text: 'завтра!' },
          { id: 'greet-5-3', text: 'сегодня!' },
          { id: 'greet-5-4', text: 'встречи' },
        ],
        correctWordIds: ['greet-5-1', 'greet-5-2'],
      },
    ],
  },
  {
    id: 'lesson-breakfast',
    title: 'Завтрак',
    instruction: 'Собери перевод на русский: что хочет сделать питомец?',
    xpReward: 15,
    mode: 'choice',
    tasks: [
      {
        id: 'breakfast-1',
        petPhrase: 'I want to eat an apple.',
        translation: 'Я хочу съесть яблоко.',
        words: [
          { id: 'food-1-1', text: 'Я' },
          { id: 'food-1-2', text: 'хочу' },
          { id: 'food-1-3', text: 'съесть' },
          { id: 'food-1-4', text: 'яблоко.' },
          { id: 'food-1-5', text: 'пить' },
          { id: 'food-1-6', text: 'банан.' },
        ],
        correctWordIds: ['food-1-1', 'food-1-2', 'food-1-3', 'food-1-4'],
      },
      {
        id: 'breakfast-2',
        petPhrase: 'I drink tea with milk.',
        translation: 'Я пью чай с молоком.',
        words: [
          { id: 'food-2-1', text: 'Я' },
          { id: 'food-2-2', text: 'пью' },
          { id: 'food-2-3', text: 'чай' },
          { id: 'food-2-4', text: 'с' },
          { id: 'food-2-5', text: 'молоком.' },
          { id: 'food-2-6', text: 'кофе,' },
          { id: 'food-2-7', text: 'без' },
        ],
        correctWordIds: ['food-2-1', 'food-2-2', 'food-2-3', 'food-2-4', 'food-2-5'],
      },
      {
        id: 'breakfast-3',
        petPhrase: 'The bread is very tasty.',
        translation: 'Хлеб очень вкусный.',
        words: [
          { id: 'food-3-1', text: 'Хлеб' },
          { id: 'food-3-2', text: 'очень' },
          { id: 'food-3-3', text: 'вкусный.' },
          { id: 'food-3-4', text: 'сыр' },
          { id: 'food-3-5', text: 'сладкий' },
          { id: 'food-3-6', text: 'не' },
        ],
        correctWordIds: ['food-3-1', 'food-3-2', 'food-3-3'],
      },
      {
        id: 'breakfast-4',
        petPhrase: 'Give me some cheese, please.',
        translation: 'Дай мне сыра, пожалуйста.',
        words: [
          { id: 'food-4-1', text: 'Дай' },
          { id: 'food-4-2', text: 'мне' },
          { id: 'food-4-3', text: 'сыра,' },
          { id: 'food-4-4', text: 'пожалуйста.' },
          { id: 'food-4-5', text: 'хлеба' },
          { id: 'food-4-6', text: 'спасибо' },
        ],
        correctWordIds: ['food-4-1', 'food-4-2', 'food-4-3', 'food-4-4'],
      },
      {
        id: 'breakfast-5',
        petPhrase: 'I like eggs for breakfast.',
        translation: 'Я люблю яйца на завтрак.',
        words: [
          { id: 'food-5-1', text: 'Я' },
          { id: 'food-5-2', text: 'люблю' },
          { id: 'food-5-3', text: 'яйца' },
          { id: 'food-5-4', text: 'на' },
          { id: 'food-5-5', text: 'завтрак.' },
          { id: 'food-5-6', text: 'кашу' },
          { id: 'food-5-7', text: 'ужин' },
        ],
        correctWordIds: ['food-5-1', 'food-5-2', 'food-5-3', 'food-5-4', 'food-5-5'],
      },
    ],
  },
  {
    id: 'lesson-cat',
    title: 'Питомец и кот',
    instruction: 'Собери перевод фразы на русский язык.',
    xpReward: 20,
    mode: 'choice',
    tasks: [
      {
        id: 'cat-1',
        petPhrase: 'My cat likes milk and fish.',
        translation: 'Моя кошка любит молоко и рыбу.',
        words: [
          { id: 'cat-1-1', text: 'Моя' },
          { id: 'cat-1-2', text: 'кошка' },
          { id: 'cat-1-3', text: 'любит' },
          { id: 'cat-1-4', text: 'молоко' },
          { id: 'cat-1-5', text: 'и' },
          { id: 'cat-1-6', text: 'рыбу.' },
          { id: 'cat-1-7', text: 'собака' },
          { id: 'cat-1-8', text: 'мясо.' },
        ],
        correctWordIds: ['cat-1-1', 'cat-1-2', 'cat-1-3', 'cat-1-4', 'cat-1-5', 'cat-1-6'],
      },
      {
        id: 'cat-2',
        petPhrase: 'The dog is sleeping on the sofa.',
        translation: 'Собака спит на диване.',
        words: [
          { id: 'cat-2-1', text: 'Собака' },
          { id: 'cat-2-2', text: 'спит' },
          { id: 'cat-2-3', text: 'на' },
          { id: 'cat-2-4', text: 'диване.' },
          { id: 'cat-2-5', text: 'кошка' },
          { id: 'cat-2-6', text: 'кресле' },
        ],
        correctWordIds: ['cat-2-1', 'cat-2-2', 'cat-2-3', 'cat-2-4'],
      },
      {
        id: 'cat-3',
        petPhrase: 'My pet is very funny.',
        translation: 'Мой питомец очень смешной.',
        words: [
          { id: 'cat-3-1', text: 'Мой' },
          { id: 'cat-3-2', text: 'питомец' },
          { id: 'cat-3-3', text: 'очень' },
          { id: 'cat-3-4', text: 'смешной.' },
          { id: 'cat-3-5', text: 'кот' },
          { id: 'cat-3-6', text: 'грустный' },
        ],
        correctWordIds: ['cat-3-1', 'cat-3-2', 'cat-3-3', 'cat-3-4'],
      },
      {
        id: 'cat-4',
        petPhrase: 'The cat plays with a ball.',
        translation: 'Кошка играет с мячом.',
        words: [
          { id: 'cat-4-1', text: 'Кошка' },
          { id: 'cat-4-2', text: 'играет' },
          { id: 'cat-4-3', text: 'с' },
          { id: 'cat-4-4', text: 'мячом.' },
          { id: 'cat-4-5', text: 'собака' },
          { id: 'cat-4-6', text: 'палкой' },
        ],
        correctWordIds: ['cat-4-1', 'cat-4-2', 'cat-4-3', 'cat-4-4'],
      },
      {
        id: 'cat-5',
        petPhrase: 'We love our pets.',
        translation: 'Мы любим наших питомцев.',
        words: [
          { id: 'cat-5-1', text: 'Мы' },
          { id: 'cat-5-2', text: 'любим' },
          { id: 'cat-5-3', text: 'наших' },
          { id: 'cat-5-4', text: 'питомцев.' },
          { id: 'cat-5-5', text: 'они' },
          { id: 'cat-5-6', text: 'чужих' },
        ],
        correctWordIds: ['cat-5-1', 'cat-5-2', 'cat-5-3', 'cat-5-4'],
      },
    ],
  },
  {
    id: 'lesson-politeness',
    title: 'Вежливость',
    instruction: 'Собери перевод фразы на русский язык.',
    xpReward: 20,
    mode: 'choice',
    tasks: [
      {
        id: 'politeness-1',
        petPhrase: 'Good morning! Thank you for the help.',
        translation: 'Доброе утро! Спасибо за помощь.',
        words: [
          { id: 'polite-1-1', text: 'Доброе' },
          { id: 'polite-1-2', text: 'утро!' },
          { id: 'polite-1-3', text: 'Спасибо' },
          { id: 'polite-1-4', text: 'за' },
          { id: 'polite-1-5', text: 'помощь.' },
          { id: 'polite-1-6', text: 'пожалуйста,' },
          { id: 'polite-1-7', text: 'ночь.' },
        ],
        correctWordIds: [
          'polite-1-1',
          'polite-1-2',
          'polite-1-3',
          'polite-1-4',
          'polite-1-5',
        ],
      },
      {
        id: 'politeness-2',
        petPhrase: 'Please, excuse me.',
        translation: 'Пожалуйста, извините меня.',
        words: [
          { id: 'polite-2-1', text: 'Пожалуйста,' },
          { id: 'polite-2-2', text: 'извините' },
          { id: 'polite-2-3', text: 'меня.' },
          { id: 'polite-2-4', text: 'спасибо' },
          { id: 'polite-2-5', text: 'простите' },
        ],
        correctWordIds: ['polite-2-1', 'polite-2-2', 'polite-2-3'],
      },
      {
        id: 'politeness-3',
        petPhrase: 'Thank you very much!',
        translation: 'Большое спасибо!',
        words: [
          { id: 'polite-3-1', text: 'Большое' },
          { id: 'polite-3-2', text: 'спасибо!' },
          { id: 'polite-3-3', text: 'пожалуйста!' },
          { id: 'polite-3-4', text: 'огромное' },
        ],
        correctWordIds: ['polite-3-1', 'polite-3-2'],
      },
      {
        id: 'politeness-4',
        petPhrase: 'Good evening, madam!',
        translation: 'Добрый вечер, мадам!',
        words: [
          { id: 'polite-4-1', text: 'Добрый' },
          { id: 'polite-4-2', text: 'вечер,' },
          { id: 'polite-4-3', text: 'мадам!' },
          { id: 'polite-4-4', text: 'доброе' },
          { id: 'polite-4-5', text: 'утро!' },
        ],
        correctWordIds: ['polite-4-1', 'polite-4-2', 'polite-4-3'],
      },
      {
        id: 'politeness-5',
        petPhrase: 'I am sorry for being late.',
        translation: 'Извините за опоздание.',
        words: [
          { id: 'polite-5-1', text: 'Извините' },
          { id: 'polite-5-2', text: 'за' },
          { id: 'polite-5-3', text: 'опоздание.' },
          { id: 'polite-5-4', text: 'спасибо' },
          { id: 'polite-5-5', text: 'помощь' },
        ],
        correctWordIds: ['polite-5-1', 'polite-5-2', 'polite-5-3'],
      },
    ],
  },
];
