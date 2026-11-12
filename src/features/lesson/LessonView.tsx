import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { PET_CONFIG } from '@/data/petConfig';
import { useLessonStore, usePetStore, useSettingsStore, useUiStore } from '@/store';
import type { WordToken } from '@/types';

/**
 * Урок в стиле Duolingo на lessonStore:
 * реплика питомца -> сборка перевода из чипов -> проверка -> обратная связь -> дальше.
 * Аудио и голосовой ввод пока недоступны (сервисы-заглушки), кнопки с пометкой «скоро».
 */
export function LessonView() {
  const lessons = useLessonStore((state) => state.lessons);
  const currentLessonId = useLessonStore((state) => state.currentLessonId);
  const selectedWordIds = useLessonStore((state) => state.selectedWordIds);
  const status = useLessonStore((state) => state.status);
  const attempts = useLessonStore((state) => state.attempts);
  const completedLessonIds = useLessonStore((state) => state.completedLessonIds);
  const startLesson = useLessonStore((state) => state.startLesson);
  const selectWord = useLessonStore((state) => state.selectWord);
  const removeWordAt = useLessonStore((state) => state.removeWordAt);
  const clearAnswer = useLessonStore((state) => state.clearAnswer);
  const checkAnswer = useLessonStore((state) => state.checkAnswer);
  const nextLesson = useLessonStore((state) => state.nextLesson);
  const exitLesson = useLessonStore((state) => state.exitLesson);

  const totalXp = usePetStore((state) => state.totalXp);
  const petExpression = usePetStore((state) => state.expression);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const backToMenu = useUiStore((state) => state.backToMenu);

  const { playSound, vibrate } = useUiFeedback();

  const handleStart = (lessonId?: string): void => {
    playSound('tap');
    vibrate('light');
    startLesson(lessonId);
  };

  const handleSelectWord = (wordId: string): void => {
    playSound('tap');
    selectWord(wordId);
  };

  const handleRemoveWord = (index: number): void => {
    vibrate('light');
    removeWordAt(index);
  };

  const handleClear = (): void => {
    playSound('tap');
    clearAnswer();
  };

  const handleCheck = (): void => {
    const isCorrectNow = checkAnswer();
    playSound(isCorrectNow ? 'correct' : 'wrong');
    vibrate(isCorrectNow ? 'success' : 'error');
  };

  const handleNext = (): void => {
    playSound('tap');
    nextLesson();
  };

  const handleRetry = (): void => {
    playSound('tap');
    vibrate('light');
    clearAnswer();
  };

  const handleExit = (): void => {
    playSound('tap');
    exitLesson();
  };

  const handleExitToMenu = (): void => {
    playSound('tap');
    exitLesson();
    backToMenu();
  };

  // Защита от пустого каталога уроков (мок-данные всегда непустые, но кейс дешёвый).
  if (lessons.length === 0) {
    return (
      <div className="rounded-app border border-app-border bg-app-bg p-6 text-center shadow-app">
        <p className="text-3xl" aria-hidden="true">🗂️</p>
        <p className="mt-2 text-sm font-semibold text-app-text">Уроки пока не загружены</p>
        <p className="mt-1 text-xs text-app-hint">Загляни сюда чуть позже.</p>
      </div>
    );
  }

  const completedCount = completedLessonIds.filter((id) =>
    lessons.some((lesson) => lesson.id === id),
  ).length;
  const allCompleted = completedCount >= lessons.length;
  const currentLesson =
    currentLessonId === null
      ? undefined
      : lessons.find((lesson) => lesson.id === currentLessonId);

  // Все уроки пройдены: lessonStore перевёл сессию в статус completed.
  if (status === 'completed') {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-app border border-app-border bg-app-bg p-6 shadow-app">
          <p className="text-5xl" role="img" aria-label="Радостный питомец">
            {PET_CONFIG.expressions.happy}
          </p>
          <h2 className="mt-2 text-lg font-bold text-app-text">Все уроки пройдены!</h2>
          <p className="mt-1 text-sm leading-snug text-app-hint">
            Ты прошёл {lessons.length} из {lessons.length} уроков. Питомец гордится тобой.
          </p>
          <p className="mt-2 text-sm font-bold text-app-accent">Всего XP: {totalXp}</p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExit}
              className="w-full rounded-app bg-app-accent px-4 py-3 text-sm font-bold text-app-accent-contrast active:scale-[0.99]"
            >
              Вернуться к урокам
            </button>
            <button
              type="button"
              onClick={handleExitToMenu}
              className="w-full rounded-app border border-app-border bg-app-card px-4 py-3 text-sm font-semibold text-app-text active:scale-[0.99]"
            >
              В меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Урок не выбран: список уроков и прогресс.
  if (currentLesson === undefined) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-bold text-app-text">Уроки</h2>
          <p className="text-sm text-app-hint">Собери перевод фразы из слов и получи XP.</p>
        </header>

        <div className="flex items-start gap-3 rounded-app border border-app-border bg-app-bg p-3 shadow-app">
          <span
            className={`text-4xl leading-none ${animationsEnabled ? 'animate-float' : ''}`}
            role="img"
            aria-label="Питомец"
          >
            {PET_CONFIG.expressions[petExpression]}
          </span>
          <p className="min-w-0 flex-1 rounded-app-sm bg-app-card px-3 py-2 text-sm font-semibold text-app-text shadow-app">
            Выбери урок — и начнём! Каждый пройденный урок приносит XP и поднимает настроение.
          </p>
        </div>

        <p className="text-xs font-semibold text-app-hint">
          Пройдено уроков: {completedCount} из {lessons.length} · {totalXp} XP
        </p>

        {allCompleted && (
          <div className="rounded-app-sm border border-app-success bg-app-card px-3 py-2 text-xs font-semibold text-app-success shadow-app">
            🏆 Все уроки пройдены — можно повторить любой из них.
          </div>
        )}

        <ul className="space-y-2">
          {lessons.map((lesson, index) => {
            const isDone = completedLessonIds.includes(lesson.id);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => handleStart(lesson.id)}
                  className="flex w-full items-center gap-3 rounded-app border border-app-border bg-app-bg px-3 py-3 text-left shadow-app active:scale-[0.99]"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-app-sm border text-sm font-bold ${
                      isDone
                        ? 'border-app-success text-app-success'
                        : 'border-app-border bg-app-accent-soft text-app-accent'
                    }`}
                  >
                    {isDone ? '✓' : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-app-text">{lesson.title}</span>
                    <span className="block truncate text-[11px] text-app-hint">
                      {lesson.petPhrase}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-app-hint">
                    {isDone ? 'Пройден' : `+${lesson.xpReward} XP`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {allCompleted && (
          <button
            type="button"
            onClick={() => handleStart()}
            className="w-full rounded-app border border-app-border bg-app-card px-4 py-3 text-sm font-semibold text-app-text active:scale-[0.99]"
          >
            Повторить с начала
          </button>
        )}
      </div>
    );
  }

  // Активный урок.
  const lesson = currentLesson;
  const lessonNumber = lessons.findIndex((item) => item.id === lesson.id) + 1;
  const selectedWords = selectedWordIds
    .map((wordId) => lesson.words.find((word) => word.id === wordId))
    .filter((word): word is WordToken => word !== undefined);
  const availableWords = lesson.words.filter((word) => !selectedWordIds.includes(word.id));
  const isAnswerLocked = status === 'correct' || status === 'wrong';
  const isCorrect = status === 'correct';
  const isWrong = status === 'wrong';
  const petEmoji = isCorrect
    ? PET_CONFIG.expressions.happy
    : isWrong
      ? PET_CONFIG.expressions.sad
      : PET_CONFIG.expressions[petExpression];

  return (
    <div className="space-y-3.5">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-app-text">
            Урок {lessonNumber} из {lessons.length}
          </h2>
          <p className="truncate text-xs text-app-hint">{lesson.title}</p>
        </div>
        <span className="shrink-0 rounded-full border border-app-border bg-app-card px-2.5 py-1 text-[11px] font-bold text-app-accent shadow-app">
          +{lesson.xpReward} XP
        </span>
      </header>

      {/* Карточка питомца с репликой и заданием */}
      <div className="flex items-start gap-3 rounded-app border border-app-border bg-app-bg p-3 shadow-app">
        <span
          className={`text-4xl leading-none ${animationsEnabled ? 'animate-float' : ''}`}
          role="img"
          aria-label="Питомец"
        >
          {petEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="rounded-app-sm bg-app-card px-3 py-2 text-sm font-semibold leading-snug text-app-text shadow-app">
            {lesson.petPhrase}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-app-hint">{lesson.instruction}</p>
        </div>
      </div>

      {/* Аудио и голос пока недоступны: сервисы-заглушки, кнопки выключены. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          title="Озвучка появится в следующих версиях"
          className="flex items-center justify-center gap-1.5 rounded-app-sm border border-app-border bg-app-card px-2 py-2 text-[11px] font-semibold text-app-hint opacity-70"
        >
          <span aria-hidden="true">🔊</span> Прослушать
          <span className="rounded-full border border-app-border px-1.5 py-0.5 text-[9px] uppercase">
            скоро
          </span>
        </button>
        <button
          type="button"
          disabled
          title="Голосовой ввод появится в следующих версиях"
          className="flex items-center justify-center gap-1.5 rounded-app-sm border border-app-border bg-app-card px-2 py-2 text-[11px] font-semibold text-app-hint opacity-70"
        >
          <span aria-hidden="true">🎙️</span> Голосом
          <span className="rounded-full border border-app-border px-1.5 py-0.5 text-[9px] uppercase">
            скоро
          </span>
        </button>
      </div>

      {/* Трей ответа: тап по слову убирает его из ответа */}
      <div>
        <p className="mb-1 text-[11px] font-semibold text-app-hint">Твой ответ</p>
        <div className="min-h-[56px] rounded-app-sm border border-dashed border-app-border bg-app-bg p-2">
          {selectedWords.length === 0 ? (
            <p className="px-1 py-2 text-xs text-app-hint">
              Нажми на слова ниже, чтобы собрать перевод
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedWords.map((word, index) => (
                <button
                  key={`${word.id}-${index}`}
                  type="button"
                  disabled={isAnswerLocked}
                  onClick={() => handleRemoveWord(index)}
                  aria-label={`Убрать слово «${word.text}»`}
                  className="rounded-full border border-app-border bg-app-card px-3 py-1.5 text-sm text-app-text shadow-app active:scale-95 disabled:opacity-70"
                >
                  {word.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Банк слов: тап добавляет слово в ответ */}
      <div>
        <p className="mb-1 text-[11px] font-semibold text-app-hint">Банк слов</p>
        <div className="flex flex-wrap gap-1.5">
          {availableWords.map((word) => (
            <button
              key={word.id}
              type="button"
              disabled={isAnswerLocked}
              onClick={() => handleSelectWord(word.id)}
              className="rounded-full border border-app-border bg-app-card px-3 py-1.5 text-sm font-medium text-app-text shadow-app active:scale-95 disabled:opacity-50"
            >
              {word.text}
            </button>
          ))}
        </div>
      </div>

      {/* Обратная связь после проверки */}
      {isCorrect && (
        <div
          role="status"
          className="rounded-app-sm border border-app-success bg-app-card px-3 py-2.5 shadow-app"
        >
          <p className="text-sm font-bold text-app-success">Верно! 🎉</p>
          <p className="mt-0.5 text-xs text-app-hint">+{lesson.xpReward} XP питомцу</p>
          <p className="mt-1 text-xs text-app-text">Правильный перевод: {lesson.translation}</p>
        </div>
      )}
      {isWrong && (
        <div
          role="status"
          className="rounded-app-sm border border-app-danger bg-app-card px-3 py-2.5 shadow-app"
        >
          <p className="text-sm font-bold text-app-danger">Пока неверно</p>
          <p className="mt-0.5 text-xs text-app-hint">
            Попытка №{attempts}. Попробуй ещё раз или посмотри правильный перевод.
          </p>
          <p className="mt-1 text-xs text-app-text">Правильный перевод: {lesson.translation}</p>
        </div>
      )}

      {/* Управление: проверить / очистить либо дальше / повторить */}
      {isAnswerLocked ? (
        <div className="space-y-2">
          {/* При неверном ответе «Дальше» не показываем: урок нельзя пропустить,
              нужно собрать ответ заново. */}
          {isCorrect && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-app bg-app-accent px-4 py-3 text-sm font-bold text-app-accent-contrast active:scale-[0.99]"
            >
              Дальше →
            </button>
          )}
          {isWrong && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full rounded-app border border-app-border bg-app-card px-4 py-3 text-sm font-semibold text-app-text active:scale-[0.99]"
            >
              Попробовать снова
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={selectedWords.length === 0}
            className="flex-1 rounded-app border border-app-border bg-app-bg px-4 py-3 text-sm font-semibold text-app-text active:scale-[0.99] disabled:opacity-50"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedWords.length === 0}
            className="flex-[2] rounded-app bg-app-accent px-4 py-3 text-sm font-bold text-app-accent-contrast active:scale-[0.99] disabled:opacity-50"
          >
            Проверить
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleExit}
        className="w-full py-1 text-center text-xs font-semibold text-app-hint underline underline-offset-2"
      >
        ← Выйти из урока
      </button>
    </div>
  );
}
