import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lesson, LessonStatus, LessonTask, LessonTaskStatus } from '@/types';
import { LESSON_CORRECT_MOOD_GAIN, lessons as lessonsData } from '@/data/lessons';
import { usePetStore } from './petStore';

/** Ключ persist-хранилища прогресса уроков. */
export const LESSON_STORE_KEY = 'tamang.lesson-progress';

/**
 * Состояние модуля уроков: текущая сессия (задание + статусы) и прогресс прохождения.
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
  /** Индекс текущего задания в lesson.tasks. */
  currentTaskIndex: number;
  /** Статусы всех заданий урока: pending / correct / wrong. */
  taskStatuses: LessonTaskStatus[];
  /** Идёт круг исправления ошибок (возврат на красные задания). */
  isReviewRound: boolean;
  /** Без id — первый незавершённый урок, иначе первый урок. */
  startLesson(lessonId?: string): void;
  /** Добавить слово в ответ; повторный клик по уже выбранному игнорируется. */
  selectWord(wordId: string): void;
  /** Удалить слово из ответа по позиции. */
  removeWordAt(index: number): void;
  /** Очистить ответ и вернуть сессию в состояние сборки. */
  clearAnswer(): void;
  /** Проверить ответ текущего задания; отмечает задание correct/wrong. */
  checkAnswer(): boolean;
  /**
   * Перейти к следующему заданию: сначала линейный проход, затем круг исправления
   * ошибок; когда все задания верны — урок засчитывается и начисляется XP.
   */
  nextTask(): void;
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

/** Начальные статусы заданий урока: все ещё не пройдены. */
function createTaskStatuses(lesson: Lesson): LessonTaskStatus[] {
  return lesson.tasks.map(() => 'pending');
}

/** Текущее задание урока по индексу (undefined, если данных нет). */
function getCurrentTask(lesson: Lesson, taskIndex: number): LessonTask | undefined {
  return lesson.tasks[taskIndex];
}

/** Загружен ли урок целиком: ни одного wrong и ни одного pending. */
function isLessonSolved(taskStatuses: readonly LessonTaskStatus[]): boolean {
  return !taskStatuses.some((status) => status === 'wrong' || status === 'pending');
}

/** Сброс сессии урока в «не начат». */
const IDLE_SESSION = {
  currentLessonId: null,
  selectedWordIds: [] as string[],
  status: 'idle' as LessonStatus,
  attempts: 0,
  currentTaskIndex: 0,
  taskStatuses: [] as LessonTaskStatus[],
  isReviewRound: false,
};

export const useLessonStore = create<LessonStoreState>()(
  persist(
    (set, get) => ({
      lessons: lessonsData,
      ...IDLE_SESSION,
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
          set({ ...IDLE_SESSION });
          return;
        }

        set({
          currentLessonId: target.id,
          selectedWordIds: [],
          status: 'assembling',
          attempts: 0,
          currentTaskIndex: 0,
          taskStatuses: createTaskStatuses(target),
          isReviewRound: false,
        });
      },

      selectWord: (wordId) => {
        const { currentLessonId, status, selectedWordIds, currentTaskIndex } = get();
        if (!currentLessonId) {
          return;
        }
        // После проверки ответ фиксирован: сначала нужно нажать «Дальше»/«Исправить».
        if (status === 'correct' || status === 'wrong' || status === 'completed') {
          return;
        }
        const lesson = lessonsData.find((item) => item.id === currentLessonId);
        const task = lesson ? getCurrentTask(lesson, currentTaskIndex) : undefined;
        if (!task || !task.words.some((word) => word.id === wordId)) {
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
        const task = lesson ? getCurrentTask(lesson, state.currentTaskIndex) : undefined;
        if (!lesson || !task) {
          return false;
        }
        // Повторная проверка уже верного ответа не меняет статусы.
        if (state.status === 'correct') {
          return true;
        }
        if (state.status === 'completed') {
          return false;
        }

        const attempts = state.attempts + 1;
        const correct = isAnswerCorrect(state.selectedWordIds, task.correctWordIds);
        const taskStatuses: LessonTaskStatus[] = [...state.taskStatuses];

        if (!correct) {
          // Задание, уже отмеченное верным, повторной ошибкой не портим.
          if (taskStatuses[state.currentTaskIndex] !== 'correct') {
            taskStatuses[state.currentTaskIndex] = 'wrong';
          }
          set({ status: 'wrong', attempts, taskStatuses });
          return false;
        }

        taskStatuses[state.currentTaskIndex] = 'correct';
        set({ status: 'correct', attempts, taskStatuses });
        return true;
      },

      nextTask: () => {
        const state = get();
        if (state.status === 'completed' || state.status === 'idle') {
          return;
        }
        // «Дальше» имеет смысл только после проверки ответа.
        if (state.status !== 'correct' && state.status !== 'wrong') {
          return;
        }

        const lesson = state.currentLessonId
          ? lessonsData.find((item) => item.id === state.currentLessonId)
          : undefined;
        if (!lesson) {
          return;
        }

        // Первый проход: просто идём по заданиям вперёд, ошибки остаются красными.
        if (!state.isReviewRound && state.currentTaskIndex + 1 < lesson.tasks.length) {
          set({
            currentTaskIndex: state.currentTaskIndex + 1,
            selectedWordIds: [],
            status: 'assembling',
          });
          return;
        }

        // Круг исправления: возвращаемся на первое ошибочное задание.
        const firstWrongIndex = state.taskStatuses.findIndex((status) => status === 'wrong');
        if (firstWrongIndex !== -1) {
          set({
            isReviewRound: true,
            currentTaskIndex: firstWrongIndex,
            selectedWordIds: [],
            status: 'assembling',
          });
          return;
        }

        // Страховка: нерешённые (pending) задания нельзя оставить позади.
        const firstPendingIndex = state.taskStatuses.findIndex((status) => status === 'pending');
        if (firstPendingIndex !== -1) {
          set({
            currentTaskIndex: firstPendingIndex,
            selectedWordIds: [],
            status: 'assembling',
          });
          return;
        }

        // Все задания верны — урок пройден. XP и настроение — только за первое прохождение.
        if (!isLessonSolved(state.taskStatuses)) {
          return;
        }

        const isFirstCompletion = !state.completedLessonIds.includes(lesson.id);
        set({
          status: 'completed',
          isReviewRound: false,
          // Ползунок шкалы доезжает до конца — все слоты зелёные.
          currentTaskIndex: lesson.tasks.length - 1,
          completedLessonIds: isFirstCompletion
            ? [...state.completedLessonIds, lesson.id]
            : state.completedLessonIds,
        });

        if (isFirstCompletion) {
          const pet = usePetStore.getState();
          pet.addXp(lesson.xpReward);
          pet.applyStatDelta({ mood: LESSON_CORRECT_MOOD_GAIN });
        }
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
          currentTaskIndex: 0,
          taskStatuses: createTaskStatuses(next),
          isReviewRound: false,
        });
      },

      exitLesson: () => {
        set({ ...IDLE_SESSION });
      },

      resetProgress: () => {
        set({
          ...IDLE_SESSION,
          completedLessonIds: [],
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
