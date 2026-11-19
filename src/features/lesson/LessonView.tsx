import { useEffect, useMemo, useRef } from 'react';
import { FROG_IDLE_FRAME, getFrogFrameStyle } from '@/components/pet/petSprites';
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
import { useLessonStore, useUiStore } from '@/store';

/**
 * Карта главы в болотном стиле: заголовок и зигзагообразная змейка узлов,
 * построенная по реальному прогрессу уроков из lessonStore.
 *
 * Пройденные уроки (index < activeIndex) — кувшинка с тремя звёздами,
 * текущий (index === activeIndex) — активная кувшинка с лягушкой,
 * остальные (index > activeIndex) — заблокированные кувшинки с замком.
 * Линия пути считается динамически по тем же координатам, что и узлы.
 *
 * Экрану нужен полноэкранный слой поверх BottomNav, поэтому контейнер
 * зафиксирован во вьюпорте (fixed inset-0), а подложка прокручивается внутри.
 */

/** Три звезды над пройденным узлом: заполненные жёлтые и пустые серые. */
function StarRow({ filled }: { filled: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-6 left-1/2 flex -translate-x-1/2 items-end gap-1"
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

export function LessonView() {
  const lessons = useLessonStore((state) => state.lessons);
  const completedLessonIds = useLessonStore((state) => state.completedLessonIds);
  const startLesson = useLessonStore((state) => state.startLesson);

  // Первый непройденный урок — текущий. Если все уроки пройдены, findIndex вернёт -1,
  // и activeIndex становится lessons.length: активного узла нет, все узлы пройдены.
  const activeIndex = useMemo(() => {
    const found = lessons.findIndex((lesson) => !completedLessonIds.includes(lesson.id));
    return found === -1 ? lessons.length : found;
  }, [lessons, completedLessonIds]);

  // Зигзаг: центры кувшинок по вертикали — 40 + index * 128 (h-20 + gap-y-12),
  // по горизонтали — 104 для чётных и 184 для нечётных (контейнер w-72 = 288px).
  const pathD = useMemo(
    () =>
      lessons
        .map((_, index) => {
          const x = index % 2 === 0 ? 104 : 184;
          const y = 40 + index * 128;
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' '),
    [lessons],
  );

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
            {/* Белая пунктирная змейка по центрам кувшинок; координаты считаются из lessons */}
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

            <div className="relative flex flex-col items-center gap-y-12">
              {lessons.map((lesson, index) => {
                const isCompleted = index < activeIndex;
                const isActive = index === activeIndex;
                const isLocked = index > activeIndex;
                const isClickable = index <= activeIndex;
                // Чётные узлы уводим влево, нечётные — вправо: получается змейка.
                const offsetClassName = index % 2 === 0 ? '-translate-x-10' : 'translate-x-10';

                return (
                  <div
                    key={lesson.id}
                    className="relative z-10 flex h-20 w-full items-center justify-center"
                  >
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
                      className={`relative h-20 w-20 shrink-0 ${offsetClassName} ${
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
                          <img src={lilyActiveUrl} alt="" className="h-20 w-20 object-contain" />
                          {/* Лягушка — готовый спрайт питомца: масштаб 3 (84×48 px). */}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
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

                      {/* Боковая ветка «+МОНЕТЫ» у второго урока (только визуал) */}
                      {index === 1 && (
                        <div className="pointer-events-none absolute top-1/2 -left-24 flex -translate-y-1/2 flex-col items-center">
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
                      )}

                      {/* Боковая ветка «+ЛУТ» у четвёртого урока (только визуал) */}
                      {index === 3 && (
                        <div className="pointer-events-none absolute top-1/2 -right-20 flex -translate-y-1/2 flex-col items-center">
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
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
