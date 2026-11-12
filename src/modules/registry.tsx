import type { ComponentType } from 'react';
import type { BottomTabId, BottomTabModule } from '@/types';
import { LessonView } from '@/features/lesson/LessonView';
import { MenuView } from '@/features/menu/MenuView';
import { SettingsView } from '@/features/settings/SettingsView';
import { ShopView } from '@/features/shop/ShopView';

/**
 * Запись реестра вкладок нижней зоны.
 * Вкладка = метаданные модуля + компонент, который рендерится в динамической зоне.
 */
export interface BottomTabEntry extends BottomTabModule {
  Component: ComponentType;
}

/**
 * Все вкладки до сортировки.
 * Чтобы добавить вкладку: расширь BottomTabId в src/types/index.ts,
 * создай модуль в src/features/<module>/ и добавь запись сюда.
 */
const tabEntries: BottomTabEntry[] = [
  { id: 'menu', title: 'Меню', emoji: '🏠', order: 0, Component: MenuView },
  { id: 'lesson', title: 'Урок', emoji: '📖', order: 1, Component: LessonView },
  { id: 'shop', title: 'Магазин', emoji: '🛍️', order: 2, Component: ShopView },
  { id: 'settings', title: 'Настройки', emoji: '⚙️', order: 3, Component: SettingsView },
];

/** Реестр вкладок, отсортированный по order. */
export const bottomTabRegistry: BottomTabEntry[] = [...tabEntries].sort(
  (left, right) => left.order - right.order,
);

/** Быстрый доступ к вкладке по id (карта строится один раз). */
const bottomTabById = new Map<BottomTabId, BottomTabEntry>(
  bottomTabRegistry.map((tab): [BottomTabId, BottomTabEntry] => [tab.id, tab]),
);

/**
 * Возвращает вкладку по id.
 * Id берётся из BottomTabId, поэтому промах возможен только при рассинхроне реестра.
 */
export function getBottomTab(id: BottomTabId): BottomTabEntry {
  const entry = bottomTabById.get(id);
  if (!entry) {
    throw new Error(`Вкладка не найдена в реестре: ${id}`);
  }
  return entry;
}
