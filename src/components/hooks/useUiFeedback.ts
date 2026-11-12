import { useCallback } from 'react';
import { useSettingsStore } from '@/store';
import { useTelegram } from '@/lib/telegram';
import { audioService } from '@/lib/audio';
import type { SoundId } from '@/types';

/** Типы тактильного отклика, поддерживаемые Telegram (совпадают с useTelegram().haptic). */
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

/**
 * Единая точка обратной связи интерфейса: звук и вибрация.
 *
 * Хук уважает пользовательские настройки: если звук или вибрация выключены
 * в настройках, соответствующая реакция не срабатывает.
 */
export function useUiFeedback() {
  const { haptic } = useTelegram();
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  /** Воспроизвести звук, если звук включён в настройках. */
  const playSound = useCallback(
    (sound: SoundId) => {
      if (soundEnabled) {
        audioService.play(sound);
      }
    },
    [soundEnabled],
  );

  /** Дать тактильный отклик, если вибрация включена в настройках. */
  const vibrate = useCallback(
    (type: HapticType = 'light') => {
      if (hapticsEnabled) {
        haptic(type);
      }
    },
    [haptic, hapticsEnabled],
  );

  return { playSound, vibrate };
}
