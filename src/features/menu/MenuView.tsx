import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { useUiStore } from '@/store';
import type { BottomTabId } from '@/types';

interface MenuAction {
  tab: BottomTabId;
  title: string;
  emoji: string;
  description: string;
  /** Класс подложки иконки (только токены). */
  accentClass: string;
}

/** Крупные действия главного меню. */
const MENU_ACTIONS: MenuAction[] = [
  {
    tab: 'lesson',
    title: 'Урок',
    emoji: '📖',
    description: 'Собери перевод фразы из слов и получи XP',
    accentClass: 'bg-app-accent-soft',
  },
  {
    tab: 'shop',
    title: 'Магазин',
    emoji: '🛍️',
    description: 'Наряды и аксессуары для питомца',
    accentClass: 'bg-app-accent-soft',
  },
  {
    tab: 'settings',
    title: 'Настройки',
    emoji: '⚙️',
    description: 'Звук, вибрация, анимации и сброс прогресса',
    accentClass: 'bg-app-accent-soft',
  },
];

/**
 * Меню нижней зоны: три крупные кнопки — Урок, Магазин, Настройки.
 * Клик открывает соответствующую вкладку через uiStore.openTab.
 */
export function MenuView() {
  const openTab = useUiStore((state) => state.openTab);
  const { playSound, vibrate } = useUiFeedback();

  const handleOpen = (tab: BottomTabId): void => {
    playSound('tap');
    vibrate('light');
    openTab(tab);
  };

  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-app-text">Чем займёмся?</h2>
        <p className="text-sm text-app-hint">
          Выбери действие — питомец останется наверху, где и был.
        </p>
      </header>

      <div className="space-y-2.5">
        {MENU_ACTIONS.map((action) => (
          <button
            key={action.tab}
            type="button"
            onClick={() => handleOpen(action.tab)}
            className="flex w-full items-center gap-3 rounded-app border border-app-border bg-app-bg px-4 py-3.5 text-left shadow-app transition-transform active:scale-[0.99]"
          >
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-app-sm text-2xl ${action.accentClass}`}
            >
              {action.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-app-text">{action.title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-app-hint">
                {action.description}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-lg text-app-hint">
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
