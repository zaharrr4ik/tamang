import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { PixelButton } from '@/components/ui/PixelButton';
import type { PixelButtonTone } from '@/components/ui/PixelButton';
import { useUiStore } from '@/store';
import type { BottomTabId } from '@/types';

interface MenuAction {
  tab: BottomTabId;
  title: string;
  tone: PixelButtonTone;
}

/** Три крупных действия главного меню: тон задаёт цвет Duolingo-кнопки. */
const MENU_ACTIONS: readonly MenuAction[] = [
  { tab: 'lesson', title: 'Урок', tone: 'green' },
  { tab: 'shop', title: 'Магазин', tone: 'blue' },
  { tab: 'settings', title: 'Настройки', tone: 'yellow' },
];

/**
 * Меню нижней зоны: ровно три чанки-кнопки без заголовка, иконок и описаний.
 * flex-1 min-h-0 на каждой кнопке + justify-center на колонке — все три
 * всегда помещаются в зону без скролла (даже на 568px по высоте).
 * Клик открывает вкладку через uiStore.openTab и даёт звук/вибрацию.
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
    <div className="flex h-full min-h-0 flex-col justify-center gap-3">
      {MENU_ACTIONS.map((action) => (
        <PixelButton
          key={action.tab}
          tone={action.tone}
          onClick={() => handleOpen(action.tab)}
          className="min-h-0 w-full flex-1 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-ink"
        >
          <span className="font-display text-[11px] uppercase tracking-wide">
            {action.title}
          </span>
        </PixelButton>
      ))}
    </div>
  );
}
