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
import { useUiStore } from '@/store';

/**
 * Статичная карта главы в болотном стиле: заголовок, змейка из пяти узлов
 * и боковые ответвления «+МОНЕТЫ» / «+ЛУТ».
 *
 * Пока это только вёрстка: прогресс, переходы и lessonStore не подключены.
 * Экрану нужен полноэкранный слой поверх BottomNav, поэтому контейнер
 * зафиксирован во вьюпорте (fixed inset-0), а подложка прокручивается внутри.
 */

/** Три звезды над пройденным узлом: заполненные жёлтые и пустые серые. */
function StarRow({ filled }: { filled: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-8 left-1/2 -ml-1 flex -translate-x-1/2 translate-y-1 items-end gap-1"
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
            {/* Белая пунктирная змейка: центры кувшинок сверху вниз и ветки к наградам */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            >
              <path
                d="M 104 40 L 184 168 L 144 296 L 104 424 L 184 552 M 144 296 H 40 M 144 296 H 248"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="6,6"
                strokeLinecap="round"
              />
            </svg>

            <div className="relative flex flex-col items-center gap-y-12">
              {/* 1. Пройденный урок: три жёлтые звезды */}
              <div className="relative z-10 flex w-full justify-center">
                <div
                  className="relative -translate-x-10"
                  role="img"
                  aria-label="Пройденный урок: 3 из 3 звёзд"
                >
                  <StarRow filled={3} />
                  <img src={lilyDefaultUrl} alt="" className="h-20 w-20 object-contain" />
                </div>
              </div>

              {/* 2. Пройденный урок: две звезды из трёх */}
              <div className="relative z-10 flex w-full justify-center">
                <div
                  className="relative translate-x-10"
                  role="img"
                  aria-label="Пройденный урок: 2 из 3 звёзд"
                >
                  <StarRow filled={2} />
                  <img src={lilyDefaultUrl} alt="" className="h-20 w-20 object-contain" />
                </div>
              </div>

              {/* 3. Текущий урок: лягушка на активной кувшинке и ответвления по бокам */}
              <div className="relative z-10 flex w-full items-center justify-center">
                <div className="absolute left-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
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

                <div className="relative" role="img" aria-label="Текущий урок: лягушка на кувшинке">
                  <img src={lilyActiveUrl} alt="" className="h-20 w-20 object-contain" />
                  {/* Лягушка — готовый спрайт питомца: масштаб 3 (84×48 px), чтобы поместиться на кувшинке 80×80. */}
                  <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center">
                    <div
                      aria-hidden="true"
                      className="sprite-frame pixelated -translate-x-2 -translate-y-2"
                      style={getFrogFrameStyle('idle', FROG_IDLE_FRAME, 3)}
                    />
                  </div>
                </div>

                <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
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
              </div>

              {/* 4. Следующий открытый урок: только кувшинка, без замка */}
              <div className="relative z-10 flex w-full justify-center">
                <div className="relative -translate-x-10" role="img" aria-label="Следующий урок">
                  <img src={lilyDefaultUrl} alt="" className="h-20 w-20 object-contain" />
                </div>
              </div>

              {/* 5. Заблокированный урок */}
              <div className="relative z-10 flex w-full justify-center">
                <div className="relative translate-x-10" role="img" aria-label="Урок заблокирован">
                  <img src={lilyLockedUrl} alt="" className="h-20 w-20 object-contain" />
                  <img
                    src={lockUrl}
                    alt=""
                    className="absolute left-1/2 top-1/2 h-12 w-auto -translate-x-1/2 -translate-y-1/2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
