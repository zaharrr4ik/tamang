import { createContext, useContext } from 'react';
import type { TelegramUser } from '@/types';
import type { TelegramWebApp } from './types';

/** Тактильный отклик, поддерживаемый приложением. */
export type TelegramHapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

/** Публичное значение Telegram-контекста. */
export interface TelegramContextValue {
  /** true — приложение запущено внутри Telegram. */
  isTelegram: boolean;
  /** Экземпляр SDK или null, если скрипт не загрузился. */
  webApp: TelegramWebApp | null;
  /** Актуальная цветовая схема. */
  colorScheme: 'light' | 'dark';
  /** Пользователь Telegram (null вне Telegram). */
  user: TelegramUser | null;
  /** Тактильный отклик; безопасен вне Telegram (no-op). */
  haptic: (type: TelegramHapticType) => void;
}

/**
 * Контекст создаётся здесь, а не в провайдере, чтобы у хука и провайдера
 * не было циклического импорта.
 */
export const TelegramContext = createContext<TelegramContextValue | null>(null);

/**
 * Доступ к Telegram-окружению.
 * Обязателен внутри <TelegramProvider>.
 */
export function useTelegram(): TelegramContextValue {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram должен использоваться внутри <TelegramProvider>');
  }
  return context;
}
