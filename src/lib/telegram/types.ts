import type { TelegramUser } from '@/types';

/**
 * Минимальная типизация официального SDK Telegram Mini Apps (window.Telegram.WebApp).
 *
 * Здесь описаны только те поля, которые реально нужны приложению.
 * Никаких `any`: неизвестные поля SDK просто не описываем, а методы, которых может
 * не быть в старых клиентах, помечены как опциональные.
 */

/** Параметры темы, которые приложение использует для нативной окраски. */
export interface TelegramThemeParams {
  bg_color?: string;
  secondary_bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  header_bg_color?: string;
}

/** Тактильная обратная связь (Bot API 6.1+). */
export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

/** Безопасные данные пользователя из initDataUnsafe. */
export interface TelegramInitDataUnsafe {
  user?: TelegramUser;
}

/** Минимальный срез официального SDK window.Telegram.WebApp. */
export interface TelegramWebApp {
  /** Подписанная строка с данными запуска; пустая вне Telegram. */
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  /** Платформа запуска: 'unknown' в обычном браузере. */
  platform?: string;
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent(event: string, handler: () => void): void;
  offEvent(event: string, handler: () => void): void;
  HapticFeedback?: TelegramHapticFeedback;
}

/** Глобальное пространство Telegram, которое создаёт официальный скрипт SDK. */
export interface TelegramNamespace {
  WebApp?: TelegramWebApp;
}

declare global {
  interface Window {
    Telegram?: TelegramNamespace;
  }
}
