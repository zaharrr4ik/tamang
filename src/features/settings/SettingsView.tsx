import { useEffect, useState } from 'react';
import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { useTelegram } from '@/lib/telegram';
import { useLessonStore, usePetStore, useSettingsStore } from '@/store';

/** Версия приложения показывается в блоке «О приложении». */
const APP_VERSION = '0.1.0';

interface ToggleRowProps {
  label: string;
  hint: string;
  emoji: string;
  checked: boolean;
  onChange: () => void;
  /** Учитывать настройку анимаций для плавного переключения. */
  animated: boolean;
}

/** Строка-переключатель: одна настройка в виде switch-кнопки. */
function ToggleRow({ label, hint, emoji, checked, onChange, animated }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center gap-3 py-3 text-left"
    >
      <span aria-hidden="true" className="text-xl">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-app-text">{label}</span>
        <span className="block text-[11px] leading-snug text-app-hint">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full ${
          checked ? 'bg-app-accent' : 'bg-app-border'
        } ${animated ? 'transition-colors duration-200' : ''}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-app-card shadow-app ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          } ${animated ? 'transition-transform duration-200' : ''}`}
        />
      </span>
    </button>
  );
}

type ResetTarget = 'pet' | 'progress';

/**
 * Настройки: звук, вибрация, анимации, сброс данных и информация о приложении.
 * Подтверждение сброса — локальный UI-стейт (инлайн-диалог), без alert/confirm.
 */
export function SettingsView() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const toggleSound = useSettingsStore((state) => state.toggleSound);
  const toggleHaptics = useSettingsStore((state) => state.toggleHaptics);
  const toggleAnimations = useSettingsStore((state) => state.toggleAnimations);

  const resetPet = usePetStore((state) => state.resetPet);
  const resetProgress = useLessonStore((state) => state.resetProgress);

  const { isTelegram, haptic } = useTelegram();
  const { playSound, vibrate } = useUiFeedback();

  // Какое действие сейчас подтверждается (null — ни одно).
  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);
  // Короткое уведомление после успешного сброса.
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (notice === null) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleToggleSound = (): void => {
    toggleSound();
    vibrate('light');
  };

  const handleToggleHaptics = (): void => {
    toggleHaptics();
    // Вибрацию даём сразу после включения, в обход проверки настройки:
    // useUiFeedback ещё видит старое значение hapticsEnabled = false.
    if (!hapticsEnabled) {
      haptic('light');
    }
  };

  const handleToggleAnimations = (): void => {
    toggleAnimations();
    playSound('tap');
    vibrate('light');
  };

  const handleAskReset = (target: ResetTarget): void => {
    playSound('tap');
    vibrate('light');
    setResetTarget(target);
  };

  const handleCancelReset = (): void => {
    vibrate('light');
    setResetTarget(null);
  };

  const handleConfirmReset = (): void => {
    if (resetTarget === 'pet') {
      resetPet();
      setNotice('Питомец сброшен к начальному состоянию');
    } else if (resetTarget === 'progress') {
      resetProgress();
      setNotice('Прогресс уроков сброшен');
    }
    setResetTarget(null);
    playSound('tap');
    vibrate('success');
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-app-text">Настройки</h2>
        <p className="text-sm text-app-hint">Настрой приложение под себя.</p>
      </header>

      {notice !== null && (
        <div
          role="status"
          className="rounded-app-sm border border-app-success bg-app-card px-3 py-2 text-xs font-semibold text-app-success shadow-app"
        >
          {notice}
        </div>
      )}

      <section className="rounded-app border border-app-border bg-app-bg p-4 shadow-app">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-app-hint">
          Ощущения и анимации
        </h3>
        <div className="mt-1 divide-y divide-app-border">
          <ToggleRow
            label="Звук"
            hint="Короткие сигналы на действия"
            emoji="🔊"
            checked={soundEnabled}
            onChange={handleToggleSound}
            animated={animationsEnabled}
          />
          <ToggleRow
            label="Вибрация"
            hint="Тактильный отклик внутри Telegram"
            emoji="📳"
            checked={hapticsEnabled}
            onChange={handleToggleHaptics}
            animated={animationsEnabled}
          />
          <ToggleRow
            label="Анимации"
            hint="Плавные движения питомца и переходы"
            emoji="✨"
            checked={animationsEnabled}
            onChange={handleToggleAnimations}
            animated={animationsEnabled}
          />
        </div>
      </section>

      <section className="rounded-app border border-app-border bg-app-bg p-4 shadow-app">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-app-hint">
          Сброс данных
        </h3>
        <p className="mt-1 text-[11px] leading-snug text-app-hint">
          Действия необратимы — прогресс хранится только на этом устройстве.
        </p>

        <div className="mt-3 space-y-2">
          {resetTarget === 'pet' ? (
            <div className="rounded-app-sm border border-app-danger bg-app-card p-3">
              <p className="text-xs font-semibold text-app-text">
                Сбросить питомца? Имя, статы и надетые предметы вернутся к началу.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelReset}
                  className="flex-1 rounded-app-sm border border-app-border bg-app-bg px-3 py-2 text-xs font-semibold text-app-text"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 rounded-app-sm border border-app-danger px-3 py-2 text-xs font-bold text-app-danger"
                >
                  Да, сбросить
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAskReset('pet')}
              className="w-full rounded-app-sm border border-app-danger px-3 py-2.5 text-xs font-bold text-app-danger active:scale-[0.99]"
            >
              🐣 Сбросить питомца
            </button>
          )}

          {resetTarget === 'progress' ? (
            <div className="rounded-app-sm border border-app-danger bg-app-card p-3">
              <p className="text-xs font-semibold text-app-text">
                Сбросить прогресс уроков? Все пройденные уроки снова станут доступны как новые.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelReset}
                  className="flex-1 rounded-app-sm border border-app-border bg-app-bg px-3 py-2 text-xs font-semibold text-app-text"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 rounded-app-sm border border-app-danger px-3 py-2 text-xs font-bold text-app-danger"
                >
                  Да, сбросить
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAskReset('progress')}
              className="w-full rounded-app-sm border border-app-danger px-3 py-2.5 text-xs font-bold text-app-danger active:scale-[0.99]"
            >
              📖 Сбросить прогресс уроков
            </button>
          )}
        </div>
      </section>

      <section className="rounded-app border border-app-border bg-app-bg p-4 shadow-app">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-app-hint">
          О приложении
        </h3>
        <p className="mt-2 text-sm font-bold text-app-text">Таманг · версия {APP_VERSION}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-app-hint">
          Тамагочи для изучения языков: собирай переводы фраз, получай XP и наряжай питомца.
          Стек: React 18, TypeScript, Zustand, Tailwind CSS.
        </p>
        <p className="mt-2 text-[11px] font-semibold text-app-hint">
          {isTelegram ? '✅ Запущено внутри Telegram' : '🌐 Открыто в браузере (вне Telegram)'}
        </p>
      </section>
    </div>
  );
}
