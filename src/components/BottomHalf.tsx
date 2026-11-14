import { getBottomTab } from '@/modules/registry';
import { useUiStore } from '@/store';
import { BackButton } from './BackButton';
import { BottomNav } from './BottomNav';

/**
 * Нижняя половина главного экрана — динамическая зона вкладок.
 * Пиксельная панель: жёсткий 3px контур сверху, без скруглений.
 *
 * Структура: контент зоны (flex-1, min-h-0) + постоянная нижняя навигация.
 * Для меню рисуется тёмная панель без прокрутки, для остальных вкладок —
 * шапка «Назад + название» и осознанно скроллируемый контент.
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
      {isMenu ? (
        /* Меню: тёмная панель на всю зону, без overflow-y-auto — контент вписывается. */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app-panel">
          <Component />
        </div>
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1 pt-3">
            <BackButton />
            <span className="truncate font-display text-[9px] uppercase tracking-wide text-app-text">
              {tab.title}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
            <Component />
          </div>
        </>
      )}

      <BottomNav />
    </section>
  );
}
