import { useEffect } from 'react';
import { useSettingsStore, useUiStore } from '@/store';
import { audioService } from '@/lib/audio';
import { StartScreen } from './StartScreen';
import { MainScreen } from './MainScreen';

/**
 * Корневой роутер экранов.
 * Читает uiStore.screen и переключает стартовый экран и главный.
 */
export function RootScreen() {
  const screen = useUiStore((state) => state.screen);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);

  // Синхронизируем флаг аудио-сервиса с настройкой пользователя:
  // сам сервис — общий (lib/audio), настройка — глобальный стейт.
  useEffect(() => {
    audioService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  return screen === 'start' ? <StartScreen /> : <MainScreen />;
}
