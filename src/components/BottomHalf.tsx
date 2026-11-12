import { getBottomTab } from '@/modules/registry';
import { useUiStore } from '@/store';
import { BackButton } from './BackButton';

/**
 * Нижняя половина главного экрана — динамическая зона.
 * Здесь рендерится вкладка из реестра: меню, урок, магазин или настройки.
 * Контент скроллится внутри зоны, safe-area снизу учтён.
 */
export function BottomHalf() {
  const bottomTab = useUiStore((state) => state.bottomTab);
  const tab = getBottomTab(bottomTab);
  const { Component } = tab;
  const isMenu = bottomTab === 'menu';

  return (
    <section
      aria-label="Динамическая зона вкладок"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-app border-t border-app-border bg-app-card shadow-app"
    >
      {!isMenu && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3">
          <BackButton />
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-app-hint">
            {tab.emoji} {tab.title}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(var(--app-safe-bottom)+1.25rem)] pt-3">
        <Component />
      </div>
    </section>
  );
}
