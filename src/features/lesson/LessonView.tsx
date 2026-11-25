import { Fragment, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { FROG_IDLE_FRAME, getFrogFrameStyle } from '@/components/pet/petSprites';
import { PixelButton } from '@/components/ui/PixelButton';
import { PET_CONFIG } from '@/data/petConfig';
import lessBgUrl from '@/assets/icons/less.png';
import lilyActiveUrl from '@/assets/icons/lily-active.png';
import lilyDefaultUrl from '@/assets/icons/lily-default.png';
import lilyLockedUrl from '@/assets/icons/lily-locked.png';
import lockUrl from '@/assets/icons/lock.png';
import nodeCoinsUrl from '@/assets/icons/node-coins.png';
import nodeLootUrl from '@/assets/icons/node-loot.png';
import reedsUrl from '@/assets/icons/reeds.png';
import starGrayUrl from '@/assets/icons/star-gray.png';
import starYellowUrl from '@/assets/icons/star-yellow.png';
import swampBgUrl from '@/assets/icons/swamp-bg.jpg';
import { useLessonStore, usePetStore, useSettingsStore, useUiStore } from '@/store';
import type { Lesson, WordToken } from '@/types';

/**
 * Модуль уроков:
 *  - если урок запущен (в lessonStore есть currentLessonId и такой урок найден) —
 *    показываем экран прохождения урока;
 *  - если нет — карту болота с прогрессом.
 *
 * Карта строится по реальному прогрессу: пройденные уроки (index < activeIndex) —
 * кувшинка с тремя звёздами, текущий (index === activeIndex) — активная кувшинка
 * с лягушкой, остальные — заблокированные с замком. Линия пути рассчитывается
 * динамически по тем же координатам, что и узлы.
 */

/** Три звезды над пройденным узлом: заполненные жёлтые и пустые серые. */
function StarRow({ filled }: { filled: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-4 left-1/2 flex w-max -translate-x-[55%] items-end gap-1"
    >
      {[0, 1, 2].map((index) => (
        <img
          key={index}
          src={index < filled ? starYellowUrl : starGrayUrl}
          alt=""
          className="h-5 w-5 shrink-0 object-contain"
        />
      ))}
    </div>
  );
}

/**
 * X-координата центра узла в контейнере w-72 (288px).
 * 3-й урок (index === 2) стоит ровно по центру, остальные чередуются змейкой:
 * 104 (влево) — 184 (вправо) — 144 (центр) — 104 (влево) — 184 (вправо) ...
 */
function getNodeX(index: number): 104 | 144 | 184 {
  if (index === 2) {
    return 144;
  }
  const isLeft = index < 2 ? index % 2 === 0 : index % 2 === 1;
  return isLeft ? 104 : 184;
}

/** Tailwind-смещение узла, совпадающее с его X-координатой из getNodeX. */
function getNodeOffsetClass(index: number): string {
  const x = getNodeX(index);
  if (x === 144) {
    return 'translate-x-0';
  }
  return x === 104 ? '-translate-x-10' : 'translate-x-10';
}

/** Карта болота: змейка узлов по прогрессу + боковые награды у 3-го урока. */
function SwampMap() {
  const lessons = useLessonStore((state) => state.lessons);
  const completedLessonIds = useLessonStore((state) => state.completedLessonIds);
  const startLesson = useLessonStore((state) => state.startLesson);

  // Первый непройденный урок — текущий. Если все уроки пройдены, findIndex вернёт -1,
  // и activeIndex становится lessons.length: активного узла нет, все узлы пройдены.
  const activeIndex = useMemo(() => {
    const found = lessons.findIndex((lesson) => !completedLessonIds.includes(lesson.id));
    return found === -1 ? lessons.length : found;
  }, [lessons, completedLessonIds]);

  // Зигзаг: центры кувшинок по вертикали — 40 + index * 100 (h-20 + gap-y-5),
  // по горизонтали — getNodeX. У 3-го урока добавляем горизонтальную ветку
  // от боковой кувшинки «+МОНЕТЫ» (x = 40) до «+ЛУТ» (x = 248).
  const pathD = useMemo(() => {
    const nodes = lessons
      .map((_, index) => {
        const x = getNodeX(index);
        const chapterOffset = index > 3 ? 84 : 0;
        const y = 40 + index * 100 + chapterOffset;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    const sideBranch = `M 40 ${40 + 2 * 100} H 248`;
    return lessons.length > 2 ? `${nodes} ${sideBranch}` : nodes;
  }, [lessons]);

  const activeNodeRef = useRef<HTMLButtonElement | null>(null);

  // При открытии карты сразу показываем текущий урок, не дожидаясь скролла пользователя.
  useEffect(() => {
    activeNodeRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#2f6b5c]"
      aria-label="Карта главы"
    >
      <div
        className="relative min-h-full w-full bg-cover bg-center bg-repeat-y pb-10"
        style={{ backgroundImage: `url(${swampBgUrl})` }}
      >
        {/* Шапка: назад + название главы в пиксельной рамке */}
        <header className="sticky top-0 z-20 flex items-center gap-2 px-3 pb-2 pt-3">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => useUiStore.getState().backToMenu()}
            className="pixel-frame-sm flex h-11 w-11 shrink-0 select-none items-center justify-center bg-[#3f6b38] pb-1 font-display text-2xl leading-none text-[#f2edb4]"
          >
            ‹
          </button>
          <h1 className="pixel-frame min-w-0 flex-1 bg-[#3f6b38] px-3 py-2.5 text-center font-display text-[13px] uppercase leading-none tracking-wide text-[#f2edb4]">
            Глава 1: Приветствия
          </h1>
        </header>

        {/* Карта: узлы в контейнере фиксированной ширины, чтобы путь не разъезжался на экранах */}
        <div className="relative mx-auto w-full max-w-[420px] px-4 pb-8 pt-10">
          {/* Болотные декорации по краям карты */}
          <img
            src={reedsUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 left-0 z-0 h-28 w-auto opacity-90"
          />
          <img
            src={reedsUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 right-0 z-0 h-24 w-auto -scale-x-100 opacity-90"
          />

          <div className="relative mx-auto w-72">
            {/* Белая пунктирная змейка по центрам кувшинок + ветка наград у 3-го урока */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            >
              <path
                d={pathD}
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="6,6"
                strokeLinecap="round"
              />
            </svg>

            <div className="relative flex flex-col items-center gap-y-5">
              {lessons.map((lesson, index) => {
                const isCompleted = index < activeIndex;
                const isActive = index === activeIndex;
                const isLocked = index > activeIndex;
                const isClickable = index <= activeIndex;

                return (
                  <Fragment key={lesson.id}>
                    <div className="relative z-10 flex h-20 w-full items-center justify-center">
                      {/* Боковые кувшинки-награды у 3-го урока: слева монеты, справа лут */}
                      {index === 2 && (
                        <>
                          <div className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                            <img
                              src={nodeCoinsUrl}
                              alt=""
                              aria-hidden="true"
                              className="h-20 w-20 object-contain"
                            />
                            <span className="mt-1 whitespace-nowrap font-display text-[11px] leading-none text-[#ffe08a]">
                              +МОНЕТЫ
                            </span>
                          </div>
                          <div className="pointer-events-none absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                            <img
                              src={nodeLootUrl}
                              alt=""
                              aria-hidden="true"
                              className="h-20 w-20 object-contain"
                            />
                            <span className="mt-1 whitespace-nowrap font-display text-[11px] leading-none text-[#ff9d6e]">
                              +ЛУТ
                            </span>
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        ref={isActive ? activeNodeRef : undefined}
                        disabled={!isClickable}
                        onClick={isClickable ? () => startLesson(lesson.id) : undefined}
                        aria-label={
                          isCompleted
                            ? `${lesson.title}: пройден`
                            : isActive
                              ? `${lesson.title}: текущий урок`
                              : `${lesson.title}: урок заблокирован`
                        }
                        className={`relative h-20 w-20 shrink-0 ${getNodeOffsetClass(index)} ${
                          isClickable ? 'cursor-pointer' : ''
                        }`}
                      >
                        {/* Пройденный урок: кувшинка и три звезды над ней */}
                        {isCompleted && (
                          <>
                            <StarRow filled={3} />
                            <img
                              src={lilyDefaultUrl}
                              alt=""
                              className="h-20 w-20 object-contain"
                            />
                          </>
                        )}

                        {/* Текущий урок: активная кувшинка, лягушка строго по центру */}
                        {isActive && (
                          <>
                            <img
                              src={lilyActiveUrl}
                              alt=""
                              className="h-20 w-20 object-contain"
                            />
                            {/* Лягушка — готовый спрайт питомца: масштаб 3 (84×48 px). */}
                            <div className="pointer-events-none absolute inset-0 flex -translate-y-2 items-center justify-center">
                              <div
                                aria-hidden="true"
                                className="sprite-frame pixelated"
                                style={getFrogFrameStyle('idle', FROG_IDLE_FRAME, 3)}
                              />
                            </div>
                          </>
                        )}

                        {/* Заблокированный урок: закрытая кувшинка и замок по центру */}
                        {isLocked && (
                          <>
                            <img src={lilyLockedUrl} alt="" className="h-20 w-20 object-contain" />
                            <img
                              src={lockUrl}
                              alt=""
                              className="absolute left-1/2 top-1/2 h-12 w-auto -translate-x-1/2 -translate-y-1/2"
                            />
                          </>
                        )}
                      </button>
                    </div>

                    {index === 3 && (
                      <div className="relative z-10 flex h-16 w-full items-center justify-center gap-2">
                        <div className="h-0.5 flex-1 border-t-2 border-dashed border-white/40" />
                        <span className="pixel-chip bg-app-panel px-2 py-1.5 font-display text-[11px] uppercase text-app-panel-text">
                          Глава 2: Путешествия
                        </span>
                        <div className="h-0.5 flex-1 border-t-2 border-dashed border-white/40" />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

/** Кнопка выхода из урока: стиль кнопки «Назад» с карты, крестик в левом верхнем углу. */
function LessonExitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Выйти из урока"
      onClick={onClick}
      className="pixel-frame-sm absolute left-4 top-4 z-50 flex h-11 w-11 shrink-0 select-none items-center justify-center bg-[#3f6b38] pb-1 font-display text-2xl leading-none text-[#f2edb4]"
    >
      ✕
    </button>
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
function LessonSession({ lesson }: { lesson: Lesson }) {
  const lessons = useLessonStore((state) => state.lessons);
  const selectedWordIds = useLessonStore((state) => state.selectedWordIds);
  const status = useLessonStore((state) => state.status);
  const attempts = useLessonStore((state) => state.attempts);
  const selectWord = useLessonStore((state) => state.selectWord);
  const removeWordAt = useLessonStore((state) => state.removeWordAt);
  const clearAnswer = useLessonStore((state) => state.clearAnswer);
  const checkAnswer = useLessonStore((state) => state.checkAnswer);
  const nextLesson = useLessonStore((state) => state.nextLesson);
  const exitLesson = useLessonStore((state) => state.exitLesson);

  const totalXp = usePetStore((state) => state.totalXp);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const backToMenu = useUiStore((state) => state.backToMenu);

  const { playSound, vibrate } = useUiFeedback();

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

  // Все уроки пройдены: lessonStore перевёл сессию в статус completed.
  if (status === 'completed') {
    return (
      <LessonStage>
        <LessonExitButton onClick={handleExit} />
        <div className="my-auto px-4 py-6">
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
            <p className="pixel-chip mt-3 inline-block bg-app-yellow px-2.5 py-1.5 font-display text-[12px] leading-none text-app-ink">
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
        </div>
      </LessonStage>
    );
  }

  const selectedWords = selectedWordIds
    .map((wordId) => lesson.words.find((word) => word.id === wordId))
    .filter((word): word is WordToken => word !== undefined);
  const isAnswerLocked = status === 'correct' || status === 'wrong';
  const isCorrect = status === 'correct';
  const isWrong = status === 'wrong';

  return (
    <LessonStage>
      <LessonExitButton onClick={handleExit} />

      {/* Верхняя сцена: лягушка и облачко в одном flex-ряду, поэтому облачко
          всегда стоит справа от лягушки строго на уровне её рта.
          pt-… прижимает лапки лягушки к настилу мостика (мосток в фоне занимает
          ~27–32% высоты экрана), pb-… опускает рабочую зону под иллюстрацию. */}
      <div className="relative z-20 -ml-2 flex items-center gap-2 pl-0 pr-4 pb-[9vh] pt-[calc(30.5vh_-_6rem)]">
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

        {/* Облачко с заданием: только текст фразы, без эмодзи */}
        <div className="relative min-w-0 flex-1">
          <div className="relative rounded-2xl border-4 border-[#141D1C] bg-[#EFE1C6] p-3.5 text-[#141D1C]">
            {/* Хвостик облачка в тон фона и рамки — указывает на рот лягушки */}
            <span
              aria-hidden="true"
              className="absolute -left-[9px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-4 border-l-4 border-[#141D1C] bg-[#EFE1C6]"
            />
            <p className="min-w-0 font-app text-[17px] font-semibold leading-snug">
              {lesson.petPhrase}
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

          {selectedWords.map((word, index) => (
            <button
              key={`${word.id}-${index}`}
              type="button"
              disabled={isAnswerLocked}
              onClick={() => handleRemoveWord(index)}
              aria-label={`Убрать слово «${word.text}»`}
              className="relative z-10 flex min-h-[38px] select-none items-center rounded-xl border-2 border-[#141D1C] bg-[#EFE1C6] px-4 py-1 font-app text-sm leading-none text-[#141D1C] disabled:opacity-70"
            >
              {word.text}
            </button>
          ))}
        </div>

        {/* Слой 2: банк слов — по центру между полем ответа и нижней панелью.
            Рендерим все слова в исходном порядке, а выбранные заменяем невидимой
            «тенью» того же размера, чтобы остальные слова не сдвигались. */}
        <div className="my-auto mx-1.5 flex flex-wrap justify-center gap-x-3.5 gap-y-3.5">
          {lesson.words.map((word) => {
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
          {/* Обратная связь после проверки */}
          {isCorrect && (
            <div role="status" className="pixel-frame bg-app-accent-soft px-3 py-2.5">
              <p className="inline-block bg-app-accent px-2 py-1 font-display text-[12px] leading-none text-app-accent-contrast">
                Верно! 🎉
              </p>
              <p className="mt-1.5 font-app text-xs text-app-hint">
                +{lesson.xpReward} XP питомцу
              </p>
              <p className="mt-1 font-app text-xs text-app-text">
                Правильный перевод: {lesson.translation}
              </p>
            </div>
          )}
          {isWrong && (
            <div role="status" className="pixel-frame bg-app-card px-3 py-2.5">
              <p className="inline-block bg-app-danger px-2 py-1 font-display text-[12px] leading-none text-app-ink">
                Пока неверно
              </p>
              <p className="mt-1.5 font-app text-xs text-app-hint">
                Попытка {attempts}. Попробуй ещё раз или посмотри правильный перевод.
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
                  <span className="flex items-center justify-center gap-1.5">
                    Дальше
                    <span
                      aria-hidden="true"
                      className="h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-current"
                    />
                  </span>
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

export function LessonView() {
  const currentLesson = useLessonStore((state) =>
    state.currentLessonId === null
      ? undefined
      : state.lessons.find((lesson) => lesson.id === state.currentLessonId),
  );

  // Урок запущен — показываем экран прохождения, иначе — карту болота.
  return currentLesson === undefined ? <SwampMap /> : <LessonSession lesson={currentLesson} />;
}
