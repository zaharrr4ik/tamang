import type { AudioService, SoundId } from '@/types';

/**
 * Заглушка аудио-сервиса для каркаса.
 * Интерфейс из types/index.ts зафиксирован: позже сюда можно подключить
 * Web Audio API / HTMLAudioElement (или нативный мост), не меняя вызывающий код.
 *
 * Сейчас сервис осознанно ничего не воспроизводит: isSupported = false.
 * UI рендерит кнопки «прослушать» неактивными с пометкой «скоро».
 */

/** Флаг включённости звука, запоминается через setEnabled. */
let audioEnabled = true;

export const audioService: AudioService = {
  isSupported: false,

  setEnabled(enabled: boolean): void {
    audioEnabled = enabled;
  },

  play(_sound: SoundId): void {
    if (!audioEnabled) {
      return;
    }
    // Каркас: воспроизведения пока нет — точка расширения для реальных звуков.
  },

  playPhrase(_text: string, _lang?: string): Promise<boolean> {
    if (!audioEnabled) {
      return Promise.resolve(false);
    }
    // Каркас: озвучивание фраз появится позже (TTS/аудиофайлы).
    return Promise.resolve(false);
  },

  stopAll(): void {
    // Останавливать нечего — заглушка.
  },
};
