import { useUiStore } from '@/store';
import { useUiFeedback } from './hooks/useUiFeedback';

/**
 * Кнопка возврата в главное меню нижней зоны.
 * Показывается во всех вкладках, кроме самой вкладки «menu».
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
      className="inline-flex items-center gap-1.5 rounded-app-sm border border-app-border bg-app-bg px-3 py-1.5 text-sm font-semibold text-app-text active:scale-95"
    >
      <span aria-hidden="true">←</span>
      Назад
    </button>
  );
}
