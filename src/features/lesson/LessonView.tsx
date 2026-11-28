import { useLessonStore } from '@/store';
import { LessonSession } from './LessonSession';
import { SwampMap } from './SwampMap';

/**
 * Модуль уроков:
 *  - если урок запущен (в lessonStore есть currentLessonId и такой урок найден) —
 *    показываем экран прохождения урока;
 *  - если нет — карту болота с прогрессом.
 */
export function LessonView() {
  const currentLesson = useLessonStore((state) =>
    state.currentLessonId === null
      ? undefined
      : state.lessons.find((lesson) => lesson.id === state.currentLessonId),
  );

  // Урок запущен — показываем экран прохождения, иначе — карту болота.
  return currentLesson === undefined ? <SwampMap /> : <LessonSession lesson={currentLesson} />;
}
