import { useState } from 'react';
import { PET_CONFIG } from '@/data/petConfig';
import { usePetStore, useSettingsStore } from '@/store';
import { useUiFeedback } from '../hooks/useUiFeedback';

/**
 * Питомец-эмодзи на сцене.
 * Клик по питомцу вызывает petStore.petClick() (настроение/здоровье + выражение)
 * и тактильный отклик через useTelegram. Выражение берётся из стейта.
 */
export function PetStage() {
  const expression = usePetStore((state) => state.expression);
  const petClick = usePetStore((state) => state.petClick);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const { playSound, vibrate } = useUiFeedback();

  // Счётчик кликов нужен, чтобы pop-анимация проигрывалась заново на каждый тап,
  // даже если выражение уже стало 'happy'.
  const [hitCount, setHitCount] = useState(0);

  const emoji = PET_CONFIG.expressions[expression] ?? '🐥';

  const handlePetClick = (): void => {
    setHitCount((count) => count + 1);
    petClick();
    vibrate('light');
    playSound('tap');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <button
        type="button"
        onClick={handlePetClick}
        aria-label="Погладить питомца"
        className="relative flex select-none items-center justify-center rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
      >
        <span
          className={`pet-emoji-shadow relative block ${
            animationsEnabled ? 'animate-float' : ''
          }`}
        >
          <span
            key={`${expression}-${hitCount}`}
            aria-hidden="true"
            className={`block text-[clamp(4.25rem,19vw,6.5rem)] leading-none ${
              animationsEnabled ? 'animate-pop' : ''
            }`}
          >
            {emoji}
          </span>
        </span>
        {/* Мягкая «тень-земля» под питомцем */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full bg-app-border blur-[2px]"
        />
      </button>
      <p className="text-[11px] text-app-hint">Тапни, чтобы погладить</p>
    </div>
  );
}
