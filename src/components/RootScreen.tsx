import { useEffect } from 'react';
import { usePetStore, useSettingsStore, useUiStore } from '@/store';
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
  const registerVisit = usePetStore((state) => state.registerVisit);

  // Синхронизируем флаг аудио-сервиса с настройкой пользователя:
  // сам сервис — общий (lib/audio), настройка — глобальный стейт.
  useEffect(() => {
    audioService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Отмечаем заход в приложение: серия дней (streak) обновляется один раз в день.
  useEffect(() => {
    registerVisit();
  }, [registerVisit]);

  return screen === 'start' ? <StartScreen /> : <MainScreen />;
}
