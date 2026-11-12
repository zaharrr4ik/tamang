import { create } from 'zustand';
import type { AppScreen, BottomTabId } from '@/types';

/**
 * Состояние навигации: экран приложения и активная вкладка нижней зоны.
 * Не персистится: при перезапуске приложение всегда начинается с экрана запуска.
 */
export interface UiStoreState {
  /** Текущий экран: старт (яйцо) или главный. */
  screen: AppScreen;
  /** Активная вкладка динамической нижней зоны. */
  bottomTab: BottomTabId;
  /** Переключить экран. */
  setScreen(screen: AppScreen): void;
  /** Начать игру: экран -> 'main', вкладка -> 'menu'. */
  start(): void;
  /** Открыть вкладку нижней зоны. */
  openTab(tab: BottomTabId): void;
  /** Вернуться в главное меню вкладок. */
  backToMenu(): void;
}

export const useUiStore = create<UiStoreState>()((set) => ({
  screen: 'start',
  bottomTab: 'menu',

  setScreen: (screen) => set({ screen }),

  start: () => set({ screen: 'main', bottomTab: 'menu' }),

  openTab: (tab) => set({ bottomTab: tab }),

  backToMenu: () => set({ bottomTab: 'menu' }),
}));
