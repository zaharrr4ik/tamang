import { useUiStore } from '@/store';
import { useUiFeedback } from './hooks/useUiFeedback';

/**
 * Кнопка возврата в главное меню нижней зоны.
 * Показывается во всех вкладках, кроме самой вкладки «menu».
 * Пиксельная кнопка: 2px ink-рамка, жёсткая тень, tap target ≥ 44px.
 */
export function BackButton() {
  const backToMenu = useUiStore((state) => state.backToMenu);
  const { playSound, vibrate } = useUiFeedback();

  const handleClick = (): void => {
    playSound('tap');
    vibrate('light');
    backToMenu();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Вернуться в главное меню"
      className="pixel-btn-sm flex min-h-[44px] select-none items-center justify-center gap-1.5 bg-app-card px-2.5 font-display text-[13px] leading-none text-app-text"
    >
      {/* Стрелка — CSS-треугольник: в Mediocre Cartoon нет глифа «←» (см. README §10.1). */}
      <span
        aria-hidden="true"
        className="h-0 w-0 shrink-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-app-text"
      />
      Назад
    </button>
  );
}
