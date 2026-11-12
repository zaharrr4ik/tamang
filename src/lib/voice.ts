import type { Unsubscribe, VoiceInputService } from '@/types';

/**
 * Заглушка сервиса голосового ввода для каркаса.
 * Интерфейс из types/index.ts зафиксирован: позже здесь может появиться
 * Web Speech API или нативный мост Telegram, без правок вызывающего кода.
 *
 * Сейчас isSupported = false, микрофон не запрашивается.
 * UI рендерит кнопку «голосом» неактивной с пометкой «скоро».
 */
export const voiceInputService: VoiceInputService = {
  isSupported: false,
  isListening: false,

  start(): Promise<boolean> {
    // Каркас: распознавание речи ещё не подключено.
    return Promise.resolve(false);
  },

  stop(): void {
    // Слушание не начиналось — останавливать нечего.
  },

  onResult(_callback: (text: string) => void): Unsubscribe {
    // Подписчиков пока нет, но возвращаем корректную функцию отписки.
    return () => {
      // Отписываться не от чего.
    };
  },
};
