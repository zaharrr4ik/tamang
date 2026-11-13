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

/** Строка-переключатель: одна настройка в виде пиксельного switch. */
function ToggleRow({ label, hint, emoji, checked, onChange, animated }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex min-h-[56px] w-full items-center gap-3 py-2.5 text-left"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-xl"
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-app text-sm font-bold text-app-text">{label}</span>
        <span className="mt-0.5 block font-app text-[11px] leading-snug text-app-hint">
          {hint}
        </span>
      </span>
      {/* Пиксельный тумблер: ink-рамка, квадратный бегунок, без сглаживания. */}
      <span
        aria-hidden="true"
        className={[
          'relative h-7 w-12 shrink-0 border-2 border-app-ink',
          checked ? 'bg-app-accent' : 'bg-app-card',
          animated ? 'transition-colors duration-200' : '',
        ].join(' ')}
      >
        <span
          className={[
            'absolute left-0.5 top-0.5 h-5 w-5 border-2 border-app-ink bg-app-card',
            checked ? 'translate-x-[20px]' : 'translate-x-0',
            animated ? 'transition-transform duration-200' : '',
          ].join(' ')}
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
    <div className="space-y-3">
      <header className="space-y-1">
        <h2 className="font-display text-xs leading-relaxed text-app-text">Настройки</h2>
        <p className="font-app text-[11px] leading-snug text-app-hint">
          Настрой приложение под себя.
        </p>
      </header>

      {notice !== null && (
        <div
          role="status"
          className="pixel-chip bg-app-accent-soft px-3 py-2 font-app text-xs font-semibold text-app-text"
        >
          {notice}
        </div>
      )}

      <section className="pixel-frame bg-app-card p-3">
        <h3 className="font-display text-[9px] uppercase leading-relaxed text-app-hint">
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

      <section className="pixel-frame bg-app-card p-3">
        <h3 className="font-display text-[9px] uppercase leading-relaxed text-app-hint">
          Сброс данных
        </h3>
        <p className="mt-1 font-app text-[11px] leading-snug text-app-hint">
          Действия необратимы — прогресс хранится только на этом устройстве.
        </p>

        <div className="mt-3 space-y-2">
          {resetTarget === 'pet' ? (
            <div className="pixel-frame-sm bg-app-card p-2.5">
              <p className="font-app text-xs font-semibold leading-snug text-app-text">
                Сбросить питомца? Имя, статы и надетые предметы вернутся к началу.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelReset}
                  className="pixel-btn-sm flex min-h-[44px] flex-1 items-center justify-center bg-app-card px-2 font-app text-xs font-semibold text-app-text"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="pixel-btn-sm flex min-h-[44px] flex-1 items-center justify-center bg-app-danger px-2 font-app text-xs font-bold text-app-ink"
                >
                  Да, сбросить
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAskReset('pet')}
              className="pixel-btn-sm flex min-h-[44px] w-full items-center justify-center gap-1.5 bg-app-card px-2 font-app text-xs font-bold text-app-danger"
            >
              🐣 Сбросить питомца
            </button>
          )}

          {resetTarget === 'progress' ? (
            <div className="pixel-frame-sm bg-app-card p-2.5">
              <p className="font-app text-xs font-semibold leading-snug text-app-text">
                Сбросить прогресс уроков? Все пройденные уроки снова станут доступны как новые.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelReset}
                  className="pixel-btn-sm flex min-h-[44px] flex-1 items-center justify-center bg-app-card px-2 font-app text-xs font-semibold text-app-text"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="pixel-btn-sm flex min-h-[44px] flex-1 items-center justify-center bg-app-danger px-2 font-app text-xs font-bold text-app-ink"
                >
                  Да, сбросить
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleAskReset('progress')}
              className="pixel-btn-sm flex min-h-[44px] w-full items-center justify-center gap-1.5 bg-app-card px-2 font-app text-xs font-bold text-app-danger"
            >
              📖 Сбросить прогресс уроков
            </button>
          )}
        </div>
      </section>

      <section className="pixel-frame bg-app-card p-3">
        <h3 className="font-display text-[9px] uppercase leading-relaxed text-app-hint">
          О приложении
        </h3>
        <p className="mt-2 font-display text-[9px] leading-relaxed text-app-text">
          Таманг · версия {APP_VERSION}
        </p>
        <p className="mt-2 font-app text-[11px] leading-relaxed text-app-hint">
          Тамагочи для изучения языков: собирай переводы фраз, получай XP и наряжай питомца.
          Стек: React 18, TypeScript, Zustand, Tailwind CSS.
        </p>
        <p className="mt-2 font-app text-[11px] font-semibold text-app-hint">
          {isTelegram ? '✅ Запущено внутри Telegram' : '🌐 Открыто в браузере (вне Telegram)'}
        </p>
      </section>
    </div>
  );
}
