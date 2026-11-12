import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Ключ persist-хранилища настроек. */
export const SETTINGS_STORE_KEY = 'tamang.settings';

/** Пользовательские настройки приложения. */
export interface SettingsStoreState {
  /** Звуковые эффекты. */
  soundEnabled: boolean;
  /** Тактильная обратная связь. */
  hapticsEnabled: boolean;
  /** Анимации интерфейса. */
  animationsEnabled: boolean;
  toggleSound(): void;
  toggleHaptics(): void;
  toggleAnimations(): void;
  resetSettings(): void;
}

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  hapticsEnabled: true,
  animationsEnabled: true,
} as const;

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      soundEnabled: DEFAULT_SETTINGS.soundEnabled,
      hapticsEnabled: DEFAULT_SETTINGS.hapticsEnabled,
      animationsEnabled: DEFAULT_SETTINGS.animationsEnabled,

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),

      resetSettings: () =>
        set({
          soundEnabled: DEFAULT_SETTINGS.soundEnabled,
          hapticsEnabled: DEFAULT_SETTINGS.hapticsEnabled,
          animationsEnabled: DEFAULT_SETTINGS.animationsEnabled,
        }),
    }),
    {
      name: SETTINGS_STORE_KEY,
      version: 1,
    },
  ),
);
