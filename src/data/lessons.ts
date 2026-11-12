import type { Lesson } from '@/types';

/** Награда настроением за верный ответ (зафиксировано контрактом: +4). */
export const LESSON_CORRECT_MOOD_GAIN = 4;

/**
 * Мок-уроки английского языка.
 * Логика задания: питомец «говорит» английскую фразу, игрок собирает её перевод
 * из банка русских слов (в банке есть дистракторы — лишние слова).
 *
 * Правила данных:
 *  - все id слов внутри урока уникальны;
 *  - correctWordIds ссылаются ТОЛЬКО на существующие words.id и задают верный порядок;
 *  - translation совпадает с фразой, собранной из правильных слов в правильном порядке.
 */
export const lessons: Lesson[] = [
  {
    id: 'lesson-greetings',
    title: 'Приветствие',
    petPhrase: 'Hello! How are you?',
    instruction: 'Собери перевод фразы питомца на русский язык.',
    translation: 'Привет! Как дела?',
    xpReward: 10,
    mode: 'choice',
    words: [
      { id: 'greet-1', text: 'Привет!' },
      { id: 'greet-2', text: 'Как' },
      { id: 'greet-3', text: 'дела?' },
      { id: 'greet-4', text: 'спасибо' },
      { id: 'greet-5', text: 'ты' },
      { id: 'greet-6', text: 'хорошо' },
    ],
    correctWordIds: ['greet-1', 'greet-2', 'greet-3'],
  },
  {
    id: 'lesson-breakfast',
    title: 'Завтрак',
    petPhrase: 'I want to eat an apple.',
    instruction: 'Собери перевод на русский: что хочет сделать питомец?',
    translation: 'Я хочу съесть яблоко.',
    xpReward: 15,
    mode: 'choice',
    words: [
      { id: 'food-1', text: 'Я' },
      { id: 'food-2', text: 'хочу' },
      { id: 'food-3', text: 'съесть' },
      { id: 'food-4', text: 'яблоко.' },
      { id: 'food-5', text: 'пить' },
      { id: 'food-6', text: 'банан.' },
    ],
    correctWordIds: ['food-1', 'food-2', 'food-3', 'food-4'],
  },
  {
    id: 'lesson-cat',
    title: 'Питомец и кот',
    petPhrase: 'My cat likes milk and fish.',
    instruction: 'Собери перевод фразы на русский язык.',
    translation: 'Моя кошка любит молоко и рыбу.',
    xpReward: 20,
    mode: 'choice',
    words: [
      { id: 'cat-1', text: 'Моя' },
      { id: 'cat-2', text: 'кошка' },
      { id: 'cat-3', text: 'любит' },
      { id: 'cat-4', text: 'молоко' },
      { id: 'cat-5', text: 'и' },
      { id: 'cat-6', text: 'рыбу.' },
      { id: 'cat-7', text: 'собака' },
      { id: 'cat-8', text: 'мясо.' },
    ],
    correctWordIds: ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'],
  },
  {
    id: 'lesson-politeness',
    title: 'Вежливость',
    petPhrase: 'Good morning! Thank you for the help.',
    instruction: 'Собери перевод фразы на русский язык.',
    translation: 'Доброе утро! Спасибо за помощь.',
    xpReward: 20,
    mode: 'choice',
    words: [
      { id: 'polite-1', text: 'Доброе' },
      { id: 'polite-2', text: 'утро!' },
      { id: 'polite-3', text: 'Спасибо' },
      { id: 'polite-4', text: 'за' },
      { id: 'polite-5', text: 'помощь.' },
      { id: 'polite-6', text: 'пожалуйста,' },
      { id: 'polite-7', text: 'ночь.' },
    ],
    correctWordIds: ['polite-1', 'polite-2', 'polite-3', 'polite-4', 'polite-5'],
  },
];
