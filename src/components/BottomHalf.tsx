import { getBottomTab } from '@/modules/registry';
import { useUiStore } from '@/store';
import { BackButton } from './BackButton';

/**
 * Нижняя половина главного экрана — динамическая зона вкладок.
 * Пиксельная панель: жёсткий 3px контур сверху, без скруглений и размытий.
 *
 * Скролл включён только для открытых вкладок (урок/магазин/настройки).
 * Меню рендерится без скролл-контейнера: h-full внутри flex-зоны, поэтому
 * три кнопки всегда помещаются на экран высотой 568px.
 */
export function BottomHalf() {
  const bottomTab = useUiStore((state) => state.bottomTab);
  const tab = getBottomTab(bottomTab);
  const { Component } = tab;
  const isMenu = bottomTab === 'menu';

  return (
    <section
      aria-label="Динамическая зона вкладок"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t-3 border-app-ink bg-app-bg"
    >
      {!isMenu && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1 pt-3">
          <BackButton />
          <span className="truncate font-display text-[9px] uppercase tracking-wide text-app-text">
            {tab.title}
          </span>
        </div>
      )}

      {isMenu ? (
        /* Меню: без overflow-y-auto — контент обязан вписаться в зону. */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-3">
          <Component />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(var(--app-safe-bottom)+1.25rem)] pt-3">
          <Component />
        </div>
      )}
    </section>
  );
}
