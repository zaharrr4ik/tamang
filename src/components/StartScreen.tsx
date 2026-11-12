import { useSettingsStore, useUiStore } from '@/store';
import { useUiFeedback } from './hooks/useUiFeedback';

/**
 * Стартовый экран: крупное яйцо по центру и кнопка «Play!».
 * Яйцо нарисовано на CSS (без бинарных ассетов): форма скорлупы,
 * пятна, блик и милая мордашка. Анимация отключается настройкой.
 */
export function StartScreen() {
  const start = useUiStore((state) => state.start);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const { playSound, vibrate } = useUiFeedback();

  const handleStart = (): void => {
    playSound('tap');
    vibrate('light');
    start();
  };

  return (
    /*
     * Родитель (App.tsx) — h-full overflow-hidden, поэтому скроллится сам main.
     * Внутренняя обёртка с min-h-full центрирует контент, когда места хватает,
     * и позволяет прокручивать его, когда экран низкий.
     */
    <main className="start-gradient h-full overflow-y-auto">
      <div className="flex min-h-full flex-col items-center justify-center gap-7 px-6 pb-[calc(var(--app-safe-bottom)+1.5rem)] pt-[calc(var(--app-safe-top)+1.5rem)]">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-app-hint">
            Тамагочи для изучения языков
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-app-text">Таманг</h1>
        </header>

        <div className="relative flex flex-col items-center">
          {/* Яйцо адаптивное: высота зависит от экрана, ширина — из пропорций 3:4. */}
          <div
            className={`relative h-[clamp(11rem,30vh,16rem)] aspect-[3/4] ${animationsEnabled ? 'egg-bob' : ''}`}
            aria-hidden="true"
          >
            <div className="egg-body absolute inset-0">
              {/* Пятна на скорлупе */}
              <span className="egg-spot left-[20%] top-[30%] h-6 w-5 -rotate-12" />
              <span className="egg-spot left-[57%] top-[19%] h-4 w-4 rotate-6" />
              <span className="egg-spot left-[45%] top-[55%] h-5 w-6 rotate-12" />
              <span className="egg-spot left-[70%] top-[46%] h-3 w-4 -rotate-6" />
              <span className="egg-spot left-[31%] top-[66%] h-3 w-3 rotate-45" />
              {/* Блик */}
              <span className="egg-shine left-[24%] top-[14%] h-16 w-8 -rotate-12" />
              {/* Мордашка */}
              <span className="absolute left-[41%] top-[52%] h-2.5 w-2.5 rounded-full bg-app-text" />
              <span className="absolute left-[57%] top-[52%] h-2.5 w-2.5 rounded-full bg-app-text" />
              <span className="absolute left-[49%] top-[60%] h-1.5 w-3 rounded-full bg-app-accent" />
            </div>
          </div>

          {/* Кнопка «Play!» лежит поверх нижней части яйца. */}
          <button
            type="button"
            onClick={handleStart}
            className={`relative z-10 -mt-9 inline-flex items-center gap-2 rounded-app bg-app-accent px-10 py-3.5 text-xl font-extrabold uppercase tracking-wide text-app-accent-contrast shadow-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent ${
              animationsEnabled ? 'transition-transform active:scale-95' : ''
            }`}
          >
            Play!
          </button>
        </div>

        <p className="max-w-[17rem] text-center text-sm leading-relaxed text-app-hint">
          Нажми «Play!», чтобы вылупиться, знакомиться с питомцем и учить слова вместе с ним.
        </p>
      </div>
    </main>
  );
}
