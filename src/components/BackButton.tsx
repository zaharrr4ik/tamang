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
      className="pixel-btn-sm flex min-h-[44px] select-none items-center justify-center gap-1.5 bg-app-card px-2.5 font-display text-[10px] leading-none text-app-text"
    >
      <span aria-hidden="true">←</span>
      Назад
    </button>
  );
}
