import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { PixelButton } from '@/components/ui/PixelButton';
import { PET_CONFIG } from '@/data/petConfig';
import { useLessonStore, usePetStore, useSettingsStore, useUiStore } from '@/store';
import type { WordToken } from '@/types';

/**
 * Урок в стиле Duolingo на lessonStore:
 * реплика питомца -> сборка перевода из чипов -> проверка -> обратная связь -> дальше.
 * Аудио и голосовой ввод пока недоступны (сервисы-заглушки), кнопки с пометкой «скоро».
 * Пиксельный ретро-стиль: ink-рамки, жёсткие тени, font-display для заголовков и чисел.
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
      <div className="pixel-frame bg-app-card p-6 text-center">
        <p className="text-3xl leading-none" aria-hidden="true">🗂️</p>
        <p className="mt-3 font-display text-[10px] leading-relaxed text-app-text">
          Уроки пока не загружены
        </p>
        <p className="mt-2 font-app text-xs text-app-hint">Загляни сюда чуть позже.</p>
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
      <div className="pixel-frame bg-app-card p-5 text-center">
        <p className="text-5xl leading-none" role="img" aria-label="Радостный питомец">
          {PET_CONFIG.expressions.happy}
        </p>
        <h2 className="mt-3 font-display text-xs leading-relaxed text-app-text">
          Все уроки пройдены!
        </h2>
        <p className="mt-2 font-app text-sm leading-snug text-app-hint">
          Ты прошёл {lessons.length} из {lessons.length} уроков. Питомец гордится тобой.
        </p>
        <p className="pixel-chip mt-3 inline-block bg-app-yellow px-2.5 py-1.5 font-display text-[9px] leading-none text-app-ink">
          Всего XP: {totalXp}
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <PixelButton tone="green" onClick={handleExit} className="w-full">
            Вернуться к урокам
          </PixelButton>
          <PixelButton tone="cream" onClick={handleExitToMenu} className="w-full">
            В меню
          </PixelButton>
        </div>
      </div>
    );
  }

  // Урок не выбран: список уроков и прогресс.
  if (currentLesson === undefined) {
    return (
      <div className="space-y-3">
        <header className="space-y-1">
          <h2 className="font-display text-xs leading-relaxed text-app-text">Уроки</h2>
          <p className="font-app text-[11px] leading-snug text-app-hint">
            Собери перевод фразы из слов и получи XP.
          </p>
        </header>

        <div className="pixel-frame flex items-start gap-3 bg-app-card p-3">
          <span
            className={`text-4xl leading-none ${animationsEnabled ? 'animate-float' : ''}`}
            role="img"
            aria-label="Питомец"
          >
            {PET_CONFIG.expressions[petExpression]}
          </span>
          <p className="pixel-frame-sm min-w-0 flex-1 bg-app-screen px-3 py-2 font-app text-sm font-semibold leading-snug text-app-ink">
            Выбери урок — и начнём! Каждый пройденный урок приносит XP и поднимает настроение.
          </p>
        </div>

        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-app text-xs text-app-hint">
          Пройдено уроков:
          <span className="font-display text-[10px] text-app-text">{completedCount}</span>
          из
          <span className="font-display text-[10px] text-app-text">{lessons.length}</span>
          ·
          <span className="font-display text-[10px] text-app-text">{totalXp} XP</span>
        </p>

        {allCompleted && (
          <div className="pixel-frame-sm bg-app-accent-soft px-3 py-2 font-app text-xs font-semibold text-app-text">
            🏆 Все уроки пройдены — можно повторить любой из них.
          </div>
        )}

        <ul className="space-y-2.5">
          {lessons.map((lesson, index) => {
            const isDone = completedLessonIds.includes(lesson.id);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => handleStart(lesson.id)}
                  className="pixel-btn-sm flex min-h-[64px] w-full select-none items-center gap-3 bg-app-card px-3 py-2.5 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'flex h-10 w-10 shrink-0 items-center justify-center border-2 border-app-ink',
                      'font-display text-[11px] leading-none',
                      isDone
                        ? 'bg-app-accent text-app-accent-contrast'
                        : 'bg-app-screen text-app-ink',
                    ].join(' ')}
                  >
                    {isDone ? '✓' : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-app text-sm font-bold text-app-text">
                      {lesson.title}
                    </span>
                    <span className="mt-0.5 block truncate font-app text-[11px] text-app-hint">
                      {lesson.petPhrase}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-[8px] leading-relaxed text-app-hint">
                    {isDone ? 'Пройден' : `+${lesson.xpReward} XP`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {allCompleted && (
          <PixelButton tone="cream" onClick={() => handleStart()} className="w-full">
            Повторить с начала
          </PixelButton>
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
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-[10px] leading-relaxed text-app-text">
            Урок {lessonNumber} из {lessons.length}
          </h2>
          <p className="mt-1 truncate font-app text-[11px] text-app-hint">{lesson.title}</p>
        </div>
        <span className="pixel-chip shrink-0 bg-app-yellow px-2 py-1.5 font-display text-[9px] leading-none text-app-ink">
          +{lesson.xpReward} XP
        </span>
      </header>

      {/* Карточка питомца с репликой и заданием */}
      <div className="pixel-frame flex items-start gap-3 bg-app-card p-3">
        <span
          className={`text-4xl leading-none ${animationsEnabled ? 'animate-float' : ''}`}
          role="img"
          aria-label="Питомец"
        >
          {petEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="pixel-frame-sm bg-app-screen px-3 py-2 font-app text-sm font-semibold leading-snug text-app-ink">
            {lesson.petPhrase}
          </p>
          <p className="mt-1.5 font-app text-[11px] leading-snug text-app-hint">
            {lesson.instruction}
          </p>
        </div>
      </div>

      {/* Аудио и голос пока недоступны: сервисы-заглушки, кнопки выключены. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          title="Озвучка появится в следующих версиях"
          className="pixel-frame-sm flex min-h-[44px] select-none items-center justify-center gap-1 bg-app-card px-2 font-app text-[11px] font-semibold text-app-hint opacity-70"
        >
          <span aria-hidden="true">🔊</span> Прослушать
          <span className="border border-app-ink px-1 py-0.5 font-display text-[8px] uppercase leading-none">
            скоро
          </span>
        </button>
        <button
          type="button"
          disabled
          title="Голосовой ввод появится в следующих версиях"
          className="pixel-frame-sm flex min-h-[44px] select-none items-center justify-center gap-1 bg-app-card px-2 font-app text-[11px] font-semibold text-app-hint opacity-70"
        >
          <span aria-hidden="true">🎙️</span> Голосом
          <span className="border border-app-ink px-1 py-0.5 font-display text-[8px] uppercase leading-none">
            скоро
          </span>
        </button>
      </div>

      {/* Трей ответа: тап по слову убирает его из ответа */}
      <div>
        <p className="mb-1.5 font-display text-[8px] uppercase leading-relaxed text-app-hint">
          Твой ответ
        </p>
        <div className="pixel-frame-sm min-h-[68px] bg-app-screen p-2">
          {selectedWords.length === 0 ? (
            <p className="px-1 py-2 font-app text-[11px] text-app-ink">
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
                  className="pixel-chip flex min-h-[44px] select-none items-center bg-app-card px-2.5 py-1.5 font-app text-sm text-app-text disabled:opacity-70"
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
        <p className="mb-1.5 font-display text-[8px] uppercase leading-relaxed text-app-hint">
          Банк слов
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableWords.map((word) => (
            <button
              key={word.id}
              type="button"
              disabled={isAnswerLocked}
              onClick={() => handleSelectWord(word.id)}
              className="pixel-chip flex min-h-[44px] select-none items-center bg-app-card px-3 py-1.5 font-app text-sm font-semibold text-app-text disabled:opacity-50"
            >
              {word.text}
            </button>
          ))}
        </div>
      </div>

      {/* Обратная связь после проверки */}
      {isCorrect && (
        <div role="status" className="pixel-frame bg-app-accent-soft px-3 py-2.5">
          <p className="inline-block bg-app-accent px-2 py-1 font-display text-[9px] leading-none text-app-accent-contrast">
            Верно! 🎉
          </p>
          <p className="mt-1.5 font-app text-xs text-app-hint">+{lesson.xpReward} XP питомцу</p>
          <p className="mt-1 font-app text-xs text-app-text">
            Правильный перевод: {lesson.translation}
          </p>
        </div>
      )}
      {isWrong && (
        <div role="status" className="pixel-frame bg-app-card px-3 py-2.5">
          <p className="inline-block bg-app-danger px-2 py-1 font-display text-[9px] leading-none text-app-ink">
            Пока неверно
          </p>
          <p className="mt-1.5 font-app text-xs text-app-hint">
            Попытка №{attempts}. Попробуй ещё раз или посмотри правильный перевод.
          </p>
          <p className="mt-1 font-app text-xs text-app-text">
            Правильный перевод: {lesson.translation}
          </p>
        </div>
      )}

      {/* Управление: проверить / очистить либо дальше / повторить */}
      {isAnswerLocked ? (
        <div className="space-y-2">
          {/* При неверном ответе «Дальше» не показываем: урок нельзя пропустить,
              нужно собрать ответ заново. */}
          {isCorrect && (
            <PixelButton tone="green" onClick={handleNext} className="w-full">
              Дальше →
            </PixelButton>
          )}
          {isWrong && (
            <PixelButton tone="yellow" onClick={handleRetry} className="w-full">
              Попробовать снова
            </PixelButton>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={selectedWords.length === 0}
            className="pixel-btn flex min-h-[52px] flex-1 select-none items-center justify-center bg-app-card px-2 font-app text-sm font-bold text-app-text disabled:opacity-50"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedWords.length === 0}
            className="pixel-btn flex min-h-[52px] flex-[2] select-none items-center justify-center bg-app-accent px-2 font-app text-base font-bold text-app-accent-contrast disabled:opacity-50"
          >
            Проверить
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleExit}
        className="flex min-h-[44px] w-full select-none items-center justify-center font-app text-xs font-semibold text-app-hint underline underline-offset-2"
      >
        ← Выйти из урока
      </button>
    </div>
  );
}
