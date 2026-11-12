import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { TelegramUser } from '@/types';
import type { TelegramWebApp } from './types';
import type { TelegramContextValue, TelegramHapticType } from './useTelegram';
import { TelegramContext } from './useTelegram';

/** Цветовая схема приложения. */
type ColorScheme = 'light' | 'dark';

/** Ключ события смены темы в SDK. */
const THEME_EVENT = 'themeChanged';

/** Достаёт WebApp из window.Telegram, если SDK успел загрузиться. */
function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const webApp = window.Telegram?.WebApp;
  if (!webApp || typeof webApp.ready !== 'function') {
    return null;
  }
  return webApp;
}

/**
 * Определяет, запущено ли приложение реально внутри Telegram.
 * Скрипт SDK подключается на всех страницах, поэтому одного наличия WebApp мало:
 * признак живого клиента — непустые initData или известная платформа.
 */
function detectTelegram(webApp: TelegramWebApp | null): boolean {
  if (!webApp) {
    return false;
  }
  if (webApp.initData !== '') {
    return true;
  }
  const platform = webApp.platform;
  return typeof platform === 'string' && platform !== '' && platform !== 'unknown';
}

/** Системная цветовая схема браузера (фолбэк вне Telegram). */
function getPreferredScheme(): ColorScheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Схема из SDK с защитой от неожиданных значений. */
function getWebAppScheme(webApp: TelegramWebApp): ColorScheme {
  return webApp.colorScheme === 'dark' ? 'dark' : 'light';
}

/** Читает пользователя из initDataUnsafe с проверкой обязательных полей. */
function readUser(webApp: TelegramWebApp | null): TelegramUser | null {
  const candidate = webApp?.initDataUnsafe?.user;
  if (!candidate || typeof candidate.id !== 'number' || typeof candidate.first_name !== 'string') {
    return null;
  }
  return candidate;
}

/** Применяет цветовую схему к <html>: класс .dark и data-theme для CSS-токенов. */
function applyColorScheme(scheme: ColorScheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', scheme === 'dark');
  root.setAttribute('data-theme', scheme);
}

/**
 * Провайдер Telegram-окружения.
 * Внутри Telegram инициализирует SDK и синхронизирует тему с клиентом,
 * вне Telegram — использует системную тему и отдаёт isTelegram=false.
 */
export function TelegramProvider({ children }: { children: ReactNode }): JSX.Element {
  const webApp = useMemo(() => getWebApp(), []);
  const isTelegram = useMemo(() => detectTelegram(webApp), [webApp]);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() =>
    isTelegram && webApp ? getWebAppScheme(webApp) : getPreferredScheme(),
  );

  // Инициализация SDK. Методы безопасны и вне Telegram, но вызываем их только при наличии WebApp.
  useEffect(() => {
    if (!webApp) {
      return;
    }
    try {
      webApp.ready();
      webApp.expand();
      webApp.disableVerticalSwipes?.();

      const { header_bg_color: headerColor, bg_color: bgColor } = webApp.themeParams;
      if (headerColor) {
        webApp.setHeaderColor?.(headerColor);
      }
      if (bgColor) {
        webApp.setBackgroundColor?.(bgColor);
      }
    } catch {
      // Старые клиенты могут не поддерживать часть методов — приложение продолжает работать.
    }
  }, [webApp]);

  // Синхронизация темы: внутри Telegram — из SDK с подпиской на themeChanged,
  // вне Telegram — из системных настроек с медиа-запросом.
  useEffect(() => {
    if (webApp && isTelegram) {
      const syncTheme = (): void => {
        setColorScheme(getWebAppScheme(webApp));
      };
      syncTheme();
      webApp.onEvent(THEME_EVENT, syncTheme);
      return () => {
        webApp.offEvent(THEME_EVENT, syncTheme);
      };
    }

    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (): void => {
      setColorScheme(mediaQuery.matches ? 'dark' : 'light');
    };
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [webApp, isTelegram]);

  // Применяем тему к документу при каждом изменении.
  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  const haptic = useCallback(
    (type: TelegramHapticType) => {
      const feedback = webApp?.HapticFeedback;
      if (!feedback) {
        return;
      }
      try {
        if (type === 'success' || type === 'error' || type === 'warning') {
          feedback.notificationOccurred(type);
        } else {
          feedback.impactOccurred(type);
        }
      } catch {
        // Вне Telegram и на старых клиентах вибрация может быть недоступна — это не ошибка.
      }
    },
    [webApp],
  );

  const user = useMemo(() => (isTelegram ? readUser(webApp) : null), [isTelegram, webApp]);

  const value = useMemo<TelegramContextValue>(
    () => ({ isTelegram, webApp, colorScheme, user, haptic }),
    [isTelegram, webApp, colorScheme, user, haptic],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}
