import { type ReactNode } from 'react';
import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { FROG_IDLE_FRAME, getFrogFrameStyle } from '@/components/pet/petSprites';
import { PixelButton } from '@/components/ui/PixelButton';
import { PET_CONFIG } from '@/data/petConfig';
import lessBgUrl from '@/assets/icons/less.png';
import { useLessonStore, usePetStore, useSettingsStore, useUiStore } from '@/store';
import type { Lesson, LessonTaskStatus, WordToken } from '@/types';
import { useWordChipFlip } from './useWordChipFlip';

/**
 * Общая сцена экрана урока: фон с мостиком на весь экран.
 * Внутри — flex-колонка, чтобы рабочую зону можно было прижать к низу (mt-auto).
 */
function LessonStage({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#263533]">
      <div
        className="relative mx-auto flex h-full w-full max-w-md flex-col bg-[length:100%_100%] bg-no-repeat"
        style={{ backgroundImage: `url(${lessBgUrl})` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Кнопка выхода из урока: скруглённая «Назад» с болотно-зелёным фоном
 * (как у кнопки на карте болота) и крем-брюле-стрелкой возврата.
 */
function LessonExitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Выйти из урока"
      onClick={onClick}
      className="absolute left-4 top-4 z-50 flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl border-[3px] border-[#141D1C] bg-[#3f6b38] text-[#EFE1C6] active:translate-y-[1px]"
    >
      <span aria-hidden="true" className="pb-1 font-display text-2xl leading-none">
        ‹
      </span>
    </button>
  );
}

/** Цвета сегментов шкалы прогресса по статусу задания. */
const TASK_SEGMENT_TONE: Record<LessonTaskStatus, string> = {
  pending: 'bg-[#263533]/60',
  correct: 'bg-[#7ED957]',
  wrong: 'bg-[#E05A47]',
};

/**
 * Тонкая сегментированная шкала прогресса урока в верхней панели.
 * Поверх сетки сегментов едет белый светящийся ползунок шириной 1/N трека:
 * он плавно смещается на текущее задание и возвращается на красные слоты
 * во время круга исправления ошибок.
 */
function LessonProgressBar({
  taskStatuses,
  currentTaskIndex,
  animationsEnabled,
}: {
  taskStatuses: LessonTaskStatus[];
  currentTaskIndex: number;
  animationsEnabled: boolean;
}) {
  const total = taskStatuses.length;
  if (total === 0) {
    return null;
  }

  return (
    <div className="absolute left-[72px] right-4 top-4 z-40 flex h-11 items-center">
      <div className="relative h-3 w-full rounded-full border-2 border-[#141D1C] bg-[#141D1C]/70 p-[2px]">
        <div
          className="relative grid h-full gap-1"
          style={{
            gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
          }}
        >
          {taskStatuses.map((taskStatus, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`rounded-full ${TASK_SEGMENT_TONE[taskStatus]}`}
            />
          ))}

          {/* Белый ползунок: ширина ровно 1/N трека, сдвиг — на ширину собственного шага. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#FFFDF7] shadow-[0_0_8px_rgba(255,253,247,0.85)] ring-1 ring-white transition-transform duration-300 ease-out"
            style={{
              width: `${100 / total}%`,
              transform: `translateX(${currentTaskIndex * 100}%)`,
              transition: animationsEnabled ? undefined : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Две ровные линии ответа из чередующихся чёрточек и точек (· — · —).
 * Паттерн — SVG data-URI: чёрточка 8×2, пробел 4px, точка 2×2, пробел 4px;
 * повторяется по горизонтали, поэтому линия остаётся пиксельной и не дёргается
 * при добавлении слов.
 */
const ANSWER_LINE_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='2' viewBox='0 0 18 2'%3E%3Crect width='8' height='2' fill='%23263533' fill-opacity='0.35'/%3E%3Crect x='12' width='2' height='2' fill='%23263533' fill-opacity='0.35'/%3E%3C/svg%3E\")";

/**
 * Экран прохождения урока в стиле Duolingo:
 * реплика питомца -> сборка перевода из чипов -> проверка -> обратная связь -> дальше.
 * Аудио и голосовой ввод пока недоступны (сервисы-заглушки), кнопки с пометкой «скоро».
 */
export function LessonSession({ lesson }: { lesson: Lesson }) {
  const lessons = useLessonStore((state) => state.lessons);
  const completedLessonIds = useLessonStore((state) => state.completedLessonIds);
  const selectedWordIds = useLessonStore((state) => state.selectedWordIds);
  const status = useLessonStore((state) => state.status);
  const attempts = useLessonStore((state) => state.attempts);
  const currentTaskIndex = useLessonStore((state) => state.currentTaskIndex);
  const taskStatuses = useLessonStore((state) => state.taskStatuses);
  const selectWord = useLessonStore((state) => state.selectWord);
  const removeWordAt = useLessonStore((state) => state.removeWordAt);
  const clearAnswer = useLessonStore((state) => state.clearAnswer);
  const checkAnswer = useLessonStore((state) => state.checkAnswer);
  const nextTask = useLessonStore((state) => state.nextTask);
  const nextLesson = useLessonStore((state) => state.nextLesson);
  const exitLesson = useLessonStore((state) => state.exitLesson);

  const totalXp = usePetStore((state) => state.totalXp);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const backToMenu = useUiStore((state) => state.backToMenu);

  const { playSound, vibrate } = useUiFeedback();

  // FLIP-перелёт плашек между банком слов и строкой ответа.
  const { registerChip, captureChipRects } = useWordChipFlip(selectedWordIds, animationsEnabled);

  const handleSelectWord = (wordId: string): void => {
    captureChipRects();
    playSound('tap');
    selectWord(wordId);
  };

  const handleRemoveWord = (index: number): void => {
    captureChipRects();
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
    nextTask();
  };

  const handleNextLesson = (): void => {
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

  // Сессия урока завершена: все задания решены. Отличаем «урок пройден»
  // от «пройдены все уроки» по списку завершённых уроков.
  if (status === 'completed') {
    const allLessonsCompleted = lessons.every((item) => completedLessonIds.includes(item.id));

    return (
      <LessonStage>
        <LessonExitButton onClick={handleExit} />
        <LessonProgressBar
          taskStatuses={taskStatuses}
          currentTaskIndex={currentTaskIndex}
          animationsEnabled={animationsEnabled}
        />
        <div className="my-auto px-4 py-6">
          <div className="pixel-frame bg-app-card p-5 text-center">
            <p className="text-5xl leading-none" role="img" aria-label="Радостный питомец">
              {PET_CONFIG.expressions.happy}
            </p>
            <h2 className="mt-3 font-display text-xs leading-relaxed text-app-text">
              {allLessonsCompleted ? 'Все уроки пройдены!' : 'Урок пройден!'}
            </h2>
            <p className="mt-2 font-app text-sm leading-snug text-app-hint">
              {allLessonsCompleted
                ? `Ты прошёл ${lessons.length} из ${lessons.length} уроков. Питомец гордится тобой.`
                : `Тема «${lesson.title}» закрыта. Ошибки исправлены, питомец доволен.`}
            </p>
            <p className="pixel-chip mt-3 inline-block bg-app-yellow px-2.5 py-1.5 font-display text-[12px] leading-none text-app-ink">
              Всего XP: {totalXp}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {allLessonsCompleted ? (
                <PixelButton tone="green" onClick={handleExit} className="w-full">
                  Вернуться к урокам
                </PixelButton>
              ) : (
                <PixelButton tone="green" onClick={handleNextLesson} className="w-full">
                  Следующий урок
                </PixelButton>
              )}
              <PixelButton tone="cream" onClick={handleExitToMenu} className="w-full">
                В меню
              </PixelButton>
            </div>
          </div>
        </div>
      </LessonStage>
    );
  }

  // Текущее задание урока: его реплика, перевод и банк слов.
  const task = lesson.tasks[currentTaskIndex] ?? lesson.tasks[0];
  const taskWords = task.words;
  const selectedWords = selectedWordIds
    .map((wordId) => taskWords.find((word) => word.id === wordId))
    .filter((word): word is WordToken => word !== undefined);
  const isAnswerLocked = status === 'correct' || status === 'wrong';
  const isWrong = status === 'wrong';

  return (
    <LessonStage>
      <LessonExitButton onClick={handleExit} />
      <LessonProgressBar
        taskStatuses={taskStatuses}
        currentTaskIndex={currentTaskIndex}
        animationsEnabled={animationsEnabled}
      />

      {/* Верхняя сцена: лягушка и облачко в одном flex-ряду, поэтому облачко
          всегда стоит справа от лягушки строго на уровне её рта.
          pt-… прижимает лапки лягушки к настилу мостика (мосток в фоне занимает
          ~27–32% высоты экрана), pb-… опускает рабочую зону под иллюстрацию. */}
      <div className="relative z-20 -ml-2 flex items-center gap-0 pl-0 pr-4 pb-[9vh] pt-[calc(30.5vh_-_6rem)]">
        {/* Лягушка масштаба 6 (168×96): развёрнута вправо к облачку */}
        <div
          aria-hidden="true"
          className={`shrink-0 ${animationsEnabled ? 'animate-pixel-bob' : ''}`}
        >
          <div className="-scale-x-100">
            <div
              className="sprite-frame pixelated"
              style={getFrogFrameStyle('idle', FROG_IDLE_FRAME, 6)}
            />
          </div>
        </div>

        {/* Облачко с заданием: только текст фразы, без эмодзи.
            Внешняя обёртка задаёт максимальную ширину (до правого края экрана),
            внутренний блок сам подстраивается под текст (w-fit) и переносит
            длинные фразы на несколько строк (max-w-full). */}
        <div className="relative -ml-3 min-w-0 flex-1">
          <div className="relative w-fit max-w-full rounded-2xl border-4 border-[#141D1C] bg-[#EFE1C6] px-4 py-3 text-[#141D1C]">
            {/* Хвостик облачка в тон фона и рамки — указывает на рот лягушки */}
            <span
              aria-hidden="true"
              className="absolute -left-[9px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-4 border-l-4 border-[#141D1C] bg-[#EFE1C6]"
            />
            <p className="min-w-0 font-app text-[17px] font-semibold leading-snug">
              {task.petPhrase}
            </p>
          </div>
        </div>
      </div>

      {/* Нижняя рабочая зона: три отдельных слоя — поле с линиями ответа,
          банк слов по центру и кнопки/фидбэк у нижнего края. Поле ответа сужено
          по бокам (mx-5), банк слов почти вплотную к краям (mx-1.5), нижний слой шире (px-4). */}
      <div className="relative z-10 flex flex-1 flex-col pb-8 pt-4">
        {/* Слой 1: поле ответа — линии и вписанные слова дальше от краёв (mx-5) */}
        <div className="relative mx-5 flex min-h-[104px] flex-wrap content-start items-start gap-x-2 gap-y-2.5 px-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 z-0"
          >
            <span
              className="absolute inset-x-0 top-[44px] h-[2px]"
              style={{
                backgroundImage: ANSWER_LINE_PATTERN,
                backgroundRepeat: 'repeat-x',
                backgroundSize: '18px 2px',
              }}
            />
            <span
              className="absolute inset-x-0 top-[96px] h-[2px]"
              style={{
                backgroundImage: ANSWER_LINE_PATTERN,
                backgroundRepeat: 'repeat-x',
                backgroundSize: '18px 2px',
              }}
            />
          </div>

          {/* Вписанные слова чуть опущены (top-[3px]), чтобы нижний край плашки
              ложился ровно на пунктирную линию ответа. Смещение через top,
              а не transform, чтобы не конфликтовать с FLIP-анимацией перелёта. */}
          {selectedWords.map((word, index) => (
            <button
              key={`${word.id}-${index}`}
              ref={registerChip(word.id)}
              type="button"
              disabled={isAnswerLocked}
              onClick={() => handleRemoveWord(index)}
              aria-label={`Убрать слово «${word.text}»`}
              className="relative top-[3px] z-10 flex min-h-[38px] select-none items-center rounded-xl border-2 border-[#141D1C] bg-[#EFE1C6] px-4 py-1 font-app text-sm leading-none text-[#141D1C] disabled:opacity-70"
            >
              {word.text}
            </button>
          ))}
        </div>

        {/* Слой 2: банк слов — по центру между полем ответа и нижней панелью.
            Рендерим все слова в исходном порядке, а выбранные заменяем невидимой
            «тенью» того же размера, чтобы остальные слова не сдвигались. */}
        <div className="my-auto mx-1.5 flex flex-wrap justify-center gap-x-3.5 gap-y-3.5">
          {taskWords.map((word) => {
            if (selectedWordIds.includes(word.id)) {
              return (
                <span
                  key={word.id}
                  aria-hidden="true"
                  className="pointer-events-none flex min-h-[48px] select-none items-center rounded-xl border-2 border-transparent bg-[#263533]/15 px-[18px] py-2 font-app text-base font-semibold"
                >
                  <span className="invisible">{word.text}</span>
                </span>
              );
            }
            return (
              <button
                key={word.id}
                ref={registerChip(word.id)}
                type="button"
                disabled={isAnswerLocked}
                onClick={() => handleSelectWord(word.id)}
                className="flex min-h-[48px] select-none items-center rounded-xl border-2 border-[#141D1C] bg-[#EFE1C6] px-[18px] py-2 font-app text-base font-semibold text-[#141D1C] disabled:opacity-50"
              >
                {word.text}
              </button>
            );
          })}
        </div>

        {/* Слой 3: обратная связь и кнопки — в нижней части, шире верхних слоёв */}
        <div className="flex flex-col gap-4 px-4">
          {/* Обратная связь после проверки: плашки при верном ответе нет,
              чтобы кнопка «Дальше» появлялась сразу и интерфейс не сдвигался. */}
          {isWrong && (
            <div role="status" className="pixel-frame bg-app-card px-3 py-2.5">
              <p className="inline-block bg-app-danger px-2 py-1 font-display text-[12px] leading-none text-app-ink">
                Пока неверно
              </p>
              <p className="mt-1.5 font-app text-xs text-app-hint">
                Попытка {attempts}. Попробуй ещё раз или посмотри правильный перевод.
              </p>
              <p className="mt-1 font-app text-xs text-app-text">
                Правильный перевод: {task.translation}
              </p>
            </div>
          )}

          {/* Управление: после проверки всегда можно идти дальше. При неверном
              ответе слот остаётся красным, а «Попробовать снова» даёт исправить
              его сразу (или в конце — в круге исправления ошибок). */}
          {isAnswerLocked ? (
            <div className="space-y-2">
              <PixelButton tone="green" onClick={handleNext} className="w-full">
                <span className="flex items-center justify-center gap-1.5">
                  Дальше
                  <span
                    aria-hidden="true"
                    className="h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-current"
                  />
                </span>
              </PixelButton>
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
                className={`pixel-btn flex min-h-[52px] flex-1 select-none items-center justify-center rounded-md px-2 font-app text-sm font-bold ${
                  selectedWords.length === 0
                    ? 'border-2 border-[#6E7D78] bg-[#D6D2C4] text-[#57635F] shadow-[0_3px_0_#6E7D78]'
                    : 'bg-app-card text-app-text'
                }`}
              >
                Очистить
              </button>
              <button
                type="button"
                onClick={handleCheck}
                disabled={selectedWords.length === 0}
                className={`pixel-btn flex min-h-[52px] flex-[2] select-none items-center justify-center rounded-md px-2 font-app text-base font-bold ${
                  selectedWords.length === 0
                    ? 'border-2 border-[#6E7D78] bg-[#D6D2C4] text-[#57635F] shadow-[0_3px_0_#6E7D78]'
                    : 'bg-app-accent text-app-accent-contrast'
                }`}
              >
                Проверить
              </button>
            </div>
          )}
        </div>
      </div>
    </LessonStage>
  );
}
