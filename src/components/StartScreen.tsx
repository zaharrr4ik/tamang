import startFrog from '@/assets/start-frog.png';
import { useSettingsStore, useUiStore } from '@/store';
import { useUiFeedback } from './hooks/useUiFeedback';

/**
 * Стартовый экран: только пиксельная лягушка-«устройство» по центру.
 * Никакого текста — тап по лягушке запускает приложение.
 * Фон — тёплая «комната» с мятным свечением и пиксельной сеткой (.retro-room-bg).
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
    <main className="retro-room-bg flex h-full items-center justify-center overflow-hidden px-6 pb-[calc(var(--app-safe-bottom)+1.5rem)] pt-[calc(var(--app-safe-top)+1.5rem)]">
      <button
        type="button"
        onClick={handleStart}
        aria-label="Открыть приложение"
        className={`select-none rounded-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-ink ${
          animationsEnabled ? 'transition-transform active:translate-y-1' : ''
        }`}
      >
        <img
          src={startFrog}
          alt=""
          draggable={false}
          className={`pixelated w-[min(86vw,380px)] ${
            animationsEnabled ? 'animate-pixel-bob' : ''
          }`}
        />
      </button>
    </main>
  );
}
