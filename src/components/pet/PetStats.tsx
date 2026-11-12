import { PET_CONFIG } from '@/data/petConfig';
import { usePetStore, useSettingsStore } from '@/store';

interface StatBarProps {
  /** Подпись стата. */
  label: string;
  /** Эмодзи-иконка стата. */
  emoji: string;
  /** Текущее значение 0..100. */
  value: number;
  /** Класс цвета заливки (только токены bg-app-*). */
  toneClass: string;
  /** Длительность анимации полоски. */
  animated: boolean;
}

/** Полоска одного стата: подпись, число и шкала. */
function StatBar({ label, emoji, value, toneClass, animated }: StatBarProps) {
  const safeValue = Math.min(PET_CONFIG.maxStat, Math.max(PET_CONFIG.minStat, value));
  const percent = (safeValue / PET_CONFIG.maxStat) * 100;

  return (
    <div className="rounded-app-sm border border-app-border bg-app-card px-3 py-2 shadow-app">
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[11px] font-semibold text-app-hint">
          <span aria-hidden="true">{emoji}</span> {label}
        </span>
        <span className="text-xs font-bold tabular-nums text-app-text">
          {Math.round(safeValue)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={PET_CONFIG.maxStat}
        aria-valuenow={Math.round(safeValue)}
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-app-border"
      >
        <div
          className={`h-full rounded-full ${toneClass} ${animated ? 'transition-[width] duration-300' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Базовые статы питомца: Health и Mood.
 * Показывает числа и полоски, значения ограничены конфигом PET_CONFIG.
 */
export function PetStats() {
  const stats = usePetStore((state) => state.stats);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);

  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      <StatBar
        label="Здоровье"
        emoji="❤️"
        value={stats.health}
        toneClass="bg-app-success"
        animated={animationsEnabled}
      />
      <StatBar
        label="Настроение"
        emoji="😊"
        value={stats.mood}
        toneClass="bg-app-accent"
        animated={animationsEnabled}
      />
    </div>
  );
}
