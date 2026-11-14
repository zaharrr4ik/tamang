import { PixelIcon } from '@/components/ui/PixelIcon';
import { getLevelProgress } from '@/data/petConfig';
import { usePetStore } from '@/store';

/** Ниже какого заполнения шкалы текст на заливке переключается с тёмного на светлый. */
const INK_TEXT_FROM_PERCENT = 25;

/**
 * Верхний HUD питомца: три тёмные плашки в ряд на тёмной полосе устройства.
 *
 * 1) уровень — шкала прогресса внутри текущего уровня (`getLevelProgress`);
 * 2) огонёк — серия ежедневных заходов (`streak`);
 * 3) монеты — запас монет (`coins`).
 *
 * Ширины плашек повторяют макет: уровень ~44% полосы, огонёк и монеты по ~28%.
 */
export function PetHud() {
  const totalXp = usePetStore((state) => state.totalXp);
  const coins = usePetStore((state) => state.coins);
  const streak = usePetStore((state) => state.streak);

  const progress = getLevelProgress(totalXp);
  const levelTextClass =
    progress.percent >= INK_TEXT_FROM_PERCENT ? 'text-app-ink' : 'text-app-panel-text';

  return (
    <div className="flex h-[34px] items-stretch gap-1.5">
      {/* Уровень: тёмная шкала с зелёной заливкой прогресса и подписью поверх неё. */}
      <div className="pixel-plate relative min-w-0 flex-[1.6] overflow-hidden bg-app-level-track">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-app-level-fill"
          style={{ width: `${progress.percent}%` }}
        />
        <span
          className={`relative flex h-full items-center px-2 font-display text-[12px] leading-none ${levelTextClass}`}
        >
          Ур. {progress.level}
        </span>
      </div>

      {/* Серия заходов: пиксельный огонёк + число дней. */}
      <div className="pixel-plate flex min-w-0 flex-1 items-center justify-center gap-1 bg-app-panel px-1">
        <PixelIcon name="fire" className="h-6 w-6" />
        <span className="font-display text-[13px] leading-none text-app-panel-text">{streak}</span>
      </div>

      {/* Баланс монет: пиксельная монета + число. */}
      <div className="pixel-plate flex min-w-0 flex-1 items-center justify-center gap-1 bg-app-panel px-1">
        <PixelIcon name="coin" className="h-6 w-6" />
        <span className="font-display text-[13px] leading-none text-app-panel-text">{coins}</span>
      </div>
    </div>
  );
}
