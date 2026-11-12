import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lesson, LessonStatus } from '@/types';
import { LESSON_CORRECT_MOOD_GAIN, lessons as lessonsData } from '@/data/lessons';
import { usePetStore } from './petStore';

/** Ключ persist-хранилища прогресса уроков. */
export const LESSON_STORE_KEY = 'tamang.lesson-progress';

/**
 * Состояние модуля уроков: текущая сессия + прогресс прохождения.
 * Уроки — статический импорт из src/data/lessons.ts, в localStorage хранится только прогресс.
 */
export interface LessonStoreState {
  /** Все доступные уроки (источник данных, не меняется). */
  lessons: Lesson[];
  /** id текущего урока; null — сессия не открыта. */
  currentLessonId: string | null;
  /** Выбранные слова в порядке сборки ответа. */
  selectedWordIds: string[];
  /** Статус текущей сессии. */
  status: LessonStatus;
  /** Количество проверок ответа в текущей сессии. */
  attempts: number;
  /** id завершённых уроков (персистится). */
  completedLessonIds: string[];
  /** Без id — первый незавершённый урок, иначе первый урок. */
  startLesson(lessonId?: string): void;
  /** Добавить слово в ответ; повторный клик по уже выбранному игнорируется. */
  selectWord(wordId: string): void;
  /** Удалить слово из ответа по позиции. */
  removeWordAt(index: number): void;
  /** Очистить ответ и вернуть сессию в состояние сборки. */
  clearAnswer(): void;
  /** Проверить ответ; начисляет XP и настроение при верном ответе. */
  checkAnswer(): boolean;
  /** Перейти к следующему незавершённому уроку; если таких нет — status='completed'. */
  nextLesson(): void;
  /** Закрыть урок: сбросить сессию. */
  exitLesson(): void;
  /** Полный сброс прогресса уроков. */
  resetProgress(): void;
}

/** Что сохраняется в localStorage: только список завершённых уроков. */
type LessonPersistedState = Pick<LessonStoreState, 'completedLessonIds'>;

/** Правильный ли порядок слов выбран ответ. */
function isAnswerCorrect(selectedWordIds: readonly string[], correctWordIds: readonly string[]): boolean {
  if (selectedWordIds.length !== correctWordIds.length) {
    return false;
  }
  return selectedWordIds.every((wordId, index) => wordId === correctWordIds[index]);
}

export const useLessonStore = create<LessonStoreState>()(
  persist(
    (set, get) => ({
      lessons: lessonsData,
      currentLessonId: null,
      selectedWordIds: [],
      status: 'idle',
      attempts: 0,
      completedLessonIds: [],

      startLesson: (lessonId) => {
        const { completedLessonIds } = get();
        const requested = lessonId
          ? lessonsData.find((lesson) => lesson.id === lessonId)
          : undefined;
        const fallback =
          lessonsData.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? lessonsData[0];
        const target = requested ?? fallback;

        if (!target) {
          set({ currentLessonId: null, selectedWordIds: [], status: 'idle', attempts: 0 });
          return;
        }

        set({
          currentLessonId: target.id,
          selectedWordIds: [],
          status: 'assembling',
          attempts: 0,
        });
      },

      selectWord: (wordId) => {
        const { currentLessonId, status, selectedWordIds } = get();
        if (!currentLessonId) {
          return;
        }
        // После проверки ответ фиксирован: сначала нужно нажать «Исправить»/«Дальше».
        if (status === 'correct' || status === 'wrong' || status === 'completed') {
          return;
        }
        const lesson = lessonsData.find((item) => item.id === currentLessonId);
        if (!lesson || !lesson.words.some((word) => word.id === wordId)) {
          return;
        }
        if (selectedWordIds.includes(wordId)) {
          return;
        }
        set({
          selectedWordIds: [...selectedWordIds, wordId],
          status: 'assembling',
        });
      },

      removeWordAt: (index) => {
        const { currentLessonId, status, selectedWordIds } = get();
        if (!currentLessonId || status !== 'assembling') {
          return;
        }
        if (index < 0 || index >= selectedWordIds.length) {
          return;
        }
        set({ selectedWordIds: selectedWordIds.filter((_, position) => position !== index) });
      },

      clearAnswer: () => {
        const { currentLessonId, status } = get();
        if (!currentLessonId) {
          return;
        }
        set({
          selectedWordIds: [],
          status: status === 'correct' || status === 'wrong' ? 'assembling' : status,
        });
      },

      checkAnswer: () => {
        const state = get();
        const lesson = state.currentLessonId
          ? lessonsData.find((item) => item.id === state.currentLessonId)
          : undefined;
        if (!lesson) {
          return false;
        }
        // Повторная проверка уже верного ответа не начисляет награду второй раз.
        if (state.status === 'correct') {
          return true;
        }
        if (state.status === 'completed') {
          return false;
        }

        const attempts = state.attempts + 1;
        const correct = isAnswerCorrect(state.selectedWordIds, lesson.correctWordIds);

        if (!correct) {
          set({ status: 'wrong', attempts });
          return false;
        }

        // Урок уже был пройден ранее — награду повторно не начисляем.
        const isFirstCompletion = !state.completedLessonIds.includes(lesson.id);

        set({
          status: 'correct',
          attempts,
          completedLessonIds: isFirstCompletion
            ? [...state.completedLessonIds, lesson.id]
            : state.completedLessonIds,
        });

        // Награда (опыт и настроение питомца) — только за первое прохождение урока,
        // чтобы повторное прохождение не фармило опыт. Звук — на стороне UI.
        if (isFirstCompletion) {
          const pet = usePetStore.getState();
          pet.addXp(lesson.xpReward);
          pet.applyStatDelta({ mood: LESSON_CORRECT_MOOD_GAIN });
        }

        return true;
      },

      nextLesson: () => {
        const state = get();
        const currentIndex = state.currentLessonId
          ? lessonsData.findIndex((lesson) => lesson.id === state.currentLessonId)
          : -1;
        // Ищем после текущего урока, затем по кругу — чтобы не потерять незавершённые ранее.
        const ordered =
          currentIndex >= 0
            ? [...lessonsData.slice(currentIndex + 1), ...lessonsData.slice(0, currentIndex)]
            : lessonsData;
        const next = ordered.find((lesson) => !state.completedLessonIds.includes(lesson.id));

        if (!next) {
          set({ status: 'completed' });
          return;
        }

        set({
          currentLessonId: next.id,
          selectedWordIds: [],
          status: 'assembling',
          attempts: 0,
        });
      },

      exitLesson: () => {
        set({
          currentLessonId: null,
          selectedWordIds: [],
          status: 'idle',
          attempts: 0,
        });
      },

      resetProgress: () => {
        set({
          completedLessonIds: [],
          currentLessonId: null,
          selectedWordIds: [],
          status: 'idle',
          attempts: 0,
        });
      },
    }),
    {
      name: LESSON_STORE_KEY,
      version: 1,
      partialize: (state): LessonPersistedState => ({
        completedLessonIds: state.completedLessonIds,
      }),
    },
  ),
);
