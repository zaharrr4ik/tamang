import { PET_CONFIG } from '@/data/petConfig';
import { usePetStore, useSettingsStore } from '@/store';

interface StatBarProps {
  /** Подпись стата. */
  label: string;
  /** Текущее значение 0..100. */
  value: number;
  /** Класс цвета заливки (только токены bg-app-*). */
  toneClass: string;
  /** Длительность анимации полоски. */
  animated: boolean;
}

/** Полоска одного стата в пиксельной рамке: подпись, число и жёсткая шкала. */
function StatBar({ label, value, toneClass, animated }: StatBarProps) {
  const safeValue = Math.min(PET_CONFIG.maxStat, Math.max(PET_CONFIG.minStat, value));
  const percent = (safeValue / PET_CONFIG.maxStat) * 100;

  return (
    <div className="pixel-frame-sm bg-app-card px-2 py-1.5">
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-app-hint">
          {label}
        </span>
        <span className="font-display text-[9px] leading-none tabular-nums text-app-text">
          {Math.round(safeValue)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={PET_CONFIG.maxStat}
        aria-valuenow={Math.round(safeValue)}
        className="mt-1.5 h-2 w-full overflow-hidden border-2 border-app-ink bg-app-screen-deep"
      >
        <div
          className={`h-full ${toneClass} ${animated ? 'transition-[width] duration-300' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Базовые статы питомца: Здоровье и Настроение.
 * Сейчас временно скрыт из UI (PetHalf его не рендерит), но компонент
 * сохранён и оформлен в пиксельной системе — вернём в следующей итерации.
 */
export function PetStats() {
  const stats = usePetStore((state) => state.stats);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatBar
        label="Здоровье"
        value={stats.health}
        toneClass="bg-app-success"
        animated={animationsEnabled}
      />
      <StatBar
        label="Настроение"
        value={stats.mood}
        toneClass="bg-app-accent"
        animated={animationsEnabled}
      />
    </div>
  );
}
