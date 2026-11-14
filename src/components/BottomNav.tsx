import { bottomTabRegistry } from '@/modules/registry';
import { useUiStore } from '@/store';
import type { BottomTabId } from '@/types';
import { useUiFeedback } from './hooks/useUiFeedback';
import { PixelIcon } from './ui/PixelIcon';
import type { PixelIconName } from './ui/PixelIcon';

/** Иконка на каждую вкладку нижней навигации (сетка из icons.jpg/primer.png). */
const NAV_ICONS: Record<BottomTabId, PixelIconName> = {
  menu: 'lily',
  lesson: 'book',
  shop: 'chest',
  wardrobe: 'crown',
  settings: 'compass',
};

/** Вкладки полосы навигации: всё, что не помечено `inNav: false`. */
const navTabs = bottomTabRegistry.filter((tab) => tab.inNav !== false);

/**
 * Нижняя полоса навигации: постоянный элемент нижней половины экрана.
 * Вкладки берутся из реестра (в порядке `order`), активная подсвечена
 * светлым квадратом. Клик открывает вкладку через uiStore.openTab
 * и даёт звук/вибрацию с учётом настроек.
 */
export function BottomNav() {
  const bottomTab = useUiStore((state) => state.bottomTab);
  const openTab = useUiStore((state) => state.openTab);
  const { playSound, vibrate } = useUiFeedback();

  const handleOpen = (tab: BottomTabId): void => {
    playSound('tap');
    vibrate('light');
    openTab(tab);
  };

  return (
    <nav
      aria-label="Нижняя навигация"
      className="shrink-0 border-t-3 border-app-ink bg-app-nav pb-[var(--app-safe-bottom)]"
    >
      <div className="flex items-stretch px-1">
        {navTabs.map((tab) => {
          const isActive = tab.id === bottomTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleOpen(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'm-1 flex min-h-[56px] flex-1 select-none flex-col items-center justify-center gap-1',
                'rounded-app-sm px-1 py-1.5 leading-none',
                isActive ? 'bg-app-nav-active text-app-nav-active-text' : 'text-app-nav-text',
              ].join(' ')}
            >
              <PixelIcon name={NAV_ICONS[tab.id]} className="h-8 w-8" />
              <span className="font-display text-[10px] leading-none">{tab.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
